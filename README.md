# dsh-copilot

> 一个"副驾驶"，不是"自动驾驶"。
> A co-pilot, not an autopilot.

`dsh-copilot` 给 DSH 的 **system prompt** 配了一位副驾驶：它让你**看清**这份说明书由哪些段组成、
**写下**你自己的家规、并**点名**重复与臃肿。它不替你改，也不打分——**方向盘始终在你手里**。

---

## 它做什么

| | |
|---|---|
| **看得见** | 把当前 system prompt 按**段**摊开：每段叫什么、来自谁、多少字节、原文长什么样。走的是真实的 `ctx.systemPrompt.assemble()`，不是猜的。 |
| **改得动** | 「我的家规」：写一段话，选它落在 prompt 的哪个位置（**靠前 / 中间 / 靠后**）。改完**立刻生效，不用重启**——因为每段的正文是一个 provider，在每次组装时才读取。 |
| **解得开** | 「体检」：同一条话出现在两段以上、某段特别长、规则开着却没写正文……**只看事实**，不替你做决定。 |
| **退得回** | 所有贡献都来自本插件自己的段名（`copilot:pre` / `copilot:mid` / `copilot:post`）。**关掉开关或卸载插件，一切回到原样**——它从不改写别人的段。 |

### 为什么段名不叫 `deployment:persona-prefix`

DSH 允许一个段**按名字遮蔽**同名段（这正是"预设可以盖掉部署 persona"的机制）。`dsh-copilot`
**故意不使用**这种遮蔽：副驾驶是加一层**你的声音**，不是悄悄替换机长的声音。想覆盖 persona，
请用 DSH 自己的预设机制——那才是它的正门。

---

## 安装

```powershell
# 1) 从插件目录挂进 web profile
dsh plugin --profile web add -w .

# 2) 重启 web 宿主
dsh --profile web --no-open

# 3) 浏览器硬刷新（Ctrl+F5）
```

打开 **设置 → 副驾驶**。

> 本地开发时（link 方式安装），插件目录的 `node_modules` 里需要有
> `@deepseek-ai/schemastery`；正式安装由包管理器的依赖声明解决。

## 接口（主机半）

- `GET /dsh-copilot/prompt` → `{ ok, enabled, sections:[{name,bytes,text}], rendered, bytes, tools, contexts, ours, bands }`
  返回**当前真实组装出的**提示词。`:3080/dsh-copilot/prompt` 可以直接 curl，方便排查。

设置命名空间：`ui-copilot`。

| 字段 | 默认 | 含义 |
|---|---|---|
| `enabled` | `true` | 总开关。关掉后本插件不往 prompt 里写任何字 |
| `rules[]` | `[]` | `{ id, title, text, band: pre\|mid\|post, enabled }` |

段落落点（数值取自 DSH 的 `SECTION_ORDERS` 空闲档位）：

| band | order | 位置 |
|---|---|---|
| `pre` | 700 | deployment persona 之后、工具说明之前 |
| `mid` | 5500 | 所有工具段之后 |
| `post` | 10150 | prompt 末尾、persona suffix 之前 |

---

## 已知限制（诚实清单）

- **只增不改**：目前能*新增*段，不能删除或改写别的插件贡献的段。要让某段"消失"目前只能靠 DSH
  自己的配置（例如关掉那个插件），或者写一条家规去纠正它。
- **体检是启发式**：重复检测看的是"长度 ≥30 的规范化行在不止一段里出现"。它只找**线索**，
  不是判决。
- **预览里的 `{{变量}}`**：主机半优先用 `dsh-system-prompt` 的 `renderPrompt()` 插值；如果那个包
  在 profile 里解析不到，就退化成"原样拼接"（保留 `{{model}}` 之类），此时预览不等于最终文本。
- 组装预览是在**没有具体 agent scope** 的情况下调用的，所以 `tools` 常显示 0——真实会话里的工具段
  属于各次请求的 scope。

---

## 状态

🌱 **v0.0.1 · 2026-09-30 夜**。地基：`@deepseek-ai/dsh-system-prompt` 的 `ctx.systemPrompt`
（段注册表 + `assemble()`）。已实测：注册三段 → UI 改写 → 提示词内容随之变化 → 删除后归零。

作者：[Hwayn](https://github.com/Hwayn-pixel)（幻弈）
