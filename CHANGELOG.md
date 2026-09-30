# Changelog

> 每个版本号下方先给中文摘要，随后是详细英文条目。
> Each version starts with a Chinese summary, followed by the detailed English entries.

## 0.2.0 — 2026-09-30

### 副驾驶真正该干的活：指出"这两条在打架"

- **冲突检测**：「体检」现在会点出**互相矛盾**的家规——两条在说同一件事，一个有「要」、一个有「不要」
  （中英都认：「不要 / 别 / 禁止 / never / avoid」对「必须 / 一定 / always / must」）。
  同一句话被说两遍也会被抓到，但**先判矛盾、再判重复**——否则措辞几乎相同的 "always X" 和 "never X"
  会被误判成"重复"。（这个顺序 bug 是测试抓出来的。）
- **仓库的第一个测试**：`test/duel.test.mjs` 直接加载**构建产物** `lib/client.js`（stub 掉
  `window.__ModuleLoader__`），不依赖浏览器、设置服务或运行中的宿主。11 项断言，CI 里跑。
- **⚠️ 一个给所有 DSH 插件作者的发现（血泪）**：**DSH 的插件 id 不支持 npm 作用域名**。
  我先把包名改成 `@hwayn/dsh-copilot` 并逐一改好 profile 的依赖与 bundles——宿主照常加载（路由是通的），
  但**客户端半会被悄悄丢出加载清单**（导航里那一页直接消失，前端无任何报错）。
  名字必须三处一致且**不带作用域**：`package.json` 的 `name`、`cordis.patch.yml` 里的 `name`、
  profile 的 `dependencies` 键 + `dsh.profile.bundles`。因此 npm 上的包名是 **`dsh-copilot-plugin`**。

### The job a co-pilot should actually do: "these two are fighting"

- **Conflict detection** in the lint panel: two rules about the same thing with opposite polarity
  (不要 / 别 / 禁止 / never / avoid vs 必须 / 一定 / always / must). The same sentence twice is still
  reported, but **contradiction is checked before duplication** - otherwise "always X" and "never X"
  (nearly identical wording) get mislabelled as a duplicate. That ordering bug was found by the test.
- **First tests in the repository**: `test/duel.test.mjs` loads the *built* `lib/client.js` (stubbing
  `window.__ModuleLoader__`) with no browser, no settings scope and no running host. 11 assertions, run in CI.
- **A finding worth passing on**: DSH plugin ids **do not support npm scoped names**. With
  `@hwayn/dsh-copilot` the host still loaded the plugin (routes worked) but the *client* half was
  silently dropped from the module roster - the settings page just vanished, with no error. The name
  must be identical and unscoped in three places: `package.json` `name`, `cordis.patch.yml` `name`,
  and the profile's `dependencies` key plus `dsh.profile.bundles`. Hence the npm name
  **`dsh-copilot-plugin`**.

## 0.1.0 — 2026-09-30

### 第一个版本：看得见、改得动、解得开、退得回

- **看得见**：设置页把当前 system prompt 按**段**摊开（段名 / 来源 / 字节 / 原文），数据来自真实的
  `ctx.systemPrompt.assemble()`，不是猜的。另可在"看整篇"里读拼好的全文。
- **改得动**：「我的家规」写进 prompt 的三个落点（`copilot:pre` 700 / `copilot:mid` 5500 /
  `copilot:post` 10150，取自 DSH 空闲的顺序档位）。每段的正文是一个 **provider**，每次组装时才
  读取当前设置——所以**改完下一轮就生效，不用重启**。
- **解得开**：「体检」只看事实——同一句话出现在不止一段里、某段偏长、规则开着却没写正文，
  以及**这份提示词每轮大约花多少 token**。
- **退得回**：所有贡献都走本插件自己的段名，**从不按名字遮蔽别人的段**；关掉总开关或卸载插件，
  prompt 立刻恢复原样。
- **黑匣子**：家规每次改变都记一笔（最近 40 笔，落在 `$DSH_HOME/copilot/history.json`），
  任意一版可**一键恢复**。
- **航线**：6 条现成家规模板，点一下就能用。

### First release: see it, edit it, understand it, undo it

- **See** — the settings page lists the real assembled prompt as sections (name, size, text) via
  `ctx.systemPrompt.assemble()`; a "whole text" toggle shows the joined prompt.
- **Edit** — house rules land in one of three order bands (`copilot:pre` 700 / `copilot:mid` 5500 /
  `copilot:post` 10150). Each section's text is a *provider* read at assembly time, so an edit takes
  effect on the very next turn with no restart.
- **Understand** — the lint panel reports only facts: the same line appearing in more than one
  section, oversized sections, rules left empty, and roughly how many tokens the prompt costs per turn.
- **Undo** — every contribution uses this plugin's own section names; it never shadows another
  plugin's section by name. Turning the switch off (or removing the plugin) restores the prompt.
- **Logbook** — every change to the rules is recorded (40 deep, under `$DSH_HOME/copilot/`), and any
  version can be restored with one click.
- **Routes** — six one-click rule templates.
