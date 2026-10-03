window.__ModuleLoader__.load({
	id: "dsh-prompt-desk",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__test = exports.inject = void 0;
exports.apply = apply;
/**
 * dsh-prompt-desk — Browser half.
 *
 * One settings page ("Prompt Desk"):
 *   · **Checklist** — the numbers a co-pilot calls out before takeoff (sections, bytes, tokens/turn)
 *   · **Current system prompt** — the real assembled prompt, as sections or as one string
 *   · **My house rules** — write your own voice into the prompt; takes effect on the next turn
 *   · **Routes** — one-click rule templates
 *   · **Black box** — every change, with one-click restore
 *   · **Inspection** — what repeats, what is huge, what is empty. Facts only.
 *
 * `React.createElement` rather than JSX: this file is transpiled straight to CommonJS for the
 * client-module loader, which has no JSX pass.
 */
const React = require("react");
const h = React.createElement;
/** Pick a language from the browser: Chinese if the UI language looks Chinese, English otherwise. */
const LANG = typeof navigator !== "undefined" && /^zh/i.test(String(navigator.language || "")) ? "zh" : "en";
/** Inline bilingual string. */
function t(zh, en) {
    return LANG === "zh" ? zh : en;
}
const NS = "ui-prompt-desk";
const ROUTE = "/dsh-prompt-desk";
const STYLE_ID = "dsh-prompt-desk-style";
// `remote` is the typert RPC namespace that exists in both 0.1.x and the 0.2 desktop app, and
// `ctx.remote.settings` is its settings face. (The old `settingsScope` service was dropped in 0.2 -
// declaring it left the plugin "pending (waiting for service: settingsScope)" forever there. And
// accessing `ctx.remote` without declaring `remote` in `inject` throws
// `cannot get property "remote" without inject` - which is how we learned the exact name.)
exports.inject = ["slots", "remote"];
const BANDS = [
    { id: "pre", label: t("靠前 · persona 之后", "Front · after persona") },
    { id: "mid", label: t("中间 · 工具说明之后", "Middle · after tools") },
    { id: "post", label: t("靠后 · prompt 末尾", "Back · end of prompt") },
];
/** Routes: pre-built one-liners, one click and you are on your way. */
const ROUTES = [
    { title: t("先给结论", "Lead with the conclusion"), text: t("回答前先给结论，再给理由。", "State the conclusion first, then the reasoning."), band: "mid" },
    { title: t("不确定就说不确定", "Flag uncertainty"), text: t("不确定的地方要明说，不要编造。", "Say plainly when you are unsure; do not make things up."), band: "mid" },
    { title: t("用中文回答", "Answer in Chinese"), text: t("用中文回答，除非我要求别的语言。", "Answer in Chinese unless I ask for another language."), band: "pre" },
    { title: t("改动前先备份", "Back up before editing"), text: t("修改我已有的文件之前，先做备份。", "Back up a file before you modify it."), band: "mid" },
    { title: t("少用列表", "Fewer bullet lists"), text: t("多用完整的句子，少用分点列表。", "Prefer full sentences over bulleted lists."), band: "post" },
    { title: t("别急着动我的东西", "Ask before touching my stuff"), text: t("要动我正在使用的服务或文件之前，先问我一句。", "Ask me before you touch a service or file I am using."), band: "pre" },
];
const CSS = `
/* The design language here: soft, with room to breathe; layering comes from "light" and "spacing", not "lines". */
.dshCo-root{
  --co-r-xs:6px;--co-r-sm:10px;--co-r-md:14px;--co-r-lg:20px;--co-pill:999px;
  --co-tone:rgba(128,128,128,.055);--co-tone-2:rgba(128,128,128,.10);--co-tone-3:rgba(128,128,128,.16);
  --co-line:1px solid rgba(128,128,128,.18);
  --co-accent:rgba(48,126,222,.9);
  --co-sh-1:0 1px 2px rgba(0,0,0,.05);
  --co-t:.18s ease;
  display:flex;flex-direction:column;gap:16px;font-size:13.5px;line-height:1.65
}
/* Cards: no hard borders — separate them by tone plus a touch of lift. */
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
function ensureStyle() {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.append(style);
}
function newId() {
    return Math.random().toString(36).slice(2, 9);
}
function clock(ms) {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
/** Cheap, honest lint. No model, no guessing, no scores. */
// Conflict-detection vocabulary. We deliberately omit a bare 「要」 (it hides inside 「不要」), so a
// negation is never read as an affirmation.
const NEG_WORDS = ["不要", "别", "禁止", "不准", "切勿", "避免", "无需", "不必", "never", "don't", "do not", "avoid", "must not"];
const POS_WORDS = ["必须", "一定", "务必", "总是", "始终", "一律", "always", "must", "ensure", "required"];
const STOP = new Set(["的", "了", "我", "你", "他", "她", "它", "是", "在", "和", "与", "就", "都", "也", "还", "把", "被", "让", "给", "这", "那", "很", "the", "a", "an", "to", "of", "and", "or", "is", "are", "be", "it", "for", "on", "in"]);
/** Topic tokens: Latin words plus Chinese bigrams, stop words removed. Crude, but good enough. */
function topicTokens(text) {
    const cleaned = String(text || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const out = new Set();
    for (const word of cleaned.split(/\s+/).filter(Boolean)) {
        if (/^[\x00-\x7f]+$/.test(word)) {
            if (word.length > 2 && !STOP.has(word))
                out.add(word);
        }
        else {
            for (let i = 0; i + 1 < word.length; i++) {
                const bigram = word.slice(i, i + 2);
                if (!STOP.has(bigram))
                    out.add(bigram);
            }
        }
    }
    return out;
}
function polarity(text) {
    const t = String(text || "").toLowerCase();
    const neg = NEG_WORDS.some((word) => t.includes(word));
    const pos = POS_WORDS.some((word) => t.includes(word));
    return neg && pos ? "both" : neg ? "neg" : pos ? "pos" : "none";
}
/** Whether two house rules "might be fighting" — facts only, clues only, at most three findings. */
function ruleDuel(rules) {
    const out = [];
    const live = rules
        .map((rule, index) => ({ index, rule, toks: topicTokens(rule.text ?? ""), pol: polarity(rule.text ?? "") }))
        .filter((item) => item.rule.enabled !== false && String(item.rule.text ?? "").trim());
    const name = (item) => t(`第${item.index + 1}条${item.rule.title ? `「${item.rule.title}」` : ""}`, `rule ${item.index + 1}${item.rule.title ? ` "${item.rule.title}"` : ""}`);
    for (let a = 0; a < live.length; a++) {
        for (let b = a + 1; b < live.length && out.length < 3; b++) {
            const A = live[a];
            const B = live[b];
            const denom = Math.min(A.toks.size, B.toks.size);
            if (!denom)
                continue;
            let shared = 0;
            for (const tok of A.toks)
                if (B.toks.has(tok))
                    shared += 1;
            const overlap = shared / denom;
            const opposite = A.pol !== "none" && B.pol !== "none" && A.pol !== B.pol;
            // Order matters the other way round: an "always X" and a "never X" with near-identical
            // wording hit the "duplicate" threshold first and get reported as the same sentence. So check
            // contradiction before duplication.
            if (overlap >= 0.34 && opposite) {
                out.push({
                    color: "#d0604c",
                    text: t(`${name(A)} 和 ${name(B)} 可能在打架：都在说同一件事，一个有「要」、一个有「不要」。自己看一眼。`, `${name(A)} and ${name(B)} may be fighting: they talk about the same thing, one says "do" and the other "don't". Take a look.`),
                });
            }
            else if (overlap >= 0.75) {
                out.push({
                    color: "#e2a13c",
                    text: t(`${name(A)} 和 ${name(B)} 基本是同一句话——说一遍就够了。`, `${name(A)} and ${name(B)} are basically the same sentence — saying it once is enough.`),
                });
            }
        }
    }
    return out;
}
function lint(sections, rules) {
    const out = [];
    const owners = new Map();
    for (const section of sections) {
        for (const raw of String(section.text ?? "").split(/\n+/)) {
            const key = raw.trim().replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
            if (key.length < 30)
                continue;
            const set = owners.get(key) ?? new Set();
            set.add(section.name);
            owners.set(key, set);
        }
    }
    let dupes = 0;
    for (const [, names] of owners)
        if (names.size > 1)
            dupes += 1;
    if (dupes)
        out.push({
            color: "#e2a13c",
            text: t(`有 ${dupes} 处文字在不止一段里出现——大概率是同一件事说了两遍。展开“当前 system prompt”就能对上。`, `${dupes} line(s) appear in more than one section — most likely the same thing said twice. Expand "Current system prompt" to line them up.`),
        });
    const big = sections.filter((s) => s.bytes > 6000);
    if (big.length)
        out.push({
            color: "#e2a13c",
            text: t(`有 ${big.length} 段偏长（>6KB）：${big.slice(0, 3).map((s) => s.name).join("、")}。长段会挤掉更重要的上下文。`, `${big.length} section(s) run long (>6KB): ${big.slice(0, 3).map((s) => s.name).join(", ")}. Long sections crowd out more important context.`),
        });
    const blank = (rules ?? []).filter((r) => r && r.enabled !== false && !String(r.text ?? "").trim());
    if (blank.length)
        out.push({
            color: "#e2a13c",
            text: t(`有 ${blank.length} 条规则开着但没写正文，它们不会进 prompt。`, `${blank.length} rule(s) are enabled but have no text; they will not enter the prompt.`),
        });
    out.push(...ruleDuel(rules ?? []));
    const mine = (rules ?? []).filter((r) => r && r.enabled !== false && String(r.text ?? "").trim()).length;
    out.push({
        color: "#4f9d6a",
        text: mine
            ? t(`你自己的 ${mine} 条家规已经在 prompt 里了（段名以 copilot: 开头），下一轮就生效。`, `Your ${mine} house rule(s) are already in the prompt (their section names start with copilot:) and take effect on the next turn.`)
            : t("你还没有写家规。写一句就会立刻生效——不用重启。", "You have not written any house rules yet. Write one and it takes effect immediately — no restart needed."),
    });
    return out;
}
function CopilotPanel(props) {
    const { scope } = props;
    const snapshot = React.useSyncExternalStore((cb) => scope.subscribe(cb), () => scope.getSnapshot());
    const value = snapshot?.value ?? {};
    const rules = Array.isArray(value.rules) ? value.rules : [];
    const enabled = value.enabled !== false;
    const [prompt, setPrompt] = React.useState(null);
    const [logs, setLogs] = React.useState([]);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState("");
    const [open, setOpen] = React.useState(null);
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
            if (!pj.ok)
                throw new Error(pj.error || t("读取失败", "read failed"));
            setPrompt(pj);
            const hj = await hres.json();
            if (hj.ok)
                setLogs(hj.entries ?? []);
        }
        catch (error) {
            setErr(String(error?.message ?? error));
        }
        finally {
            setBusy(false);
        }
    }, []);
    React.useEffect(() => {
        void load();
    }, [load, fingerprint]);
    const write = (next) => {
        for (const [key, val] of Object.entries(next))
            void scope.set(key, val);
    };
    // Rules are DRAFTED locally and committed on blur. A controlled input that writes on every
    // keystroke fights the IME — the RPC round-trip rewrites the field mid-composition and Chinese
    // comes out garbled. Type locally, save on blur. (2026-10-03: same bug fixed in dsh-touchstone.)
    const idSig = rules.map((rule) => rule?.id ?? "").join("|");
    const [draft, setDraft] = React.useState(rules);
    React.useEffect(() => { setDraft(rules); }, [idSig]);
    const commitRules = () => write({ rules: draft });
    const applyRules = (next) => { setDraft(next); write({ rules: next }); };
    const setRule = (index, patch) => setDraft((list) => list.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
    const addRule = (seed) => applyRules([...draft, { id: newId(), title: seed?.title ?? "", text: seed?.text ?? "", band: seed?.band ?? "mid", enabled: true }]);
    const delRule = (index) => applyRules(draft.filter((_, i) => i !== index));
    const move = (index, delta) => {
        const next = [...draft];
        const target = index + delta;
        if (target < 0 || target >= next.length)
            return;
        [next[index], next[target]] = [next[target], next[index]];
        applyRules(next);
    };
    const restore = (entry) => {
        applyRules((entry.rules ?? []).map((rule) => ({ ...rule, id: rule.id || newId() })));
    };
    const sections = (prompt?.sections ?? []);
    const mineSections = sections.filter((s) => s.name.startsWith("copilot:"));
    const hints = lint(sections, rules);
    const warnings = hints.filter((x) => x.color !== "#4f9d6a").length;
    return h("div", { className: "dshCo-root" }, 
    // ── checklist
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-head" }, h("div", { className: "dshCo-h dshCo-h--fox" }, t("提示词工作台", "Prompt Desk")), h("span", { className: "dshCo-sub" }, "dsh-prompt-desk"), h("div", { className: "dshCo-grow" }), h("label", { className: "dshCo-row", style: { gap: 6 } }, h("input", { type: "checkbox", checked: enabled, onChange: (e) => write({ enabled: e.target.checked }) }), h("span", { className: "dshCo-sub" }, t("启用", "Enabled"))), h("button", { className: "dshCo-btn", onClick: () => void load(), disabled: busy }, busy ? t("读取中…", "Loading…") : t("刷新", "Refresh"))), h("div", { className: "dshCo-sub", style: { marginTop: 4 } }, t("它不替你写提示词：只让你看清 system prompt 的每一段、写下自己的家规、记下每一次改动。关掉开关，一切回到原样。", "It does not write your prompt for you: it lets you see every section of the system prompt, write your own house rules, and log every change. Turn the switch off and everything goes back to the way it was.")), h("div", { className: "dshCo-stats" }, h("div", { className: "dshCo-stat" }, h("b", null, String(sections.length || "—")), t("段", "sections")), h("div", { className: "dshCo-stat" }, h("b", null, prompt ? kb(prompt.bytes) : "—"), t("提示词", "prompt")), h("div", { className: "dshCo-stat" }, h("b", null, prompt ? `≈${prompt.tokens}` : "—"), t("token / 轮", "tokens / turn")), h("div", { className: "dshCo-stat" }, h("b", null, String(mineSections.length)), t("你的段", "your sections")), h("div", { className: "dshCo-stat" }, h("b", null, String(warnings)), t("条体检提醒", "lint alerts")))), err ? h("div", { className: "dshCo-card", style: { color: "#d0604c" } }, t(`读不到 prompt：${err}`, `Cannot read the prompt: ${err}`)) : null, 
    // ── current system prompt
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-head" }, h("div", { className: "dshCo-h" }, t("当前 system prompt", "Current system prompt")), h("div", { className: "dshCo-grow" }), h("button", { className: "dshCo-btn", onClick: () => setWhole(!whole) }, whole ? t("看分段", "By section") : t("看整篇", "Whole text"))), whole
        ? h("pre", { className: "dshCo-pre", style: { maxHeight: 420 } }, prompt?.rendered ?? t("(还没读到)", "(nothing loaded yet)"))
        : h("div", { style: { marginTop: 6 } }, sections.length === 0
            ? h("div", { className: "dshCo-empty" }, t("（还没读到 prompt）", "(no prompt loaded yet)"))
            : sections.map((section) => h("div", { className: "dshCo-sec", key: section.name, onClick: () => setOpen(open === section.name ? null : section.name) }, h("div", { className: "dshCo-secTop" }, h("span", { className: "dshCo-secName" }, section.name), section.name.startsWith("copilot:") ? h("span", { className: "dshCo-tag" }, t("你的", "yours")) : null, h("span", { className: "dshCo-secBy" }, kb(section.bytes))), open === section.name ? h("pre", { className: "dshCo-pre" }, section.text || t("(空)", "(empty)")) : null)))), 
    // ── my house rules
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-head" }, h("div", { className: "dshCo-h" }, t("我的家规", "My house rules")), h("div", { className: "dshCo-grow" }), h("button", { className: "dshCo-btn dshCo-btn--go", onClick: () => addRule() }, t("+ 加一条", "+ Add rule"))), h("div", { className: "dshCo-sub", style: { marginTop: 4 } }, t("写进 system prompt 的话。位置决定它出现在哪儿；改完下一轮就生效。", "Words written into the system prompt. The band decides where they appear; an edit takes effect on the next turn.")), h("div", { className: "dshCo-row", style: { marginTop: 8 } }, h("span", { className: "dshCo-sub" }, t("航线：", "Routes:")), ...ROUTES.map((route, index) => h("button", { className: "dshCo-chip", key: index, onClick: () => addRule(route) }, route.title))), draft.length === 0 ? h("div", { className: "dshCo-empty", style: { marginTop: 6 } }, t("还没有家规。点上面的「航线」，或者自己写一条。", "No house rules yet. Pick a route above, or write one yourself.")) : null, draft.map((rule, index) => h("div", { className: "dshCo-rule", key: rule.id || index, onBlur: commitRules }, h("div", { className: "dshCo-row" }, h("input", { type: "checkbox", checked: rule.enabled !== false, onChange: (e) => applyRules(draft.map((r, i) => (i === index ? { ...r, enabled: e.target.checked } : r))) }), h("input", { className: "dshCo-in", value: rule.title ?? "", placeholder: t("标题（只给你看）", "Title (for your eyes only)"), onChange: (e) => setRule(index, { title: e.target.value }) }), h("select", { className: "dshCo-sel", value: rule.band ?? "mid", onChange: (e) => applyRules(draft.map((r, i) => (i === index ? { ...r, band: e.target.value } : r))) }, ...BANDS.map((band) => h("option", { key: band.id, value: band.id }, band.label))), h("button", { className: "dshCo-x", title: t("上移", "Move up"), onMouseDown: (e) => e.preventDefault(), onClick: () => move(index, -1) }, "↑"), h("button", { className: "dshCo-x", title: t("下移", "Move down"), onMouseDown: (e) => e.preventDefault(), onClick: () => move(index, 1) }, "↓"), h("button", { className: "dshCo-x", title: t("删除", "Delete"), onMouseDown: (e) => e.preventDefault(), onClick: () => delRule(index) }, "×")), h("textarea", {
        className: "dshCo-ta",
        value: rule.text ?? "",
        placeholder: t("写进 prompt 的文字，例如：\n- 先给结论，再给理由。\n- 不确定就说不确定，不要编。", "Text to write into the prompt, for example:\n- Lead with the conclusion, then the reasoning.\n- Flag uncertainty; do not invent."),
        onChange: (e) => setRule(index, { text: e.target.value }),
    })))), 
    // ── black box
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-head" }, h("div", { className: "dshCo-h" }, t("黑匣子", "Black box")), h("div", { className: "dshCo-grow" }), h("span", { className: "dshCo-sub" }, t("家规每次改变都会记一笔（最近 40 笔）", "Every change to the rules is recorded (last 40)"))), logs.length === 0
        ? h("div", { className: "dshCo-empty" }, t("还没有记录。", "No entries yet."))
        : logs
            .slice()
            .reverse()
            .map((entry, index) => h("div", { className: "dshCo-log", key: entry.at + "-" + index }, h("span", { className: "dshCo-when" }, clock(entry.at)), h("div", { style: { flex: 1 } }, h("div", null, h("span", { className: index === 0 ? "dshCo-now" : undefined }, t(`${entry.count} 条规则`, `${entry.count} rule(s)`)), h("span", { className: "dshCo-sub" }, t(` · ${entry.bytes} 字节`, ` · ${entry.bytes} bytes`)), index === 0 ? h("span", { className: "dshCo-now" }, t("  ← 当前", "  ← current")) : null), h("div", { className: "dshCo-sub" }, entry.titles.join(t("、", ", ")) || t("(无标题)", "(untitled)"))), index === 0 ? null : h("button", { className: "dshCo-btn", onClick: () => restore(entry) }, t("恢复这版", "Restore this version"))))), 
    // ── inspection
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-h" }, t("体检", "Inspection")), h("div", { className: "dshCo-sub", style: { margin: "4px 0 2px" } }, t("只看事实：重复、臃肿、空规则、成本。它不替你改，也不打分。", "Facts only: repetition, bloat, empty rules, cost. It does not edit anything for you, and it does not keep score.")), hints.map((hint, index) => h("div", { className: "dshCo-hint", key: index }, h("span", { className: "dshCo-dot", style: { background: hint.color } }), h("span", null, hint.text))), prompt ? h("div", { className: "dshCo-sub", style: { marginTop: 6 } }, t(`这份提示词每轮大约 ${prompt.tokens} token——它跟着每一次对话一起付费，所以“加一句”不是免费的。`, `This prompt costs roughly ${prompt.tokens} tokens per turn — it is paid for with every conversation, so "one more sentence" is never free.`)) : null));
}
/** Pull our namespace's value out of whatever shape `describe()` returns. */
function pickNamespace(described, namespace) {
    if (!described || typeof described !== "object")
        return undefined;
    const candidates = [
        described.namespaces?.[namespace],
        described.settings?.[namespace],
        described[namespace],
    ];
    for (const candidate of candidates) {
        if (candidate === undefined)
            continue;
        if (candidate && typeof candidate === "object" && "value" in candidate)
            return candidate.value;
        return candidate;
    }
    return undefined;
}
/** A `Scope` over the 0.2 RPC namespace: cache + notify, refresh after every write. */
function remoteScope(remote, namespace) {
    let snapshot = { value: undefined, status: "loading" };
    const listeners = new Set();
    const emit = () => listeners.forEach((fn) => fn());
    const refresh = async () => {
        try {
            const described = await remote.describe();
            snapshot = { value: pickNamespace(described, namespace), status: "ready" };
        }
        catch (error) {
            snapshot = { value: snapshot.value, status: "error" };
        }
        emit();
    };
    void refresh();
    return {
        getSnapshot: () => snapshot,
        set: async (key, value) => {
            snapshot = { value: { ...(snapshot.value ?? {}), [key]: value }, status: snapshot.status };
            emit();
            await remote.update(namespace, { [key]: value });
            await refresh();
        },
        subscribe: (fn) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
    };
}
/** A scope that renders the panel but cannot persist (last resort - says so in the UI). */
function inertScope(status) {
    const snapshot = { value: undefined, status };
    return { getSnapshot: () => snapshot, set: async () => undefined, subscribe: () => () => undefined };
}
function resolveSettingsScope(ctx, namespace) {
    const remote = ctx?.remote?.settings;
    if (remote && typeof remote.describe === "function")
        return remoteScope(remote, namespace);
    return inertScope("no-settings-service");
}
function apply(ctx) {
    ensureStyle();
    const scope = resolveSettingsScope(ctx, NS);
    const Section = () => h(CopilotPanel, { scope });
    ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "prompt-desk", order: 26, label: () => t("提示词工作台", "Prompt Desk"), inject: () => ({}) }, Section));
}
/**
 * Exposed for the test suite only. The lint is pure, so it can be exercised against the built
 * bundle without a browser, a settings scope or a running host — which is exactly what
 * `test/duel.test.mjs` does.
 */
exports.__test = { ruleDuel, topicTokens, polarity, lint };


		return module.exports;
	}
});
