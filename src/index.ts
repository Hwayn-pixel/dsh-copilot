/// <reference types="node" />
/**
 * dsh-copilot — Host half.
 *
 * A co-pilot for the agent's instructions. It does three things, and nothing else:
 *
 *   1. **Read** — `ctx.systemPrompt.assemble()` returns the prompt as *sections*, and the route
 *      `GET /dsh-copilot/prompt` hands that to the settings page, so the prompt stops being one
 *      opaque block of text and becomes a list you can look at.
 *   2. **Contribute** — the user's own rules are registered as ordinary prompt sections
 *      (`copilot:pre` / `copilot:mid` / `copilot:post`), each one a *provider* that reads the
 *      current settings at assembly time. That is why editing a rule needs no reload: the next
 *      assembly simply sees the new text.
 *   3. **Never surprise you** — every contribution comes from this plugin's own section names, so
 *      disposing the plugin removes all of them. It never rewrites another plugin's section.
 *
 * The section names are deliberately *not* `deployment:persona-prefix`-style shadows: a co-pilot
 * adds a voice, it does not silently replace the pilot's.
 */
import z from "@deepseek-ai/schemastery";

export const name = "dsh-copilot";
export const SETTINGS_NAMESPACE = "ui-copilot";

const ROUTE_PREFIX = "/dsh-copilot";
const NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Where a rule lands in the assembled prompt. The values are chosen from the order slots DSH
 * documents (`dsh-system-prompt`'s SECTION_ORDERS): after the deployment persona, after the tool
 * sections, and at the very end — the three places a "house rule" usually wants to be.
 */
export const BANDS = { pre: 700, mid: 5500, post: 10150 } as const;
export type BandName = keyof typeof BANDS;
export const BAND_LABEL: Record<BandName, string> = {
  pre: "靠前（persona 之后、工具说明之前）",
  mid: "中间（工具说明之后）",
  post: "靠后（prompt 最末尾）",
};

function settingsNamespace(value: string): string {
  if (!NAMESPACE_PATTERN.test(value)) {
    throw new TypeError(`settings namespace "${value}" must match ${String(NAMESPACE_PATTERN)}`);
  }
  return value;
}

const RuleSchema = z.object({
  id: z.string().default("").description("规则 id（用于界面排序，可留空自动生成）"),
  title: z.string().default("").description("标题：只给你自己看，不会进 prompt"),
  text: z.string().default("").description("真正写进 system prompt 的文字"),
  band: z.union([z.const("pre"), z.const("mid"), z.const("post")]).default("mid").description("安放位置"),
  enabled: z.boolean().default(true).description("启用这条规则"),
});

export const CopilotSchema = z
  .object({
    enabled: z.boolean().default(true).description("总开关：关闭后 dsh-copilot 不再往 prompt 里写任何字"),
    rules: z.array(RuleSchema).default([]).description("你自己的家规：每条落进 prompt 的一个位置"),
  })
  .description("dsh-copilot：看清并改写 agent 的 system prompt");

interface SettingsLike {
  get(ns: string): unknown;
  register?(ns: string, schema: unknown): unknown;
}

interface HostContext {
  get?(name: string): unknown;
  inject(services: readonly string[], fn: (ctx: HostContext) => void): unknown;
  effect(fn: () => unknown, label?: string): unknown;
  systemPrompt?: SystemPromptLike;
}

interface SystemPromptLike {
  section(section: { name: string; order: number; text: string | ((context: unknown) => string) }): () => void;
  assemble(context?: unknown): Promise<{ sections: { name: string; text: string }[]; contexts: unknown[]; tools: unknown[] }>;
}

interface RuleValue {
  id?: string;
  title?: string;
  text?: string;
  band?: BandName;
  enabled?: boolean;
}

interface CopilotValue {
  enabled?: boolean;
  rules?: RuleValue[];
}

const DEFAULTS: CopilotValue = { enabled: true, rules: [] };

function readValue(settings: SettingsLike | undefined): CopilotValue {
  try {
    const raw = settings?.get(SETTINGS_NAMESPACE);
    if (raw && typeof raw === "object") return { ...DEFAULTS, ...(raw as CopilotValue) };
  } catch {
    /* the settings service may not be attached yet — fall back to defaults */
  }
  return DEFAULTS;
}

/** Join the enabled rules of one band into the text of that section. Empty text adds nothing. */
export function bandText(value: CopilotValue, band: BandName): string {
  if (value.enabled === false) return "";
  const rules = (value.rules ?? []).filter(
    (rule) => rule && rule.enabled !== false && (rule.band ?? "mid") === band && String(rule.text ?? "").trim(),
  );
  if (!rules.length) return "";
  const blocks = rules.map((rule) => {
    const title = String(rule.title ?? "").trim();
    const text = String(rule.text ?? "").trim();
    return title ? `### ${title}\n${text}` : text;
  });
  return `## House rules (dsh-copilot, ${band})\n${blocks.join("\n\n")}`;
}

export function apply(ctx: HostContext): void {
  ctx.inject(["settings"], (settingsCtx) => {
    (settingsCtx as unknown as { settings: SettingsLike }).settings.register?.(
      settingsNamespace(SETTINGS_NAMESPACE),
      CopilotSchema,
    );
  });

  /** The settings service can attach after us, so always resolve it lazily. */
  const settingsOf = (): SettingsLike | undefined =>
    ((ctx.get ? ctx.get("settings") : undefined) ?? undefined) as SettingsLike | undefined;

  // Sections are registered once; their *text* is a provider, evaluated at every assembly.
  ctx.inject(["systemPrompt"], (sp) => {
    const prompt = (sp as unknown as { systemPrompt: SystemPromptLike }).systemPrompt;
    sp.effect(
      () => {
        const disposers = (Object.keys(BANDS) as BandName[]).map((band) =>
          prompt.section({
            name: `copilot:${band}`,
            order: BANDS[band],
            text: () => bandText(readValue(settingsOf()), band),
          }),
        );
        return () => {
          for (const dispose of disposers) {
            try {
              dispose();
            } catch {
              /* already gone */
            }
          }
        };
      },
      "dsh-copilot: contribute house rules",
    );
  });

  ctx.inject(["webServer"], (httpCtx) => {
    const server = (
      httpCtx as unknown as {
        webServer: {
          register(route: { kind: "prefix"; path: string; handler: (req: any, res: any) => void | Promise<void> }): () => void;
        };
      }
    ).webServer;

    httpCtx.effect(
      () =>
        server.register({
          kind: "prefix",
          path: ROUTE_PREFIX,
          handler: async (req: any, res: any) => {
            const url = new URL(req.url ?? "/", "http://local");
            const ok = (status: number, body: unknown) => {
              const payload = JSON.stringify(body);
              res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
              res.end(payload);
            };
            try {
              if (req.method === "GET" && url.pathname === `${ROUTE_PREFIX}/prompt`) {
                const prompt = ((ctx.get ? ctx.get("systemPrompt") : undefined) ?? httpCtx.get?.("systemPrompt")) as
                  | SystemPromptLike
                  | undefined;
                if (!prompt || typeof prompt.assemble !== "function") {
                  return ok(503, { ok: false, error: "systemPrompt 服务还没就绪" });
                }
                const assembly = await prompt.assemble();
                const sections = (assembly.sections ?? []).map((s) => ({
                  name: String(s.name),
                  bytes: Buffer.byteLength(String(s.text ?? ""), "utf8"),
                  text: String(s.text ?? ""),
                }));
                let rendered = "";
                try {
                  // Present only when the package resolves from the profile; the plain join below is
                  // the same shape minus `{{variable}}` interpolation.
                  const mod = (await import("@deepseek-ai/dsh-system-prompt")) as {
                    renderPrompt?: (a: unknown) => string;
                  };
                  if (typeof mod.renderPrompt === "function") rendered = mod.renderPrompt(assembly);
                } catch {
                  /* fall through to the simple join */
                }
                if (!rendered) {
                  rendered = sections
                    .filter((s) => s.text.trim())
                    .map((s) => s.text.trim())
                    .join("\n\n");
                }
                const value = readValue(settingsOf());
                return ok(200, {
                  ok: true,
                  enabled: value.enabled !== false,
                  sections,
                  rendered,
                  bytes: Buffer.byteLength(rendered, "utf8"),
                  sectionBytes: sections.reduce((sum, s) => sum + s.bytes, 0),
                  tools: (assembly.tools ?? []).length,
                  contexts: (assembly.contexts ?? []).length,
                  ours: (value.rules ?? []).length,
                  bands: BANDS,
                });
              }
              return ok(404, { ok: false, error: `no route ${req.method} ${url.pathname}` });
            } catch (error) {
              return ok(500, { ok: false, error: String((error as Error)?.message ?? error) });
            }
          },
        }),
      "dsh-copilot: prompt route",
    );
  });
}
