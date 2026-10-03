/**
 * dsh-prompt-desk — Browser half.
 *
 * One settings page ("提示词工作台"):
 *   · **检查单** — the numbers a co-pilot calls out before takeoff (sections, bytes, tokens/turn)
 *   · **当前 system prompt** — the real assembled prompt, as sections or as one string
 *   · **我的家规** — write your own voice into the prompt; takes effect on the next turn
 *   · **航线** — one-click rule templates
 *   · **黑匣子** — every change, with one-click restore
 *   · **体检** — what repeats, what is huge, what is empty. Facts only.
 *
 * `React.createElement` rather than JSX: this file is transpiled straight to CommonJS for the
 * client-module loader, which has no JSX pass.
 */
import * as React from "react";

const h = React.createElement;
const NS = "ui-prompt-desk";
const ROUTE = "/dsh-prompt-desk";
const STYLE_ID = "dsh-prompt-desk-style";

// `remote` is the typert RPC namespace that exists in both 0.1.x and the 0.2 desktop app, and
// `ctx.remote.settings` is its settings face. (The old `settingsScope` service was dropped in 0.2 -
// declaring it left the plugin "pending (waiting for service: settingsScope)" forever there. And
// accessing `ctx.remote` without declaring `remote` in `inject` throws
// `cannot get property "remote" without inject` - which is how we learned the exact name.)
export const inject = ["slots", "remote"];

type Band = "pre" | "mid" | "post";
interface Rule {
  id?: string;
  title?: string;
  text?: string;
  band?: Band;
  enabled?: boolean;
}
interface Value {
  enabled?: boolean;
  rules?: Rule[];
}
interface Scope<T> {
  getSnapshot(): { value?: T; status?: string };
  set(key: string, value: unknown): Promise<unknown>;
  subscribe(fn: () => void): () => void;
}
interface HistoryEntry {
  at: number;
  bytes: number;
  count: number;
  titles: string[];
  rules: Rule[];
}

const BANDS: { id: Band; label: string }[] = [
  { id: "pre", label: "靠前 · persona 之后" },
  { id: "mid", label: "中间 · 工具说明之后" },
  { id: "post", label: "靠后 · prompt 末尾" },
];

/** 航线：现成的一句话，点一下就上路。 */
const ROUTES: { title: string; text: string; band: Band }[] = [
  { title: "先给结论", text: "回答前先给结论，再给理由。", band: "mid" },
  { title: "不确定就说不确定", text: "不确定的地方要明说，不要编造。", band: "mid" },
  { title: "用中文回答", text: "用中文回答，除非我要求别的语言。", band: "pre" },
  { title: "改动前先备份", text: "修改我已有的文件之前，先做备份。", band: "mid" },
  { title: "少用列表", text: "多用完整的句子，少用分点列表。", band: "post" },
  { title: "别急着动我的东西", text: "要动我正在使用的服务或文件之前，先问我一句。", band: "pre" },
];

