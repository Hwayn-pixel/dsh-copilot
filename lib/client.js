window.__ModuleLoader__.load({
	id: "dsh-copilot",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__test = exports.inject = void 0;
exports.apply = apply;
/**
 * dsh-copilot — Browser half.
 *
 * One settings page ("副驾驶"):
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
const React = require("react");
const h = React.createElement;
const NS = "ui-copilot";
const ROUTE = "/dsh-copilot";
const STYLE_ID = "dsh-copilot-style";
exports.inject = ["slots", "settingsScope"];
const BANDS = [
    { id: "pre", label: "靠前 · persona 之后" },
    { id: "mid", label: "中间 · 工具说明之后" },
    { id: "post", label: "靠后 · prompt 末尾" },
];
/** 航线：现成的一句话，点一下就上路。 */
const ROUTES = [
    { title: "先给结论", text: "回答前先给结论，再给理由。", band: "mid" },
    { title: "不确定就说不确定", text: "不确定的地方要明说，不要编造。", band: "mid" },
    { title: "用中文回答", text: "用中文回答，除非我要求别的语言。", band: "pre" },
    { title: "改动前先备份", text: "修改我已有的文件之前，先做备份。", band: "mid" },
    { title: "少用列表", text: "多用完整的句子，少用分点列表。", band: "post" },
    { title: "别急着动我的东西", text: "要动我正在使用的服务或文件之前，先问我一句。", band: "pre" },
];
const CSS = `
.dshCo-root{display:flex;flex-direction:column;gap:14px;font-size:13.5px;line-height:1.6}
.dshCo-card{border:1px solid rgba(128,128,128,.22);border-radius:14px;padding:14px 16px;background:rgba(255,255,255,.04)}
.dshCo-head{display:flex;align-items:center;gap:10px}
.dshCo-h{font-size:15px;font-weight:600}
.dshCo-sub{font-size:12px;opacity:.62}
.dshCo-grow{flex:1}
.dshCo-stats{display:flex;gap:20px;flex-wrap:wrap;font-size:12px;opacity:.75;margin-top:8px}
.dshCo-stat b{font-size:17px;font-weight:650;opacity:1;margin-right:4px}
.dshCo-btn{border:1px solid rgba(128,128,128,.3);border-radius:10px;padding:5px 11px;font:inherit;font-size:12.5px;background:transparent;color:inherit;cursor:pointer}
.dshCo-btn:hover{background:rgba(128,128,128,.1)}
.dshCo-btn[disabled]{opacity:.45;cursor:default}
.dshCo-btn--go{border-color:rgba(36,121,219,.5)}
.dshCo-chip{border:1px solid rgba(128,128,128,.28);border-radius:999px;padding:4px 12px;font-size:12px;background:transparent;color:inherit;cursor:pointer}
.dshCo-chip:hover{background:rgba(128,128,128,.12)}
.dshCo-sec{border-top:1px solid rgba(128,128,128,.16);padding:7px 0;cursor:pointer}
.dshCo-sec:first-child{border-top:0}
.dshCo-secTop{display:flex;align-items:baseline;gap:8px;font-size:12.5px}
.dshCo-secName{font-family:ui-monospace,Consolas,monospace;font-size:11.5px}
.dshCo-secBy{margin-left:auto;opacity:.55;font-size:11px}
.dshCo-pre{margin:8px 0 2px;padding:10px 12px;border-radius:10px;background:rgba(128,128,128,.09);white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,Consolas,monospace;font-size:11.5px;line-height:1.5;max-height:340px;overflow:auto}
.dshCo-rule{border:1px solid rgba(128,128,128,.2);border-radius:12px;padding:10px 12px;margin-top:8px}
.dshCo-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dshCo-in,.dshCo-sel,.dshCo-ta{font:inherit;font-size:12.5px;padding:6px 9px;border-radius:9px;border:1px solid rgba(128,128,128,.28);background:rgba(128,128,128,.06);color:inherit}
.dshCo-in{flex:1;min-width:120px}
.dshCo-ta{width:100%;min-height:80px;margin-top:7px;resize:vertical;line-height:1.55;font-family:inherit}
.dshCo-x{border:0;background:transparent;color:inherit;opacity:.55;cursor:pointer;font-size:15px;padding:2px 6px;border-radius:8px}
.dshCo-x:hover{opacity:1;background:rgba(128,128,128,.14)}
.dshCo-hint{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;padding:5px 0}
.dshCo-dot{width:7px;height:7px;border-radius:50%;margin-top:7px;flex:0 0 auto}
.dshCo-empty{font-size:12.5px;opacity:.6;padding:4px 0}
.dshCo-tag{font-size:11px;padding:1px 7px;border-radius:999px;background:rgba(128,128,128,.14)}
.dshCo-log{border-top:1px solid rgba(128,128,128,.16);padding:8px 0;display:flex;gap:10px;align-items:flex-start;font-size:12.5px}
.dshCo-log:first-of-type{border-top:0}
.dshCo-when{font-family:ui-monospace,Consolas,monospace;font-size:11.5px;opacity:.6;flex:0 0 72px}
.dshCo-now{color:#4f9d6a;font-weight:600}
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
// 冲突检测的词汇表。刻意不用裸的“要”（它藏在“不要”里），免得把否定词当成肯定词。
const NEG_WORDS = ["不要", "别", "禁止", "不准", "切勿", "避免", "无需", "不必", "never", "don't", "do not", "avoid", "must not"];
const POS_WORDS = ["必须", "一定", "务必", "总是", "始终", "一律", "always", "must", "ensure", "required"];
const STOP = new Set(["的", "了", "我", "你", "他", "她", "它", "是", "在", "和", "与", "就", "都", "也", "还", "把", "被", "让", "给", "这", "那", "很", "the", "a", "an", "to", "of", "and", "or", "is", "are", "be", "it", "for", "on", "in"]);
/** 话题词：拉丁词 + 中文二字组，去掉停用词。粗糙但够用。 */
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
/** 两条家规之间“可能在打架”的判断——只看事实，只给线索，最多报三条。 */
function ruleDuel(rules) {
    const out = [];
    const live = rules
        .map((rule, index) => ({ index, rule, toks: topicTokens(rule.text ?? ""), pol: polarity(rule.text ?? "") }))
        .filter((item) => item.rule.enabled !== false && String(item.rule.text ?? "").trim());
    const name = (item) => `第${item.index + 1}条${item.rule.title ? `「${item.rule.title}」` : ""}`;
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
            // 反过来会错：措辞几乎相同的“always X”和“never X”，重合度先撞上“重复”阀值，
            // 于是把一对打架说成了同一句话。先判矛盾，再判重复。
            if (overlap >= 0.34 && opposite) {
                out.push({ color: "#d0604c", text: `${name(A)} 和 ${name(B)} 可能在打架：都在说同一件事，一个有「要」、一个有「不要」。自己看一眼。` });
            }
            else if (overlap >= 0.75) {
                out.push({ color: "#e2a13c", text: `${name(A)} 和 ${name(B)} 基本是同一句话——说一遍就够了。` });
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
        out.push({ color: "#e2a13c", text: `有 ${dupes} 处文字在不止一段里出现——大概率是同一件事说了两遍。展开“当前 system prompt”就能对上。` });
    const big = sections.filter((s) => s.bytes > 6000);
    if (big.length)
        out.push({ color: "#e2a13c", text: `有 ${big.length} 段偏长（>6KB）：${big.slice(0, 3).map((s) => s.name).join("、")}。长段会挤掉更重要的上下文。` });
    const blank = (rules ?? []).filter((r) => r && r.enabled !== false && !String(r.text ?? "").trim());
    if (blank.length)
        out.push({ color: "#e2a13c", text: `有 ${blank.length} 条规则开着但没写正文，它们不会进 prompt。` });
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
                throw new Error(pj.error || "读取失败");
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
    const setRule = (index, patch) => write({ rules: rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)) });
    const addRule = (seed) => write({ rules: [...rules, { id: newId(), title: seed?.title ?? "", text: seed?.text ?? "", band: seed?.band ?? "mid", enabled: true }] });
    const delRule = (index) => write({ rules: rules.filter((_, i) => i !== index) });
    const move = (index, delta) => {
        const next = [...rules];
        const target = index + delta;
        if (target < 0 || target >= next.length)
            return;
        [next[index], next[target]] = [next[target], next[index]];
        write({ rules: next });
    };
    const restore = (entry) => {
        write({ rules: (entry.rules ?? []).map((rule) => ({ ...rule, id: rule.id || newId() })) });
    };
    const sections = (prompt?.sections ?? []);
    const mineSections = sections.filter((s) => s.name.startsWith("copilot:"));
    const hints = lint(sections, rules);
    const warnings = hints.filter((x) => x.color !== "#4f9d6a").length;
    return h("div", { className: "dshCo-root" }, 
    // ── 检查单
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-head" }, h("div", { className: "dshCo-h" }, "副驾驶 · dsh-copilot"), h("div", { className: "dshCo-grow" }), h("label", { className: "dshCo-row", style: { gap: 6 } }, h("input", { type: "checkbox", checked: enabled, onChange: (e) => write({ enabled: e.target.checked }) }), h("span", { className: "dshCo-sub" }, "启用")), h("button", { className: "dshCo-btn", onClick: () => void load(), disabled: busy }, busy ? "读取中…" : "刷新")), h("div", { className: "dshCo-sub", style: { marginTop: 4 } }, "副驾驶不替你开飞机：它让你看清 system prompt 的每一段，写下你自己的家规，记下每一次改动。关掉开关，一切回到原样。"), h("div", { className: "dshCo-stats" }, h("div", { className: "dshCo-stat" }, h("b", null, String(sections.length || "—")), "段"), h("div", { className: "dshCo-stat" }, h("b", null, prompt ? kb(prompt.bytes) : "—"), "提示词"), h("div", { className: "dshCo-stat" }, h("b", null, prompt ? `≈${prompt.tokens}` : "—"), "token / 轮"), h("div", { className: "dshCo-stat" }, h("b", null, String(mineSections.length)), "你的段"), h("div", { className: "dshCo-stat" }, h("b", null, String(warnings)), "条体检提醒"))), err ? h("div", { className: "dshCo-card", style: { color: "#d0604c" } }, `读不到 prompt：${err}`) : null, 
    // ── 当前 system prompt
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-head" }, h("div", { className: "dshCo-h" }, "当前 system prompt"), h("div", { className: "dshCo-grow" }), h("button", { className: "dshCo-btn", onClick: () => setWhole(!whole) }, whole ? "看分段" : "看整篇")), whole
        ? h("pre", { className: "dshCo-pre", style: { maxHeight: 420 } }, prompt?.rendered ?? "(还没读到)")
        : h("div", { style: { marginTop: 6 } }, sections.length === 0
            ? h("div", { className: "dshCo-empty" }, "（还没读到 prompt）")
            : sections.map((section) => h("div", { className: "dshCo-sec", key: section.name, onClick: () => setOpen(open === section.name ? null : section.name) }, h("div", { className: "dshCo-secTop" }, h("span", { className: "dshCo-secName" }, section.name), section.name.startsWith("copilot:") ? h("span", { className: "dshCo-tag" }, "你的") : null, h("span", { className: "dshCo-secBy" }, kb(section.bytes))), open === section.name ? h("pre", { className: "dshCo-pre" }, section.text || "(空)") : null)))), 
    // ── 我的家规
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-head" }, h("div", { className: "dshCo-h" }, "我的家规"), h("div", { className: "dshCo-grow" }), h("button", { className: "dshCo-btn dshCo-btn--go", onClick: () => addRule() }, "+ 加一条")), h("div", { className: "dshCo-sub", style: { marginTop: 4 } }, "写进 system prompt 的话。位置决定它出现在哪儿；改完下一轮就生效。"), h("div", { className: "dshCo-row", style: { marginTop: 8 } }, h("span", { className: "dshCo-sub" }, "航线："), ...ROUTES.map((route, index) => h("button", { className: "dshCo-chip", key: index, onClick: () => addRule(route) }, route.title))), rules.length === 0 ? h("div", { className: "dshCo-empty", style: { marginTop: 6 } }, "还没有家规。点上面的「航线」，或者自己写一条。") : null, rules.map((rule, index) => h("div", { className: "dshCo-rule", key: rule.id || index }, h("div", { className: "dshCo-row" }, h("input", { type: "checkbox", checked: rule.enabled !== false, onChange: (e) => setRule(index, { enabled: e.target.checked }) }), h("input", { className: "dshCo-in", value: rule.title ?? "", placeholder: "标题（只给你看）", onChange: (e) => setRule(index, { title: e.target.value }) }), h("select", { className: "dshCo-sel", value: rule.band ?? "mid", onChange: (e) => setRule(index, { band: e.target.value }) }, ...BANDS.map((band) => h("option", { key: band.id, value: band.id }, band.label))), h("button", { className: "dshCo-x", title: "上移", onClick: () => move(index, -1) }, "↑"), h("button", { className: "dshCo-x", title: "下移", onClick: () => move(index, 1) }, "↓"), h("button", { className: "dshCo-x", title: "删除", onClick: () => delRule(index) }, "×")), h("textarea", {
        className: "dshCo-ta",
        value: rule.text ?? "",
        placeholder: "写进 prompt 的文字，例如：\n- 先给结论，再给理由。\n- 不确定就说不确定，不要编。",
        onChange: (e) => setRule(index, { text: e.target.value }),
    })))), 
    // ── 黑匣子
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-head" }, h("div", { className: "dshCo-h" }, "黑匣子"), h("div", { className: "dshCo-grow" }), h("span", { className: "dshCo-sub" }, "家规每次改变都会记一笔（最近 40 笔）")), logs.length === 0
        ? h("div", { className: "dshCo-empty" }, "还没有记录。")
        : logs
            .slice()
            .reverse()
            .map((entry, index) => h("div", { className: "dshCo-log", key: entry.at + "-" + index }, h("span", { className: "dshCo-when" }, clock(entry.at)), h("div", { style: { flex: 1 } }, h("div", null, h("span", { className: index === 0 ? "dshCo-now" : undefined }, `${entry.count} 条规则`), h("span", { className: "dshCo-sub" }, ` · ${entry.bytes} 字节`), index === 0 ? h("span", { className: "dshCo-now" }, "  ← 当前") : null), h("div", { className: "dshCo-sub" }, entry.titles.join("、") || "(无标题)")), index === 0 ? null : h("button", { className: "dshCo-btn", onClick: () => restore(entry) }, "恢复这版")))), 
    // ── 体检
    h("div", { className: "dshCo-card" }, h("div", { className: "dshCo-h" }, "体检"), h("div", { className: "dshCo-sub", style: { margin: "4px 0 2px" } }, "只看事实：重复、臃肿、空规则、成本。它不替你改，也不打分。"), hints.map((hint, index) => h("div", { className: "dshCo-hint", key: index }, h("span", { className: "dshCo-dot", style: { background: hint.color } }), h("span", null, hint.text))), prompt ? h("div", { className: "dshCo-sub", style: { marginTop: 6 } }, `这份提示词每轮大约 ${prompt.tokens} token——它跟着每一次对话一起付费，所以“加一句”不是免费的。`) : null));
}
function apply(ctx) {
    ensureStyle();
    const scope = ctx.settingsScope.bind({ namespace: NS });
    const Section = () => h(CopilotPanel, { scope });
    ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "copilot", order: 26, label: () => "副驾驶", inject: () => ({}) }, Section));
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
