# Changelog

> 每个版本号下方先给中文摘要，随后是详细英文条目。
> Each version starts with a Chinese summary, followed by the detailed English entries.

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