const CSS = `
/* 幻弈的设计语言：柔和、有呼吸；层次靠「光」和「间距」，不靠「线」。 */
.dshCo-root{
  --co-r-xs:6px;--co-r-sm:10px;--co-r-md:14px;--co-r-lg:20px;--co-pill:999px;
  --co-tone:rgba(128,128,128,.055);--co-tone-2:rgba(128,128,128,.10);--co-tone-3:rgba(128,128,128,.16);
  --co-line:1px solid rgba(128,128,128,.18);
  --co-accent:rgba(48,126,222,.9);
  --co-sh-1:0 1px 2px rgba(0,0,0,.05);
  --co-t:.18s ease;
  display:flex;flex-direction:column;gap:16px;font-size:13.5px;line-height:1.65
}
/* 卡片：不画边，用底色 + 一点点浮起 */
.dshCo-card{background:var(--co-tone);border-radius:var(--co-r-md);padding:16px 18px;box-shadow:var(--co-sh-1);transition:background var(--co-t)}
.dshCo-card:hover{background:var(--co-tone-2)}
.dshCo-head{display:flex;align-items:center;gap:10px}
.dshCo-h{font-size:15px;font-weight:600;letter-spacing:.01em}
.dshCo-h--fox::before{content:"🦊";font-size:13px;margin-right:6px;opacity:.85}
.dshCo-sub{font-size:12px;opacity:.62}
.dshCo-grow{flex:1}
.dshCo-stats{display:flex;gap:22px;flex-wrap:wrap;font-size:12px;opacity:.72;margin-top:12px}
.dshCo-stat{display:flex;align-items:baseline;gap:5px}
.dshCo-stat b{font-size:18px;font-weight:650;opacity:1;letter-spacing:-.01em}
.dshCo-btn{border:var(--co-line);border-radius:var(--co-r-sm);padding:5px 12px;font:inherit;font-size:12.5px;background:transparent;color:inherit;cursor:pointer;transition:background var(--co-t),border-color var(--co-t),color var(--co-t),filter var(--co-t)}
.dshCo-btn:hover{background:var(--co-tone-2);border-color:rgba(128,128,128,.28)}
.dshCo-btn:focus-visible,.dshCo-chip:focus-visible,.dshCo-in:focus-visible,.dshCo-sel:focus-visible,.dshCo-ta:focus-visible{outline:2px solid var(--co-accent);outline-offset:1px}
.dshCo-btn[disabled]{opacity:.45;cursor:default}
.dshCo-btn--go{border-color:transparent;background:var(--co-accent);color:#fff}
.dshCo-btn--go:hover{background:var(--co-accent);filter:brightness(1.06)}
.dshCo-chip{border:var(--co-line);border-radius:var(--co-pill);padding:4px 12px;font-size:12px;background:transparent;color:inherit;cursor:pointer;transition:background var(--co-t),border-color var(--co-t)}
.dshCo-chip:hover{background:var(--co-tone-2);border-color:rgba(128,128,128,.3)}
.dshCo-sec{border-top:var(--co-line);padding:8px 2px;cursor:pointer;border-radius:var(--co-r-sm);transition:background var(--co-t)}
.dshCo-sec:first-child{border-top:0}
.dshCo-sec:hover{background:var(--co-tone-2)}
.dshCo-secTop{display:flex;align-items:baseline;gap:8px;font-size:12.5px}
.dshCo-secName{font-family:ui-monospace,Consolas,monospace;font-size:11.5px}
.dshCo-secBy{margin-left:auto;opacity:.55;font-size:11px}
.dshCo-pre{margin:8px 0 2px;padding:11px 13px;border-radius:var(--co-r-sm);background:var(--co-tone-2);white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,Consolas,monospace;font-size:11.5px;line-height:1.55;max-height:340px;overflow:auto}
.dshCo-rule{border:var(--co-line);border-radius:var(--co-r-md);padding:11px 13px;margin-top:10px;transition:background var(--co-t),border-color var(--co-t)}
.dshCo-rule:hover{border-color:rgba(128,128,128,.26)}
.dshCo-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dshCo-in,.dshCo-sel,.dshCo-ta{font:inherit;font-size:12.5px;padding:6px 10px;border-radius:var(--co-r-sm);border:var(--co-line);background:var(--co-tone);color:inherit;transition:background var(--co-t),border-color var(--co-t)}
.dshCo-in:hover,.dshCo-ta:hover,.dshCo-sel:hover{background:var(--co-tone-2)}
.dshCo-in:focus,.dshCo-ta:focus,.dshCo-sel:focus{background:var(--co-tone-2);border-color:rgba(128,128,128,.3)}
.dshCo-in{flex:1;min-width:120px}
.dshCo-ta{width:100%;min-height:84px;margin-top:8px;resize:vertical;line-height:1.6;font-family:inherit}
.dshCo-x{border:0;background:transparent;color:inherit;opacity:.5;cursor:pointer;font-size:15px;padding:2px 7px;border-radius:var(--co-r-sm);transition:opacity var(--co-t),background var(--co-t)}
.dshCo-x:hover{opacity:1;background:var(--co-tone-3)}
.dshCo-hint{display:flex;gap:9px;align-items:flex-start;font-size:12.5px;padding:5px 0}
.dshCo-dot{width:7px;height:7px;border-radius:50%;margin-top:7px;flex:0 0 auto;box-shadow:0 0 0 3px rgba(128,128,128,.10)}
.dshCo-empty{font-size:12.5px;opacity:.6;padding:4px 0}
.dshCo-tag{font-size:11px;padding:1px 8px;border-radius:var(--co-pill);background:var(--co-tone-3)}
.dshCo-log{border-top:var(--co-line);padding:9px 0;display:flex;gap:10px;align-items:flex-start;font-size:12.5px}
.dshCo-log:first-of-type{border-top:0}
.dshCo-when{font-family:ui-monospace,Consolas,monospace;font-size:11.5px;opacity:.6;flex:0 0 76px}
.dshCo-now{color:#4f9d6a;font-weight:600}
.dshCo-root input[type="checkbox"]{accent-color:var(--co-accent);cursor:pointer}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}

function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}
function clock(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;

/** Cheap, honest lint. No model, no guessing, no scores. */

// 冲突检测的词汇表。刻意不用裸的“要”（它藏在“不要”里），免得把否定词当成肯定词。
const NEG_WORDS = ["不要", "别", "禁止", "不准", "切勿", "避免", "无需", "不必", "never", "don't", "do not", "avoid", "must not"];
const POS_WORDS = ["必须", "一定", "务必", "总是", "始终", "一律", "always", "must", "ensure", "required"];
const STOP = new Set(["的", "了", "我", "你", "他", "她", "它", "是", "在", "和", "与", "就", "都", "也", "还", "把", "被", "让", "给", "这", "那", "很", "the", "a", "an", "to", "of", "and", "or", "is", "are", "be", "it", "for", "on", "in"]);

/** 话题词：拉丁词 + 中文二字组，去掉停用词。粗糙但够用。 */
function topicTokens(text: string): Set<string> {
  const cleaned = String(text || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const out = new Set<string>();
  for (const word of cleaned.split(/\s+/).filter(Boolean)) {
    if (/^[\x00-\x7f]+$/.test(word)) {
      if (word.length > 2 && !STOP.has(word)) out.add(word);
    } else {
      for (let i = 0; i + 1 < word.length; i++) {
        const bigram = word.slice(i, i + 2);
        if (!STOP.has(bigram)) out.add(bigram);
      }
    }
  }
  return out;
}

function polarity(text: string): "neg" | "pos" | "both" | "none" {
  const t = String(text || "").toLowerCase();
  const neg = NEG_WORDS.some((word) => t.includes(word));
  const pos = POS_WORDS.some((word) => t.includes(word));
  return neg && pos ? "both" : neg ? "neg" : pos ? "pos" : "none";
}

/** 两条家规之间“可能在打架”的判断——只看事实，只给线索，最多报三条。 */
function ruleDuel(rules: Rule[]): { color: string; text: string }[] {
  const out: { color: string; text: string }[] = [];
  const live = rules
    .map((rule, index) => ({ index, rule, toks: topicTokens(rule.text ?? ""), pol: polarity(rule.text ?? "") }))
    .filter((item) => item.rule.enabled !== false && String(item.rule.text ?? "").trim());
  const name = (item: { index: number; rule: Rule }) => `第${item.index + 1}条${item.rule.title ? `「${item.rule.title}」` : ""}`;
  for (let a = 0; a < live.length; a++) {
    for (let b = a + 1; b < live.length && out.length < 3; b++) {
      const A = live[a];
      const B = live[b];
      const denom = Math.min(A.toks.size, B.toks.size);
      if (!denom) continue;
      let shared = 0;
      for (const tok of A.toks) if (B.toks.has(tok)) shared += 1;
      const overlap = shared / denom;
      const opposite = A.pol !== "none" && B.pol !== "none" && A.pol !== B.pol;
      // 反过来会错：措辞几乎相同的“always X”和“never X”，重合度先撞上“重复”阀值，
      // 于是把一对打架说成了同一句话。先判矛盾，再判重复。
      if (overlap >= 0.34 && opposite) {
        out.push({ color: "#d0604c", text: `${name(A)} 和 ${name(B)} 可能在打架：都在说同一件事，一个有「要」、一个有「不要」。自己看一眼。` });
      } else if (overlap >= 0.75) {
        out.push({ color: "#e2a13c", text: `${name(A)} 和 ${name(B)} 基本是同一句话——说一遍就够了。` });
      }
    }
  }
  return out;
}
function lint(sections: { name: string; bytes: number; text: string }[], rules: Rule[]): { color: string; text: string }[] {
  const out: { color: string; text: string }[] = [];
  const owners = new Map<string, Set<string>>();
  for (const section of sections) {
    for (const raw of String(section.text ?? "").split(/\n+/)) {
      const key = raw.trim().replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
      if (key.length < 30) continue;
      const set = owners.get(key) ?? new Set<string>();
      set.add(section.name);
      owners.set(key, set);
    }
  }
  let dupes = 0;
  for (const [, names] of owners) if (names.size > 1) dupes += 1;
  if (dupes) out.push({ color: "#e2a13c", text: `有 ${dupes} 处文字在不止一段里出现——大概率是同一件事说了两遍。展开“当前 system prompt”就能对上。` });
  const big = sections.filter((s) => s.bytes > 6000);
  if (big.length) out.push({ color: "#e2a13c", text: `有 ${big.length} 段偏长（>6KB）：${big.slice(0, 3).map((s) => s.name).join("、")}。长段会挤掉更重要的上下文。` });
  const blank = (rules ?? []).filter((r) => r && r.enabled !== false && !String(r.text ?? "").trim());
  if (blank.length) out.push({ color: "#e2a13c", text: `有 ${blank.length} 条规则开着但没写正文，它们不会进 prompt。` });
  out.push(...ruleDuel(rules ?? []));
  const mine = (rules ?? []).filter((r) => r && r.enabled !== false && String(r.text ?? "").trim()).length;
  out.push({
    color: "#4f9d6a",
    text: mine
      ? `你自己的 ${mine} 条家规已经在 prompt 里了（段名以 copilot: 开头），下一轮就生效。`
      : "你还没有写家规。写一句就会立刻生效——不用重启。",
  });
  return out;
}

function CopilotPanel(props: { scope: Scope<Value> }): React.ReactElement {
  const { scope } = props;
  const snapshot = React.useSyncExternalStore((cb) => scope.subscribe(cb), () => scope.getSnapshot());
  const value: Value = snapshot?.value ?? {};
  const rules: Rule[] = Array.isArray(value.rules) ? value.rules : [];
  const enabled = value.enabled !== false;
  const [prompt, setPrompt] = React.useState<any>(null);
  const [logs, setLogs] = React.useState<HistoryEntry[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);
  const [whole, setWhole] = React.useState(false);

  const fingerprint = JSON.stringify({ e: enabled, r: rules.map((r) => [r?.id, r?.title, r?.band, r?.enabled, (r?.text ?? "").length]) });
  const load = React.useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const [pres, hres] = await Promise.all([
        fetch(`${ROUTE}/prompt`, { cache: "no-store" }),
        fetch(`${ROUTE}/history`, { cache: "no-store" }),
      ]);
      const pj = await pres.json();
      if (!pj.ok) throw new Error(pj.error || "读取失败");
      setPrompt(pj);
      const hj = await hres.json();
      if (hj.ok) setLogs(hj.entries ?? []);
    } catch (error) {
      setErr(String((error as Error)?.message ?? error));
    } finally {
      setBusy(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, fingerprint]);

  const write = (next: Partial<Value>) => {
    for (const [key, val] of Object.entries(next)) void scope.set(key, val);
  };

  // Rules are DRAFTED locally and committed on blur. A controlled input that writes on every
  // keystroke fights the IME — the RPC round-trip rewrites the field mid-composition and Chinese
  // comes out garbled. Type locally, save on blur. (2026-10-03: same bug fixed in dsh-touchstone.)
  const idSig = rules.map((rule) => rule?.id ?? "").join("|");
  const [draft, setDraft] = React.useState<Rule[]>(rules);
  React.useEffect(() => { setDraft(rules); }, [idSig]);
  const commitRules = () => write({ rules: draft });
  const applyRules = (next: Rule[]) => { setDraft(next); write({ rules: next }); };
  const setRule = (index: number, patch: Partial<Rule>) =>
    setDraft((list) => list.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  const addRule = (seed?: { title?: string; text?: string; band?: Band }) =>
    applyRules([...draft, { id: newId(), title: seed?.title ?? "", text: seed?.text ?? "", band: seed?.band ?? "mid", enabled: true }]);
  const delRule = (index: number) => applyRules(draft.filter((_, i) => i !== index));
  const move = (index: number, delta: number) => {
    const next = [...draft];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    applyRules(next);
  };
  const restore = (entry: HistoryEntry) => {
    applyRules((entry.rules ?? []).map((rule) => ({ ...rule, id: rule.id || newId() })));
  };

  const sections = (prompt?.sections ?? []) as { name: string; bytes: number; text: string }[];
  const mineSections = sections.filter((s) => s.name.startsWith("copilot:"));
  const hints = lint(sections, rules);
  const warnings = hints.filter((x) => x.color !== "#4f9d6a").length;

  return h(
    "div",
    { className: "dshCo-root" },
    // ── 检查单
    h(
      "div",
      { className: "dshCo-card" },
      h(
        "div",
        { className: "dshCo-head" },
        h("div", { className: "dshCo-h dshCo-h--fox" }, "提示词工作台"),
        h("span", { className: "dshCo-sub" }, "dsh-prompt-desk"),
        h("div", { className: "dshCo-grow" }),
        h("label", { className: "dshCo-row", style: { gap: 6 } },
          h("input", { type: "checkbox", checked: enabled, onChange: (e: any) => write({ enabled: e.target.checked }) }),
          h("span", { className: "dshCo-sub" }, "启用"),
        ),
        h("button", { className: "dshCo-btn", onClick: () => void load(), disabled: busy }, busy ? "读取中…" : "刷新"),
      ),
      h("div", { className: "dshCo-sub", style: { marginTop: 4 } },
        "它不替你写提示词：只让你看清 system prompt 的每一段、写下自己的家规、记下每一次改动。关掉开关，一切回到原样。"),
      h(
        "div",
        { className: "dshCo-stats" },
        h("div", { className: "dshCo-stat" }, h("b", null, String(sections.length || "—")), "段"),
        h("div", { className: "dshCo-stat" }, h("b", null, prompt ? kb(prompt.bytes) : "—"), "提示词"),
        h("div", { className: "dshCo-stat" }, h("b", null, prompt ? `≈${prompt.tokens}` : "—"), "token / 轮"),
        h("div", { className: "dshCo-stat" }, h("b", null, String(mineSections.length)), "你的段"),
        h("div", { className: "dshCo-stat" }, h("b", null, String(warnings)), "条体检提醒"),
      ),
    ),
    err ? h("div", { className: "dshCo-card", style: { color: "#d0604c" } }, `读不到 prompt：${err}`) : null,
    // ── 当前 system prompt
    h(
      "div",
      { className: "dshCo-card" },
      h("div", { className: "dshCo-head" },
        h("div", { className: "dshCo-h" }, "当前 system prompt"),
        h("div", { className: "dshCo-grow" }),
        h("button", { className: "dshCo-btn", onClick: () => setWhole(!whole) }, whole ? "看分段" : "看整篇"),
      ),
      whole
        ? h("pre", { className: "dshCo-pre", style: { maxHeight: 420 } }, prompt?.rendered ?? "(还没读到)")
        : h(
            "div",
            { style: { marginTop: 6 } },
            sections.length === 0
              ? h("div", { className: "dshCo-empty" }, "（还没读到 prompt）")
              : sections.map((section) =>
                  h(
                    "div",
                    { className: "dshCo-sec", key: section.name, onClick: () => setOpen(open === section.name ? null : section.name) },
                    h("div", { className: "dshCo-secTop" },
                      h("span", { className: "dshCo-secName" }, section.name),
                      section.name.startsWith("copilot:") ? h("span", { className: "dshCo-tag" }, "你的") : null,
                      h("span", { className: "dshCo-secBy" }, kb(section.bytes)),
                    ),
                    open === section.name ? h("pre", { className: "dshCo-pre" }, section.text || "(空)") : null,
                  ),
                ),
          ),
    ),
    // ── 我的家规
    h(
      "div",
      { className: "dshCo-card" },
      h("div", { className: "dshCo-head" },
        h("div", { className: "dshCo-h" }, "我的家规"),
        h("div", { className: "dshCo-grow" }),
        h("button", { className: "dshCo-btn dshCo-btn--go", onClick: () => addRule() }, "+ 加一条"),
      ),
      h("div", { className: "dshCo-sub", style: { marginTop: 4 } }, "写进 system prompt 的话。位置决定它出现在哪儿；改完下一轮就生效。"),
      h(
        "div",
        { className: "dshCo-row", style: { marginTop: 8 } },
        h("span", { className: "dshCo-sub" }, "航线："),
        ...ROUTES.map((route, index) => h("button", { className: "dshCo-chip", key: index, onClick: () => addRule(route) }, route.title)),
      ),
      draft.length === 0 ? h("div", { className: "dshCo-empty", style: { marginTop: 6 } }, "还没有家规。点上面的「航线」，或者自己写一条。") : null,
      draft.map((rule, index) =>
        h(
          "div",
          { className: "dshCo-rule", key: rule.id || index, onBlur: commitRules },
          h(
            "div",
            { className: "dshCo-row" },
            h("input", { type: "checkbox", checked: rule.enabled !== false, onChange: (e: any) => applyRules(draft.map((r, i) => (i === index ? { ...r, enabled: e.target.checked } : r))) }),
            h("input", { className: "dshCo-in", value: rule.title ?? "", placeholder: "标题（只给你看）", onChange: (e: any) => setRule(index, { title: e.target.value }) }),
            h("select", { className: "dshCo-sel", value: rule.band ?? "mid", onChange: (e: any) => applyRules(draft.map((r, i) => (i === index ? { ...r, band: e.target.value as Band } : r))) },
              ...BANDS.map((band) => h("option", { key: band.id, value: band.id }, band.label))),
            h("button", { className: "dshCo-x", title: "上移", onMouseDown: (e: any) => e.preventDefault(), onClick: () => move(index, -1) }, "↑"),
            h("button", { className: "dshCo-x", title: "下移", onMouseDown: (e: any) => e.preventDefault(), onClick: () => move(index, 1) }, "↓"),
            h("button", { className: "dshCo-x", title: "删除", onMouseDown: (e: any) => e.preventDefault(), onClick: () => delRule(index) }, "×"),
          ),
          h("textarea", {
            className: "dshCo-ta",
            value: rule.text ?? "",
            placeholder: "写进 prompt 的文字，例如：\n- 先给结论，再给理由。\n- 不确定就说不确定，不要编。",
            onChange: (e: any) => setRule(index, { text: e.target.value }),
          }),
        ),
      ),
    ),
    // ── 黑匣子
    h(
      "div",
      { className: "dshCo-card" },
      h("div", { className: "dshCo-head" },
        h("div", { className: "dshCo-h" }, "黑匣子"),
        h("div", { className: "dshCo-grow" }),
        h("span", { className: "dshCo-sub" }, "家规每次改变都会记一笔（最近 40 笔）"),
      ),
      logs.length === 0
        ? h("div", { className: "dshCo-empty" }, "还没有记录。")
        : logs
            .slice()
            .reverse()
            .map((entry, index) =>
              h(
                "div",
                { className: "dshCo-log", key: entry.at + "-" + index },
                h("span", { className: "dshCo-when" }, clock(entry.at)),
                h("div", { style: { flex: 1 } },
                  h("div", null,
                    h("span", { className: index === 0 ? "dshCo-now" : undefined }, `${entry.count} 条规则`),
                    h("span", { className: "dshCo-sub" }, ` · ${entry.bytes} 字节`),
                    index === 0 ? h("span", { className: "dshCo-now" }, "  ← 当前") : null,
                  ),
                  h("div", { className: "dshCo-sub" }, entry.titles.join("、") || "(无标题)"),
                ),
                index === 0 ? null : h("button", { className: "dshCo-btn", onClick: () => restore(entry) }, "恢复这版"),
              ),
            ),
    ),
    // ── 体检
    h(
      "div",
      { className: "dshCo-card" },
      h("div", { className: "dshCo-h" }, "体检"),
      h("div", { className: "dshCo-sub", style: { margin: "4px 0 2px" } }, "只看事实：重复、臃肿、空规则、成本。它不替你改，也不打分。"),
      hints.map((hint, index) =>
        h("div", { className: "dshCo-hint", key: index },
          h("span", { className: "dshCo-dot", style: { background: hint.color } }),
          h("span", null, hint.text),
        ),
      ),
      prompt ? h("div", { className: "dshCo-sub", style: { marginTop: 6 } },
        `这份提示词每轮大约 ${prompt.tokens} token——它跟着每一次对话一起付费，所以“加一句”不是免费的。`) : null,
    ),
  );
}

/**
 * Settings access, version-agnostic.
 *
 * DSH 0.1.x hands plugins a `settingsScope` service; DSH 0.2 (the desktop app) dropped it in favour
 * of the typert RPC namespace `remote.settings`. Declaring `settingsScope` in `inject` therefore
 * left this plugin "pending\: waiting for service: settingsScope" forever on 0.2 - no error, no
 * panel. So we inject only what has always existed, and pick the API at runtime.
 */
interface RemoteSettings {
  describe(): Promise<unknown>;
  update(namespace: string, patch: Record<string, unknown>, expectedRevision?: unknown): Promise<unknown>;
}

/** Pull our namespace's value out of whatever shape `describe()` returns. */
function pickNamespace(described: any, namespace: string): any {
  if (!described || typeof described !== "object") return undefined;
  const candidates = [
    described.namespaces?.[namespace],
    described.settings?.[namespace],
    described[namespace],
  ];
  for (const candidate of candidates) {
    if (candidate === undefined) continue;
    if (candidate && typeof candidate === "object" && "value" in candidate) return candidate.value;
    return candidate;
  }
  return undefined;
}

/** A `Scope` over the 0.2 RPC namespace: cache + notify, refresh after every write. */
function remoteScope(remote: RemoteSettings, namespace: string): Scope<any> {
  let snapshot: { value?: any; status?: string } = { value: undefined, status: "loading" };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((fn) => fn());
  const refresh = async () => {
    try {
      const described = await remote.describe();
      snapshot = { value: pickNamespace(described, namespace), status: "ready" };
    } catch (error) {
      snapshot = { value: snapshot.value, status: "error" };
    }
    emit();
  };
  void refresh();
  return {
    getSnapshot: () => snapshot,
    set: async (key: string, value: unknown) => {
      snapshot = { value: { ...(snapshot.value ?? {}), [key]: value }, status: snapshot.status };
      emit();
      await remote.update(namespace, { [key]: value });
      await refresh();
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** A scope that renders the panel but cannot persist (last resort - says so in the UI). */
function inertScope(status: string): Scope<any> {
  const snapshot = { value: undefined as any, status };
  return { getSnapshot: () => snapshot, set: async () => undefined, subscribe: () => () => undefined };
}

function resolveSettingsScope(ctx: any, namespace: string): Scope<any> {
  const remote = ctx?.remote?.settings;
  if (remote && typeof remote.describe === "function") return remoteScope(remote, namespace);
  return inertScope("no-settings-service");
}

export function apply(ctx: any): void {
  ensureStyle();
  const scope = resolveSettingsScope(ctx, NS);
  const Section = () => h(CopilotPanel, { scope });
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
      { name: "settings.section", id: "prompt-desk", order: 26, label: () => "提示词工作台", inject: () => ({}) },
      Section,
    ),
  );
}

/**
 * Exposed for the test suite only. The lint is pure, so it can be exercised against the built
 * bundle without a browser, a settings scope or a running host — which is exactly what
 * `test/duel.test.mjs` does.
 */
export const __test = { ruleDuel, topicTokens, polarity, lint };
