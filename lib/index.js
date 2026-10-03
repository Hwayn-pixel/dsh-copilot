/// <reference types="node" />
/**
 * dsh-prompt-desk — Host half.
 *
 * A co-pilot does four things, and this half does all four:
 *
 *   1. **Reads the instruments** — `ctx.systemPrompt.assemble()` returns the prompt as *sections*,
 *      and `/dsh-prompt-desk/prompt` hands that to the settings page. The prompt stops being one
 *      opaque block and becomes a list you can look at.
 *   2. **Writes the pilot's voice** — the user's rules are registered as ordinary prompt sections
 *      (`copilot:pre` / `copilot:mid` / `copilot:post`), each one a *provider* that reads the
 *      current settings at assembly time. Editing a rule needs no reload.
 *   3. **Keeps the logbook** — every change to the rules is recorded (what, when, how big), so a
 *      version can be read back and restored. A co-pilot remembers.
 *   4. **Never surprises you** — every contribution carries this plugin's own section names, so
 *      disposing the plugin removes all of them. It never rewrites another plugin's section.
 */
import z from "@deepseek-ai/schemastery";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
export const name = "dsh-prompt-desk";
export const SETTINGS_NAMESPACE = "ui-prompt-desk";
const ROUTE_PREFIX = "/dsh-prompt-desk";
const NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*$/;
const HISTORY_KEEP = 40;
/**
 * Where a rule lands in the assembled prompt — three of DSH's free order slots
 * (`dsh-system-prompt`'s SECTION_ORDERS): after the deployment persona, after the tool sections,
 * and at the very end. The three places a house rule usually wants to be.
 */
export const BANDS = { pre: 700, mid: 5500, post: 10150 };
export const BAND_LABEL = {
    pre: "Front (after the persona, before the tool descriptions)",
    mid: "Middle (after the tool descriptions)",
    post: "Back (at the very end of the prompt)",
};
function settingsNamespace(value) {
    if (!NAMESPACE_PATTERN.test(value)) {
        throw new TypeError(`settings namespace "${value}" must match ${String(NAMESPACE_PATTERN)}`);
    }
    return value;
}
const RuleSchema = z.object({
    id: z.string().default("").description("Rule id (used for ordering in the UI; may be left empty)"),
    title: z.string().default("").description("Title: for your own reference only, never enters the prompt"),
    text: z.string().default("").description("The text actually written into the system prompt"),
    band: z.union([z.const("pre"), z.const("mid"), z.const("post")]).default("mid").description("Where the rule is placed"),
    enabled: z.boolean().default(true).description("Enable this rule"),
});
export const CopilotSchema = z
    .object({
    enabled: z.boolean().default(true).description("Master switch: when off, dsh-prompt-desk writes nothing into the prompt"),
    rules: z.array(RuleSchema).default([]).description("Your own house rules: each one lands in one band of the prompt"),
})
    .description("dsh-prompt-desk: see, rewrite and remember the agent's system prompt");
