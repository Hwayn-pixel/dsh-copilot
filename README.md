# dsh-prompt-desk

[English](README.md) | [简体中文](README.zh-CN.md)

[![npm](https://img.shields.io/npm/v/dsh-prompt-desk?color=4c8bf5)](https://www.npmjs.com/package/dsh-prompt-desk)
[![license](https://img.shields.io/npm/l/dsh-prompt-desk?color=black)](LICENSE)
[![ci](https://github.com/Hwayn-pixel/dsh-prompt-desk/actions/workflows/ci.yml/badge.svg)](https://github.com/Hwayn-pixel/dsh-prompt-desk/actions/workflows/ci.yml)
[![DSH](https://img.shields.io/badge/DSH-0.1.5--rc.1-6b46c1)](#compatibility)

**npm:** [`dsh-prompt-desk`](https://www.npmjs.com/package/dsh-prompt-desk) · **one-line install:** `dsh plugin --profile web add dsh-prompt-desk`

> A co-pilot, not an autopilot.

`dsh-prompt-desk` gives DSH's **system prompt** a co-pilot: it lets you **see** which sections the
manual is made of, **write** your own house rules, and **call out** repetition and bloat. It never
edits for you and never keeps score — **the wheel stays in your hands.**

---

## What it does

| | |
|---|---|
| **See it** | Opens the current system prompt as **sections**: what each one is called, where it comes from, how many bytes, and the raw text. It uses the real `ctx.systemPrompt.assemble()`, not a guess. |
| **Edit it** | "My house rules": write a line and choose where it lands in the prompt (**front / middle / back**). Edits take effect **immediately, with no restart** — each section's text is a provider read at assembly time. |
| **Understand it** | "Inspection": the same line in more than one section, **two rules that contradict each other** (one says "do", the other "don't"), a section that is unusually large, a rule left enabled but empty … **facts only**, no decisions made for you. |
| **Undo it** | Every contribution uses this plugin's own section names (`copilot:pre` / `copilot:mid` / `copilot:post`). **Turn the switch off or remove the plugin and everything goes back to the way it was** — it never rewrites anyone else's section. |

### Why the section names are not `deployment:persona-prefix`

DSH lets a section **shadow** another section of the same name (that is exactly how a preset can
override the deployment persona). `dsh-prompt-desk` **deliberately does not** use shadowing: a
co-pilot adds a layer of **your voice**, it does not quietly replace the captain's. To override the
persona, use DSH's own preset mechanism — that is the front door for it.

---

## Install

```powershell
# the npm package name is dsh-prompt-desk (see below for why)
dsh plugin --profile web add dsh-prompt-desk

# local development (link mode; just rebuild after a change)
dsh plugin --profile web add -w .    # run this from the plugin directory

# restart the web host
dsh --profile web --no-open

# hard-refresh the browser (Ctrl+F5)
```

Open **Settings → Prompt Desk**.

> When installing from a local link, the plugin directory's `node_modules` needs
> `@deepseek-ai/schemastery` (the copy bundled with DSH is fine); a normal install from npm resolves
> it through the declared dependency.

> **⚠️ A hard-won note for DSH plugin authors (verified): DSH plugin ids do not support npm scoped
> names.** With the package named `@hwayn/dsh-prompt-desk`, the **host loads it as usual** (the
> routes work), but the **client half is silently dropped from the module roster** — the settings
> page simply vanishes, with no error in the front end. The name must be identical and unscoped in
> **three places**: `package.json`'s `name`, the `name` in `cordis.patch.yml`, and the profile's
> `dependencies` key plus `dsh.profile.bundles`. Hence the repository is `dsh-prompt-desk` and the npm
> package is `dsh-prompt-desk`.

### How to back out

- **To silence it temporarily:** turn off "Enabled" on the settings page — the plugin stops writing
  anything into the prompt and **touches nothing else**.
- **To remove it entirely:** delete the link under `node_modules`, remove `dsh-prompt-desk` from the
  profile's `dsh.profile.bundles`, and restart the host. House rules you have written stay in the
  profile's settings document and can be cleared by hand.
- The plugin **never modifies sections contributed by other plugins**, so backing out needs no patch.

## Interface (host half)

- `GET /dsh-prompt-desk/prompt` → `{ ok, enabled, sections:[{name,bytes,text}], rendered, bytes, tools, contexts, ours, bands }`
  Returns the prompt **as it is really assembled right now**. `:3080/dsh-prompt-desk/prompt` can be
  curled directly, which makes debugging easy.

Settings namespace: `ui-prompt-desk`.

| Field | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Master switch. When off, the plugin writes nothing into the prompt |
| `rules[]` | `[]` | `{ id, title, text, band: pre\|mid\|post, enabled }` |

Section placement (the numbers are free slots from DSH's `SECTION_ORDERS`):

| band | order | Position |
|---|---|---|
| `pre` | 700 | After the deployment persona, before the tool descriptions |
| `mid` | 5500 | After all tool sections |
| `post` | 10150 | At the end of the prompt, before the persona suffix |

---

## Known limitations (an honest list)

- **Add-only:** today it can *add* sections, but cannot delete or rewrite sections contributed by
  other plugins. Making a section "disappear" currently relies on DSH's own configuration (for
  example disabling that plugin) or on writing a house rule that corrects it.
- **Inspection is heuristic:** duplicate detection looks for "a normalized line of length ≥ 30
  appearing in more than one section". It offers **clues**, not a verdict.
- **`{{variables}}` in the preview:** the host half prefers `dsh-system-prompt`'s `renderPrompt()`
  for interpolation; if that package does not resolve inside the profile, it falls back to "join as
  is" (keeping `{{model}}` and the like), in which case the preview is not the final text.
- The assembly preview is produced **without a concrete agent scope**, so `tools` often shows 0 — in
  a real session the tool sections belong to each request's scope.

---

## Status

🌱 **v0.0.1 · the night of 2026-09-30.** Foundation: `ctx.systemPrompt` from
`@deepseek-ai/dsh-system-prompt` (a section registry plus `assemble()`). Verified end to end:
register three sections → edit through the UI → the prompt content changes accordingly → remove them
and it returns to zero.

Author: [Hwayn](https://github.com/Hwayn-pixel) (幻弈)
