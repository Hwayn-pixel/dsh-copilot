/**
 * Unit tests for the conflict detector — run against the *built* bundle, not a copy.
 *
 * The client half is emitted as `window.__ModuleLoader__.load({ id, factory })`, so the test stubs
 * that loader, runs the factory with a minimal `require`, and pokes the `__test` export.
 *
 *   node test/duel.test.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bundle = join(here, "..", "lib", "client.js");

let spec = null;
globalThis.window = { __ModuleLoader__: { load: (s) => { spec = s; } } };
globalThis.document = { getElementById: () => null, createElement: () => ({}), head: { append() {} } };
globalThis.fetch = async () => ({ json: async () => ({ ok: false, error: "no host in tests" }) });
// Pin the UI language so the localized strings are deterministic across machines: the client reads
// `navigator.language` at load time and picks Chinese for a zh-* locale. Without this the assertions
// below would depend on the host locale (English on CI), and the localized hints would not match.
Object.defineProperty(globalThis, "navigator", { value: { language: "zh-CN" }, configurable: true, writable: true });

const React = {
  createElement: (...args) => ({ args }),
  useState: (v) => [v, () => {}],
  useEffect: () => {},
  useCallback: (fn) => fn,
  useSyncExternalStore: (_sub, get) => get(),
};
await import(pathToFileURL(bundle).href);
if (!spec) throw new Error("the client bundle did not call window.__ModuleLoader__.load");
const mod = spec.factory((id) => {
  if (id === "react") return React;
  throw new Error("unexpected require: " + id);
});
const { ruleDuel, topicTokens, polarity } = mod.__test ?? {};
if (!ruleDuel) throw new Error("__test.ruleDuel missing from the bundle");

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed += 1; console.log("  PASS", name); }
  else { failed += 1; console.log("  FAIL", name); }
}

const rule = (title, text, band = "mid", enabled = true) => ({ id: title, title, text, band, enabled });

// 1 · the sentence that started it: two rules about the same thing, opposite polarity
{
  const duel = ruleDuel([rule("先说结论", "回答一定要先给结论。"), rule("别急", "不要先给结论，先讲背景。")]);
  check("opposite polarity on the same topic is reported", duel.some((d) => d.text.includes("打架")));
}

// 2 · the same sentence twice is a duplicate, not a conflict
{
  const duel = ruleDuel([rule("A", "回答前先给结论，再给理由。"), rule("B", "回答前先给结论，再给理由。")]);
  check("identical rules are reported as the same sentence", duel.length === 1 && duel[0].text.includes("同一句话"));
}

// 3 · unrelated rules stay silent
{
  const duel = ruleDuel([rule("A", "回答前先给结论。"), rule("B", "文件改动之前先做备份。")]);
  check("unrelated rules produce no finding", duel.length === 0);
}

// 4 · disabled rules are ignored
{
  const duel = ruleDuel([rule("A", "回答一定要先给结论。"), rule("B", "不要先给结论。", "mid", false)]);
  check("a disabled rule takes part in nothing", duel.length === 0);
}

// 5 · polarity parsing: 不要 is negative, and a bare 要 must not read as positive
{
  check("「不要」 reads as negative", polarity("不要先给结论") === "neg");
  check("「必须」 reads as positive", polarity("必须先给结论") === "pos");
  check("a plain sentence is neutral", polarity("先给结论") === "none");
}

// 6 · English works too
{
  const duel = ruleDuel([rule("A", "Always explain your reasoning."), rule("B", "Never explain your reasoning, just answer.")]);
  check("english opposite polarity is caught", duel.some((d) => d.text.includes("打架")));
}

// 7 · the linter never explodes on odd input
{
  check("empty rules are safe", ruleDuel([]).length === 0);
  check("whitespace rules are safe", ruleDuel([rule("A", "   ")]).length === 0);
  const tokens = topicTokens("先给结论，再给理由。");
  check("chinese tokenises to bigrams", tokens.size > 2);
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