const DEFAULTS = { enabled: true, rules: [] };
// ── the logbook ─────────────────────────────────────────────────────────────
const history = [];
let lastSignature = "";
let flushTimer = null;
function historyFile() {
    return join(process.env.DSH_HOME || join(homedir(), ".dsh"), "prompt-desk", "history.json");
}
function loadHistory() {
    try {
        const parsed = JSON.parse(readFileSync(historyFile(), "utf8"));
        if (Array.isArray(parsed)) {
            history.push(...parsed.slice(-HISTORY_KEEP));
            const last = history[history.length - 1];
            if (last)
                lastSignature = signatureOf(last.rules);
        }
    }
    catch {
        /* no logbook yet — that is the normal first run */
    }
}
function activeRules(value) {
    return (value.rules ?? []).filter((rule) => rule && rule.enabled !== false && String(rule.text ?? "").trim());
}
function signatureOf(rules) {
    return JSON.stringify(rules.map((rule) => [rule.id ?? "", rule.title ?? "", rule.band ?? "mid", rule.text ?? ""]));
}
/** Record the rules whenever they actually change. Cheap: one string compare per assembly. */
function record(value) {
    const active = activeRules(value);
    const signature = signatureOf(active);
    if (signature === lastSignature)
        return;
    lastSignature = signature;
    history.push({
        at: Date.now(),
        bytes: Buffer.byteLength(active.map((rule) => String(rule.text ?? "")).join("\n"), "utf8"),
        count: active.length,
        titles: active.map((rule) => String(rule.title ?? "").trim().slice(0, 24) || "(untitled)"),
        rules: active.map((rule) => ({ ...rule })),
    });
    while (history.length > HISTORY_KEEP)
        history.shift();
    if (flushTimer)
        clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
        try {
            mkdirSync(dirname(historyFile()), { recursive: true });
            writeFileSync(historyFile(), JSON.stringify(history.slice(-HISTORY_KEEP), null, 1), "utf8");
        }
        catch {
            /* the logbook is a convenience, never a failure */
        }
    }, 700);
}
/** Rough cost of a prompt: ~3.6 UTF-8 bytes per token for mixed English/Chinese prose. */
function estimateTokens(bytes) {
    return Math.round(bytes / 3.6);
}
function readValue(settings) {
    try {
        const raw = settings?.get(SETTINGS_NAMESPACE);
        if (raw && typeof raw === "object")
            return { ...DEFAULTS, ...raw };
    }
    catch {
        /* the settings service may not be attached yet */
    }
    return DEFAULTS;
}
/** Join the enabled rules of one band into that section's text. Empty text adds nothing. */
export function bandText(value, band) {
    if (value.enabled === false)
        return "";
    const rules = activeRules(value).filter((rule) => (rule.band ?? "mid") === band);
    if (!rules.length)
        return "";
    const blocks = rules.map((rule) => {
        const title = String(rule.title ?? "").trim();
        const text = String(rule.text ?? "").trim();
        return title ? `### ${title}\n${text}` : text;
    });
    return `## House rules (dsh-prompt-desk, ${band})\n${blocks.join("\n\n")}`;
}
export function apply(ctx) {
    loadHistory();
    ctx.inject(["settings"], (settingsCtx) => {
        settingsCtx.settings.register?.(settingsNamespace(SETTINGS_NAMESPACE), CopilotSchema);
    });
    /** The settings service can attach after us, so always resolve it lazily. */
    const settingsOf = () => (ctx.get ? ctx.get("settings") : undefined);
    // Sections are registered once; their text is a provider, evaluated at every assembly.
    ctx.inject(["systemPrompt"], (sp) => {
        const prompt = sp.systemPrompt;
        sp.effect(() => {
            const disposers = Object.keys(BANDS).map((band) => prompt.section({
                name: `copilot:${band}`,
                order: BANDS[band],
                text: () => {
                    const value = readValue(settingsOf());
                    if (band === "pre")
                        record(value); // one pass per assembly is enough to notice a change
                    return bandText(value, band);
                },
            }));
            return () => {
                for (const dispose of disposers) {
                    try {
                        dispose();
                    }
                    catch {
                        /* already gone */
                    }
                }
            };
        }, "dsh-prompt-desk: contribute house rules");
    });
    ctx.inject(["webServer"], (httpCtx) => {
        const server = httpCtx.webServer;
        httpCtx.effect(() => server.register({
            kind: "prefix",
            path: ROUTE_PREFIX,
            handler: async (req, res) => {
                const url = new URL(req.url ?? "/", "http://local");
                const ok = (status, body) => {
                    const payload = JSON.stringify(body);
                    res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
                    res.end(payload);
                };
                try {
                    const prompt = ((ctx.get ? ctx.get("systemPrompt") : undefined) ?? httpCtx.get?.("systemPrompt"));
                    // GET /dsh-prompt-desk/prompt — the real assembled prompt, as sections plus one string.
                    if (req.method === "GET" && url.pathname === `${ROUTE_PREFIX}/prompt`) {
                        if (!prompt || typeof prompt.assemble !== "function") {
                            return ok(503, { ok: false, error: "the systemPrompt service is not ready yet" });
                        }
                        const assembly = await prompt.assemble();
                        const sections = (assembly.sections ?? []).map((s) => ({
                            name: String(s.name),
                            bytes: Buffer.byteLength(String(s.text ?? ""), "utf8"),
                            text: String(s.text ?? ""),
                        }));
                        let rendered = "";
                        try {
                            // Present only when the package resolves from the profile; the join below is the
                            // same shape minus `{{variable}}` interpolation.
                            const mod = (await import("@deepseek-ai/dsh-system-prompt"));
                            if (typeof mod.renderPrompt === "function")
                                rendered = mod.renderPrompt(assembly);
                        }
                        catch {
                            /* fall through */
                        }
                        if (!rendered) {
                            rendered = sections.filter((s) => s.text.trim()).map((s) => s.text.trim()).join("\n\n");
                        }
                        const value = readValue(settingsOf());
                        const bytes = Buffer.byteLength(rendered, "utf8");
                        return ok(200, {
                            ok: true,
                            enabled: value.enabled !== false,
                            sections,
                            rendered,
                            bytes,
                            tokens: estimateTokens(bytes),
                            sectionBytes: sections.reduce((sum, s) => sum + s.bytes, 0),
                            tools: (assembly.tools ?? []).length,
                            contexts: (assembly.contexts ?? []).length,
                            ours: activeRules(value).length,
                            bands: BANDS,
                            bandLabel: BAND_LABEL,
                        });
                    }
                    // GET /dsh-prompt-desk/history — the logbook, newest last.
                    if (req.method === "GET" && url.pathname === `${ROUTE_PREFIX}/history`) {
                        const value = readValue(settingsOf());
                        record(value);
                        return ok(200, { ok: true, entries: history, current: signatureOf(activeRules(value)) });
                    }
                    return ok(404, { ok: false, error: `no route ${req.method} ${url.pathname}` });
                }
                catch (error) {
                    return ok(500, { ok: false, error: String(error?.message ?? error) });
                }
            },
        }), "dsh-prompt-desk: prompt routes");
    });
}
