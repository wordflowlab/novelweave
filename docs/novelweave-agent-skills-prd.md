# NovelWeave Agent Skills 支持功能 PRD

## 📋 文档信息

| 项目         | 信息                              |
| ------------ | --------------------------------- |
| **文档版本** | v2.2.0                            |
| **创建日期** | 2025-10-19                        |
| **产品名称** | NovelWeave - Agent Skills Support |
| **目标版本** | v0.13.0（核心）+ v0.14.0（市场）  |
| **负责人**   | WordFlow Lab                      |
| **状态**     | 📝 Design Review                  |

## 修订历史

| 版本   | 日期       | 作者         | 变更说明                                    |
| ------ | ---------- | ------------ | ------------------------------------------- |
| v2.2.0 | 2025-10-19 | AI Assistant | **修正核心设计**：AI 自主判断而非关键词匹配 |
| v2.1.0 | 2025-10-19 | AI Assistant | 添加 Skills 市场设计（类似 MCP 市场）       |
| v2.0.0 | 2025-10-19 | AI Assistant | 基于 NovelWeave 实际架构重写                |
| v1.0.0 | 2025-10-19 | Claude       | 初始版本（已废弃）                          |

---

## 📑 目录

1. [执行摘要](#执行摘要)
2. [产品背景](#产品背景)
3. [核心概念](#核心概念)
4. [技术架构](#技术架构)
5. [功能需求](#功能需求)
6. [与现有系统集成](#与现有系统集成)
7. [实现计划](#实现计划)
8. [测试策略](#测试策略)
9. [风险评估](#风险评估)
10. [附录](#附录)

---

## 🎯 实现方案概览

| 方面         | 方案说明                                                              |
| ------------ | --------------------------------------------------------------------- |
| **集成方式** | ✅ **内置到 NovelWeave 项目**（`src/templates/skills/`）              |
| **发布方式** | 随 VSIX 扩展一起打包，用户安装即可使用                                |
| **参考项目** | 学习 `novel-writer-skills`（Claude Code）的内容和结构                 |
| **工具系统** | 使用 NovelWeave 工具分组：`read`, `edit`, `browser`, `command`, `mcp` |
| **版本管理** | 与 NovelWeave 版本同步（v0.13.0+）                                    |

**为什么选择内置集成而非独立包？**

- ✅ 用户体验更好：安装 NovelWeave 后开箱即用
- ✅ 维护更简单：统一版本管理，无需独立发布流程
- ✅ 集成更紧密：深度整合 Modes、Novel Commands、Knowledge Base
- ✅ 发布更快速：随扩展更新，无额外依赖管理

---

## Skills 系统对比分析

在开始技术设计前，重要的是理解三个不同的"Skills"系统，它们虽然名称相同，但实现机制完全不同。

### 三个不同的 Skills 系统

#### 1. Claude API Skills (云端 API)

**参考文档**: [Claude API Skills Guide](https://docs.claude.com/en/api/skills-guide)

**核心特征**:

- 📤 **上传到云端** - 通过 API 上传，存储在 Anthropic 服务器
- 🐳 **容器执行** - 在隔离的 Linux 容器中执行 Python 代码
- 📄 **文件生成** - 可创建 Excel、PowerPoint、PDF、Word 文档
- 🔧 **API 管理** - 通过 REST API 进行 CRUD 操作
- 🏷️ **版本控制** - Epoch timestamp 版本（如 `1759178010641129`）

**使用方式**:

```python
response = client.messages.create(
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [
            {"type": "anthropic", "skill_id": "xlsx", "version": "latest"}
        ]
    },
    tools=[{"type": "code_execution_20250825"}]
)
```

**适用场景**: 需要执行代码、生成文档的 API 集成

---

#### 2. Claude Code Skills (桌面应用)

**参考项目**:

- [novel-writer-skills](https://github.com/wordflowlab/novel-writer-skills)
- [superpowers](https://github.com/obra/superpowers)

**核心特征**:

- 💻 **本地文件** - 存储在 `~/.config/` 或项目目录
- 🔌 **插件系统** - 通过 Plugin 机制管理（如 `anthropic-agent-skills`）
- 🎣 **Hook 注入** - SessionStart Hook 将 Skills 注入上下文
- 📝 **纯提示词** - 不执行代码，仅作为 AI 的知识指导
- 📂 **Git 版本控制** - 使用文件系统和 Git 管理版本

**使用方式**:

```markdown
# .claude/skills/romance-writing/SKILL.md

---

name: romance-novel-conventions
description: "Use when user mentions romance..."
allowed-tools: Read, Grep

---

# 言情小说创作规范

...
```

**工作流程**:

```
Claude Code 启动
  → 加载插件（Plugin System）
  → SessionStart Hook 触发
  → 扫描本地 Skills 文件
  → 注入到对话上下文
  → 发送到 Anthropic API
```

**适用场景**: 桌面应用，需要灵活的本地 Skills 管理

---

#### 3. NovelWeave Skills (我们的实现)

**设计理念**: 学习 Claude Code，但适配 VSCode 扩展架构

**核心特征**:

- 📦 **内置 + 可扩展** - 核心 Skills 内置，支持项目/个人扩展
- 🚀 **扩展启动加载** - Extension 激活时初始化 SkillsManager
- 💉 **System Prompt 注入** - 修改 `SYSTEM_PROMPT()` 函数注入 Skills
- 🎨 **WebView UI** - React 组件管理和可视化
- 🌍 **多 Provider** - 支持所有 AI 提供商（OpenAI、Anthropic、Gemini 等）

**使用方式**:

```typescript
// 内置 Skills: src/templates/skills/
// 项目 Skills: .agent/skills/
// 个人 Skills: globalStorage/skills/

const systemPrompt = SYSTEM_PROMPT({
	// ...其他参数
	skillsManager: SkillsManager.getInstance(),
})
```

**工作流程**:

```
VSCode 启动 NovelWeave
  → extension.ts 激活
  → SkillsManager.initialize()
  → 扫描 3 个位置的 Skills
  → 用户发起对话
  → SYSTEM_PROMPT() 注入相关 Skills
  → 发送到 AI Provider（任意）
```

**适用场景**: VSCode 扩展，需要与多 Provider 和现有功能深度集成

---

### 详细技术对比

| 维度            | Claude API Skills        | Claude Code Skills | NovelWeave Skills  |
| --------------- | ------------------------ | ------------------ | ------------------ |
| **运行环境**    | ☁️ 云端隔离容器          | 💻 桌面应用        | 💻 VSCode 扩展     |
| **Skills 存储** | 上传到 Anthropic 服务器  | 本地文件系统       | 本地文件系统       |
| **加载时机**    | API 调用时引用           | SessionStart Hook  | Extension 激活时   |
| **注入位置**    | `container` 参数         | 对话上下文         | System Prompt      |
| **执行能力**    | ✅ 执行 Python 代码      | ❌ 仅提示词        | ❌ 仅提示词        |
| **文件生成**    | ✅ xlsx, pptx, pdf, docx | ❌ 不支持          | ❌ 不支持          |
| **管理方式**    | REST API                 | Plugin System      | 内置功能 + 文件    |
| **版本控制**    | Epoch timestamps         | Git                | Git                |
| **扩展性**      | 上传 custom skills       | 安装插件           | 文件系统添加       |
| **AI Provider** | Anthropic only           | Anthropic only     | ✅ 全部支持        |
| **UI 界面**     | ❌ API only              | 命令行             | ✅ WebView (React) |
| **网络需求**    | 需上传 Skills            | 需发送上下文       | 需发送上下文       |
| **适用场景**    | API 集成，代码执行       | 桌面写作应用       | VSCode 开发环境    |

---

### NovelWeave 的设计选择

#### 为什么不采用插件系统？

虽然 Claude Code 使用插件系统管理 Skills，但 NovelWeave 选择内置方式，原因如下：

**1. NovelWeave 本身就是"插件"**

```
VSCode (平台)
  └── NovelWeave (扩展/插件)
      └── Skills (功能模块)
```

- NovelWeave 是 VSCode 扩展，再套一层插件系统会增加复杂度
- 用户已经通过 VSCode 的扩展市场安装 NovelWeave

**2. 架构一致性**

- NovelWeave 的其他功能（Modes、Commands、Knowledge Base）都是内置的
- 保持统一的架构模式，降低学习成本

**3. 维护简化**

- 单一代码库，统一版本管理
- 减少插件兼容性问题
- 简化发布流程

#### 如何保持灵活性？

虽然不用插件系统，NovelWeave 仍提供三层 Skills 架构：

```
1. 内置 Skills (src/templates/skills/)
   ↓ 优先级最高，扩展自带

2. 项目 Skills (.agent/skills/)
   ↓ 可覆盖内置，团队共享

3. 个人 Skills (globalStorage/skills/)
   ↓ 用户私人配置
```

**扩展方式**:

- ✅ 用户可在项目中添加 `.agent/skills/`（通过 Git 共享）
- ✅ 用户可在全局添加个人 Skills
- ✅ **推荐方案：Skills 市场**（类似 MCP 市场）：
    - 📦 **社区 Skills 仓库**：`https://github.com/wordflowlab/novelweave-skills-registry`
    - 🔍 **市场发现**：在 WebView UI 中浏览和搜索 Skills
    - ⚡ **一键安装**：点击按钮即可安装到 globalStorage 或项目
    - 🔄 **自动更新**：检查并更新已安装的 Skills
    - ⭐ **社区贡献**：通过 PR 提交新 Skills 到 registry

**Skills 市场架构**（借鉴 MCP 市场）:

```json
// novelweave-skills-registry/registry.json
{
	"skills": [
		{
			"id": "romance-writing",
			"name": "Romance Novel Conventions",
			"description": "Best practices for romance writing",
			"author": "WordFlow Lab",
			"version": "1.0.0",
			"repository": "https://github.com/wordflowlab/skill-romance-writing",
			"categories": ["writing", "genre-knowledge"],
			"keywords": ["romance", "love", "relationship", "言情"],
			"downloads": 1523,
			"rating": 4.8,
			"verified": true
		},
		{
			"id": "fantasy-worldbuilding",
			"name": "Fantasy World Building",
			"description": "Create consistent fantasy worlds",
			"author": "Community",
			"version": "2.1.0",
			"repository": "https://github.com/user/skill-fantasy-worldbuilding",
			"categories": ["writing", "genre-knowledge"],
			"keywords": ["fantasy", "magic", "worldbuilding", "奇幻"],
			"downloads": 892,
			"rating": 4.6,
			"verified": false
		}
	]
}
```

**用户工作流**:

```typescript
// 1. 浏览市场
WebView: Skills 面板 → "浏览市场" 按钮

// 2. 搜索 Skills
用户输入: "romance"
显示: romance-writing, romance-editing, ...

// 3. 查看详情
点击 Skill → 显示详细信息、示例、评分、评论

// 4. 安装 Skill
点击"安装" → 选择位置（Project / Personal）
系统: git clone 到对应目录 → 自动刷新 Skills

// 5. 更新 Skill
检测到更新 → 提示用户 → 一键更新（git pull）
```

**对比其他方案**:

| 方案            | 优点                                          | 缺点                              | 适用场景                |
| --------------- | --------------------------------------------- | --------------------------------- | ----------------------- |
| **Skills 市场** | ⭐ 最佳用户体验<br>⭐ 社区驱动<br>⭐ 自动更新 | 需要维护 registry                 | ✅ **推荐作为主要方案** |
| VSCode 扩展市场 | 官方渠道<br>信任度高                          | 发布流程复杂<br>更新慢            | 官方精选 Skills         |
| npm 包管理      | 技术用户熟悉                                  | 需要 CLI 工具<br>对普通用户不友好 | 高级用户/开发者         |
| Git 仓库克隆    | 最灵活                                        | 完全手动<br>学习成本高            | 实验性 Skills           |

**更新机制**:

- ✅ 内置 Skills 随扩展更新自动更新
- ✅ 市场 Skills 可设置自动更新或手动更新
- ✅ 项目 Skills 由 Git 管理（团队协作）
- ✅ 个人 Skills 可选择性更新（避免覆盖自定义）

#### 与 Claude Code 的理念一致性

虽然实现机制不同，但核心理念相同：

| 理念           | Claude Code              | NovelWeave               |
| -------------- | ------------------------ | ------------------------ |
| **本地优先**   | ✅ 本地文件              | ✅ 本地文件              |
| **提示词指导** | ✅ 不执行代码            | ✅ 不执行代码            |
| **自动激活**   | ✅ AI 根据上下文自主判断 | ✅ AI 根据上下文自主判断 |
| **Git 友好**   | ✅ 文件版本控制          | ✅ 文件版本控制          |
| **可扩展**     | ✅ 添加插件              | ✅ 添加文件              |

#### 为什么支持多 Provider？

这是 NovelWeave 相比 Claude Code 的关键优势：

```typescript
// NovelWeave 支持所有 Provider
const providers = [
	"Anthropic", // Claude
	"OpenAI", // GPT-4
	"Google", // Gemini
	"Azure OpenAI",
	"Ollama", // 本地模型
	// ... 更多
]

// Skills 通过 System Prompt 注入，与 Provider 无关
```

**技术实现**:

- Skills 内容注入到 System Prompt
- System Prompt 是所有 Provider 的通用接口
- 不依赖特定 Provider 的 API 特性

---

### 三个系统的使用建议

| 需求                               | 推荐系统                 | 理由                   |
| ---------------------------------- | ------------------------ | ---------------------- |
| **API 集成，需要执行代码生成文档** | Claude API Skills        | 唯一支持代码执行的方案 |
| **桌面写作，专注 Claude**          | Claude Code Skills       | 官方桌面应用，插件生态 |
| **VSCode 开发，多模型支持**        | NovelWeave Skills        | 深度集成开发环境       |
| **团队协作，需要共享 Skills**      | Claude Code / NovelWeave | 都支持 Git 版本控制    |
| **个人使用，简单快速**             | NovelWeave Skills        | 开箱即用，无需配置     |

---

## 执行摘要

### 一句话描述

为 NovelWeave 添加 **Agent Skills** 支持，使 AI 能够根据用户需求自动发现和使用模块化的专业知识，学习 Claude Code 的 Skills 格式并适配 NovelWeave，深度集成到 Modes、Provider 和 WebView 架构中。

### 核心价值

1. ✅ **自动知识激活** - AI 根据对话内容自动使用相关 Skills，无需手动触发
2. ✅ **内置开箱即用** - 用户安装 NovelWeave 后即可使用预置的写作 Skills
3. ✅ **深度系统集成** - 与 Modes、Novel Commands、Knowledge Base、MCP 协同工作
4. ✅ **学习最佳实践** - 基于 `novel-writer-skills` 改进，适配 NovelWeave 生态
5. ✅ **团队协作友好** - 通过 git 自然共享项目 Skills（`.agent/skills/`）
6. ✅ **多模型支持** - 通过 System Prompt 注入，支持所有 AI 提供商

### 与 Claude Code 的对比

**设计验证说明**：以下对比基于对 Claude Code Skills（特别是 [superpowers](https://github.com/obra/superpowers) 插件）的深入研究。虽然实现机制不同，但 NovelWeave 的设计在核心理念上与 Claude Code **高度一致且经过验证**。

基于对 Claude Code Skills 机制的深入研究（参见"Skills 系统对比分析"章节），我们发现两者在核心理念上高度一致：

| 特性               | Claude Code                   | NovelWeave                                |
| ------------------ | ----------------------------- | ----------------------------------------- |
| **核心机制**       | ✅ 本地文件 + 提示词注入      | ✅ 本地文件 + System Prompt 注入          |
| **Skills 格式**    | ✅ SKILL.md (YAML + Markdown) | ✅ 完全兼容（添加 NovelWeave 扩展字段）   |
| **自动激活**       | ✅ AI 根据上下文自主判断      | ✅ AI 根据上下文自主判断（相同机制）      |
| **代码执行**       | ❌ 不执行，仅指导             | ❌ 不执行，仅指导                         |
| **版本控制**       | ✅ Git                        | ✅ Git                                    |
| **管理方式**       | 🔌 插件系统（灵活）           | 📦 内置功能（简单）                       |
| **AI Provider**    | Anthropic only                | ✅ 全部支持（OpenAI/Gemini/Ollama等）     |
| **UI 界面**        | 命令行                        | ✅ WebView (React)                        |
| **扩展性**         | 安装插件                      | ✅ Skills 市场（类似 MCP 市场）+ 三层架构 |
| **与其他功能集成** | 独立系统                      | ✅ 深度集成 Modes、Commands、MCP          |
| **团队协作**       | ✅ 通过 Git 共享              | ✅ 通过 Git 共享 `.agent/skills/`         |
| **适用场景**       | 桌面写作应用                  | VSCode 开发环境                           |

**相似性**：

- ✅ 都采用本地文件存储
- ✅ 都通过提示词指导 AI（不执行代码）
- ✅ 都支持 Git 版本控制和团队共享
- ✅ 都支持项目级和个人级 Skills

**差异性**：

- 🔄 管理方式：Claude Code 用插件系统，NovelWeave 用内置功能
- 🌍 多模型：NovelWeave 支持所有 AI Provider
- 🎨 UI：NovelWeave 提供可视化管理界面
- 🔗 集成：NovelWeave 与 Modes、Commands 深度集成

**设计权衡分析**：

| 考虑因素       | 插件系统（Claude Code）   | 内置功能 + Skills 市场（NovelWeave）  | 选择理由                                 |
| -------------- | ------------------------- | ------------------------------------- | ---------------------------------------- |
| **扩展灵活性** | ⭐⭐⭐⭐⭐ 可独立发布插件 | ⭐⭐⭐⭐⭐ Skills 市场 + 三层架构     | NovelWeave 通过市场机制达到同等灵活性    |
| **用户体验**   | ⭐⭐⭐ 需要安装插件       | ⭐⭐⭐⭐⭐ 内置 + 一键安装市场 Skills | 内置开箱即用，市场一键安装               |
| **维护成本**   | ⭐⭐ 需要维护插件生态     | ⭐⭐⭐⭐ 维护 registry 即可           | 只需维护 registry.json，无需审核代码     |
| **架构一致性** | ⭐⭐⭐ 独立子系统         | ⭐⭐⭐⭐⭐ 与其他功能一致             | NovelWeave 的 Modes、Commands 都是内置的 |
| **社区贡献**   | ⭐⭐⭐⭐⭐ 插件市场分发   | ⭐⭐⭐⭐⭐ Skills 市场（类似 MCP）    | Skills 市场提供同等能力，更轻量级        |
| **安全性**     | ⭐⭐⭐ 插件可执行代码     | ⭐⭐⭐⭐⭐ Skills 只是文本文件        | Skills 不执行代码，更安全                |

**结论**：对于 NovelWeave 这样的 VSCode 扩展，**内置功能 + Skills 市场是最优选择**，因为：

1. ✅ VSCode 本身就是插件系统，NovelWeave 是其中的扩展
2. ✅ 避免"插件套插件"的架构复杂度
3. ✅ 与现有功能（Modes、Commands）保持一致
4. ✅ 开箱即用的用户体验更好
5. ✅ **Skills 市场提供与插件系统同等的扩展能力**
6. ✅ Skills 只是文本文件，比插件更安全
7. ✅ 社区可以轻松贡献（PR 到 registry），无需发布流程

---

## 产品背景

### 问题陈述

#### 当前痛点

1. **知识分散**
    - 写作技巧散落在各种文档中
    - 需要手动在对话中提供上下文
    - 无法自动应用领域专业知识

2. **重复性工作**
    - 每次对话都要重复相同的指令
    - 无法复用已有的工作流程
    - 团队成员各自维护类似的提示词

3. **现有解决方案的局限**
    - **Agent Rules (`.agent-rules`)**: 静态文本，缺乏结构化
    - **Custom Modes**: 需要手动切换，不能自动组合
    - **Custom Instructions**: 全局性，无法按需激活

#### 为什么选择 Agent Skills？

Claude Code 的 Agent Skills 是目前业界最成熟的模型调用知识系统：

1. **模型调用 vs 用户调用**
    - Skills 是 **AI 自主决定** 何时使用的
    - 斜杠命令是 **用户明确触发** 的
    - 这种设计让 AI 更智能、更主动

2. **渐进式披露**
    - 扫描时只读取 frontmatter（元数据）
    - 只在 AI 选择使用时才加载完整内容
    - 性能优化且不浪费上下文

3. **生态系统成熟**
    - 已有社区 Skills 可用
    - 标准化的格式易于共享
    - Anthropic 官方支持和文档

### 战略意义

1. **技术领先**
    - 成为首个支持 Agent Skills 的多模型 IDE 扩展
    - 比 Cursor、Copilot 更先进的知识管理

2. **小说创作优化**
    - 预置小说类型 Skills（奇幻、言情、悬疑等）
    - 写作技巧 Skills（对话、节奏、角色塑造）
    - 质量检查 Skills（一致性、时间线）

3. **社区生态**
    - 作家可以分享自己的创作经验
    - 编辑可以发布审稿标准
    - 出版社可以提供风格指南

---

## 核心概念

### Agent Skills 是什么？

**Agent Skills** 是包含专业知识的模块化目录，AI 根据对话内容自动发现和使用。

#### 基本结构

```
my-skill/
├── SKILL.md          # 必需：技能描述和指令
├── reference.md      # 可选：详细参考文档
├── examples.md       # 可选：使用示例
├── scripts/          # 可选：辅助脚本
│   └── helper.py
└── templates/        # 可选：模板文件
    └── template.txt
```

#### SKILL.md 格式

```yaml
---
name: Fantasy World Building
description: Guide for creating consistent fantasy worlds with magic systems, geography, and cultures. Use when discussing fantasy novels, world-building, or magic systems.
allowed_tool_groups: [read, edit]  # 可选：限制工具分组权限（NovelWeave）
version: 1.0.0                     # 可选：版本号
---

# Fantasy World Building

## Instructions

1. Start with the magic system's rules and limitations
2. Design geography based on magical elements
3. Develop cultures influenced by magic availability
4. Create conflicts driven by magical disparities

## Key Principles

- Magic should have costs and limitations
- Geography should make logical sense
- Cultures should feel distinct yet connected
- Conflicts should arise naturally from the world's rules

## Examples

See [examples.md](examples.md) for detailed world-building examples.
```

### 工作原理

**核心理念**：✅ **AI 自主判断** - 由 AI 根据上下文决定何时使用哪个 Skill，而非机械的关键词匹配。

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 扫描阶段（启动时）                                          │
│    SkillsManager 扫描三个位置：                                │
│    - src/templates/skills/     (内置 Skills)                 │
│    - .agent/skills/            (项目 Skills)                 │
│    - globalStorage/skills/     (个人 Skills)                 │
│                                                               │
│    只读取 frontmatter (name, description, keywords 等)        │
│    ⚡ 性能优化：不加载完整内容，扫描 100 个 Skills < 50ms      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 注入阶段（生成 System Prompt 时）                          │
│    将 Skills 摘要注入到 System Prompt：                       │
│                                                               │
│    ## Available Agent Skills                                  │
│                                                               │
│    - **Fantasy World Building**: Guide for creating          │
│      consistent fantasy worlds. Use when discussing magic,   │
│      world-building, or fantasy novels.                       │
│                                                               │
│    - **Romance Writing**: Best practices for writing          │
│      romantic scenes. Use when writing love stories or        │
│      developing romantic relationships.                       │
│                                                               │
│    **How to use**: When a skill is relevant, announce:       │
│    [USING SKILL: skill-name]                                  │
│                                                               │
│    🎯 AI 根据对话内容和 description 自主判断使用哪个 Skill    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 激活阶段（AI 自主决策）                                     │
│                                                               │
│    用户: "帮我设计一个魔法系统"                                │
│    AI 判断: Fantasy World Building Skill 相关                 │
│    AI 响应: "[USING SKILL: Fantasy World Building]            │
│             Let me help you design a magic system..."        │
│                                                               │
│    系统检测到声明 → 加载完整 SKILL.md 内容                    │
│    AI 按照 Skill 的详细指导工作                               │
│                                                               │
│    ⚠️ 没有关键词匹配！AI 自己理解语义并判断                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 持续使用（对话中）                                          │
│    已激活的 Skills 保持在上下文中                              │
│    AI 可以组合使用多个 Skills                                 │
│    AI 可以自主停用不再需要的 Skills                           │
│    用户可以在 UI 中查看激活的 Skills                          │
└─────────────────────────────────────────────────────────────┘
```

**与关键词匹配的对比**：

| 方面         | ❌ 关键词匹配（错误）                           | ✅ AI 自主判断（正确）             |
| ------------ | ----------------------------------------------- | ---------------------------------- |
| **触发方式** | 检测到 "romance" 关键词 → 自动激活              | AI 理解语义 → 自主决定使用         |
| **灵活性**   | 固定规则，无法理解同义词                        | 理解"爱情故事"、"情感线"等变化表达 |
| **准确性**   | 可能误激活（"romantic comedy" ≠ romance novel） | AI 理解具体场景，判断准确          |
| **组合能力** | 难以处理多个 Skills 的组合                      | AI 可智能组合多个相关 Skills       |
| **用户体验** | 机械、不智能                                    | 自然、智能，符合"Agent"定位        |

**关键词的真正用途**：

`keywords` 字段**不是**用于机械匹配，而是：

1. 帮助 AI 理解 Skill 的适用场景（作为 description 的补充）
2. 帮助用户搜索和过滤 Skills（在 UI 中）
3. 用于市场的 Skills 分类和推荐

### 三种 Skills 类型

#### 1. 个人 Skills（Personal Skills）

**位置**: `~/.claude/skills/`（使用 NovelWeave 的 globalStorageUri）

**用途**:

- 个人写作风格和偏好
- 实验性的新 Skills
- 私人工作流程

**示例**:

```
~/.claude/skills/
├── my-writing-style/
│   └── SKILL.md
├── my-research-workflow/
│   └── SKILL.md
└── my-editing-checklist/
    └── SKILL.md
```

#### 2. 项目 Skills（Project Skills）

**位置**: `.agent/skills/`（遵循 NovelWeave 的 .agent/ 规范）

**用途**:

- 团队共享的工作流程
- 项目特定的写作规范
- 系列小说的设定知识库

**示例**:

```
my-novel-project/
└── .agent/
    └── skills/
        ├── series-continuity/
        │   ├── SKILL.md
        │   ├── characters.md
        │   └── timeline.md
        ├── team-style-guide/
        │   └── SKILL.md
        └── world-bible/
            ├── SKILL.md
            ├── magic-system.md
            └── geography.md
```

#### 3. 内置 Skills（Built-in Skills）

**位置**: `src/templates/skills/` (集成到 NovelWeave 项目中)

**用途**:

- NovelWeave 官方预置 Skills
- 随扩展一起发布，用户安装即可使用
- 作为项目的一部分，统一版本管理

**说明**:

- **不能直接使用 `novel-writer-skills`** - 它是为 Claude Code 设计的
- **我们要学习它的结构** - 参考其 Skills 内容和组织方式
- **集成到 NovelWeave 项目** - 作为内置 Skills，不是独立包

**目录结构**（集成到项目）:

```
src/
└── templates/
    └── skills/                   # 内置 Skills 目录
        ├── genre-knowledge/
        │   ├── romance/
        │   │   └── SKILL.md      # 参考 novel-writer-skills/romance
        │   ├── mystery/
        │   │   └── SKILL.md      # 参考 novel-writer-skills/mystery
        │   └── fantasy/
        │       └── SKILL.md      # 参考 novel-writer-skills/fantasy
        │
        ├── quality-assurance/
        │   ├── consistency-checker/
        │   │   └── SKILL.md      # 参考并改进
        │   ├── workflow-guide/
        │   │   └── SKILL.md      # 适配 NovelWeave 工作流
        │   └── requirement-detector/
        │       └── SKILL.md
        │
        └── writing-techniques/
            ├── dialogue-techniques/
            │   └── SKILL.md      # 参考并优化
            └── scene-structure/
                └── SKILL.md
```

**打包发布**:

- Skills 文件包含在 VSIX 包中
- 用户安装扩展时自动可用
- 与扩展版本同步更新

**开发计划**:

1. 研究 `novel-writer-skills` 的 Skills 内容
2. 提取通用的写作知识和技巧
3. 改写为 NovelWeave 适配版本
4. 放入 `src/templates/skills/` 目录

---

## 技术架构

### 系统架构图

```
┌───────────────────────────────────────────────────────────────┐
│                    NovelWeave Extension                        │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   ClineProvider                          │  │
│  │  - 管理 AI 对话                                          │  │
│  │  - 协调所有服务                                          │  │
│  └────────────────────┬────────────────────────────────────┘  │
│                       │                                        │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │              SkillsManager (新增)                        │  │
│  │  - scanSkills(): 扫描所有 Skills                        │  │
│  │  - getSkillsForMode(mode): 获取特定 Mode 的 Skills      │  │
│  │  - activateSkill(skillId): 激活 Skill                   │  │
│  │  - getSkillsSummary(): 获取 Skills 列表用于 System Prompt│ │
│  └────────┬─────────────────────────┬─────────────────────┘  │
│           │                         │                         │
│  ┌────────▼─────────┐    ┌─────────▼────────┐               │
│  │ System Prompt    │    │  WebView UI       │               │
│  │ Generator        │    │  (React)          │               │
│  │                  │    │                   │               │
│  │ SYSTEM_PROMPT()  │    │ SkillsPanel.tsx   │               │
│  │ + Skills Section │    │ SkillsStatus.tsx  │               │
│  └──────────────────┘    └───────────────────┘               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼─────────┐         ┌─────────▼─────────┐
    │  文件系统层         │         │   WebView 通信     │
    ├───────────────────┤         ├───────────────────┤
    │ dist/templates/   │         │ postMessage       │
    │   skills/         │         │ messageHandler    │
    │ .agent/skills/    │         │                   │
    │ globalStorage/    │         │                   │
    │   skills/         │         │                   │
    └───────────────────┘         └───────────────────┘
```

### 核心模块设计

#### 1. SkillsManager（核心服务）

**位置**: `src/services/skills/SkillsManager.ts`

```typescript
import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import matter from "gray-matter"
import { McpHub } from "../mcp/McpHub"

/**
 * Skill 接口定义
 */
export interface Skill {
	id: string
	name: string
	description: string
	path: string
	source: "personal" | "project" | "extension"

	// Optional fields from YAML frontmatter
	allowedToolGroups?: string[] // NovelWeave 工具分组: ['read', 'edit', 'browser', 'command', 'mcp']
	keywords?: string[] // 帮助 AI 理解适用场景的关键词（供 AI 参考，非机械匹配）
	version?: string
	whenToUse?: string // 详细说明何时使用此 Skill（供 AI 判断）

	// Content loaded on demand
	content?: string
	supportFiles?: string[]

	// Integration fields
	mcpResources?: string[] // Associated MCP resources
	requiredModes?: string[] // Which modes this skill is relevant for
}

/**
 * Skills 配置
 */
export interface SkillsConfig {
	enabled: boolean
	disabledSkills: string[] // Skill IDs to disable
	perModeConfig: Record<
		string,
		{
			enabledSkills?: string[] // 特定 Mode 启用的 Skills（影响 System Prompt 中的列表）
		}
	>
}

/**
 * Skills Manager - 管理 Agent Skills 的核心服务
 */
export class SkillsManager {
	private static instance: SkillsManager

	private skills: Map<string, Skill> = new Map()
	private activeSkills: Set<string> = new Set()
	private contentCache: Map<string, string> = new Map()

	private constructor(
		private context: vscode.ExtensionContext,
		private mcpHub?: McpHub,
	) {}

	static getInstance(context: vscode.ExtensionContext, mcpHub?: McpHub): SkillsManager {
		if (!SkillsManager.instance) {
			SkillsManager.instance = new SkillsManager(context, mcpHub)
		}
		return SkillsManager.instance
	}

	/**
	 * 初始化 - 扫描所有 Skills
	 */
	async initialize(): Promise<void> {
		await this.scanSkills()
	}

	/**
	 * 扫描所有 Skills 目录
	 */
	async scanSkills(): Promise<void> {
		this.skills.clear()

		const paths = this.getSkillsPaths()

		for (const [source, basePath] of paths) {
			try {
				await this.scanDirectory(basePath, source)
			} catch (error) {
				console.warn(`Failed to scan skills from ${basePath}:`, error)
			}
		}

		console.log(`Scanned ${this.skills.size} skills`)
	}

	/**
	 * 获取 Skills 搜索路径
	 */
	private getSkillsPaths(): Array<["personal" | "project" | "extension", string]> {
		const paths: Array<["personal" | "project" | "extension", string]> = []

		// 1. Built-in skills (扩展内置，最高优先级)
		const builtinPath = path.join(this.context.extensionPath, "dist", "templates", "skills")
		paths.push(["extension", builtinPath])

		// 2. Project skills (项目特定)
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (workspaceFolders && workspaceFolders.length > 0) {
			const projectPath = path.join(workspaceFolders[0].uri.fsPath, ".agent", "skills")
			paths.push(["project", projectPath])
		}

		// 3. Personal skills (全局用户配置)
		const personalPath = path.join(this.context.globalStorageUri.fsPath, "skills")
		paths.push(["personal", personalPath])

		return paths
	}

	/**
	 * 扫描目录中的 Skills
	 */
	private async scanDirectory(basePath: string, source: "personal" | "project" | "extension"): Promise<void> {
		try {
			const entries = await fs.readdir(basePath, { withFileTypes: true })

			for (const entry of entries) {
				if (entry.isDirectory()) {
					const skillPath = path.join(basePath, entry.name)
					const skillFile = path.join(skillPath, "SKILL.md")

					try {
						await fs.access(skillFile)
						const skill = await this.parseSkillFile(skillFile, source)
						this.skills.set(skill.id, skill)
					} catch {
						// No SKILL.md in this directory
					}
				}
			}
		} catch (error) {
			// Directory doesn't exist
		}
	}

	/**
	 * 解析 SKILL.md 文件
	 */
	private async parseSkillFile(filePath: string, source: "personal" | "project" | "extension"): Promise<Skill> {
		const content = await fs.readFile(filePath, "utf-8")
		const { data: frontmatter, content: markdown } = matter(content)

		// Validate required fields
		if (!frontmatter.name || !frontmatter.description) {
			throw new Error(`Invalid SKILL.md: missing name or description in ${filePath}`)
		}

		const skillDir = path.dirname(filePath)
		const skillId = this.generateSkillId(skillDir, source)

		// Find support files
		const supportFiles = await this.findSupportFiles(skillDir)

		return {
			id: skillId,
			name: frontmatter.name,
			description: frontmatter.description,
			path: skillDir,
			source,
			allowedTools: this.parseAllowedTools(frontmatter["allowed-tools"]),
			version: frontmatter.version,
			whenToUse: frontmatter.when_to_use,
			supportFiles,
			mcpResources: frontmatter.mcp_resources,
			requiredModes: frontmatter.required_modes,
			// Don't load content yet - lazy loading
		}
	}

	/**
	 * 生成 Skill ID
	 */
	private generateSkillId(skillPath: string, source: string): string {
		const dirName = path.basename(skillPath)
		return `${source}:${dirName}`
	}

	/**
	 * 解析 allowed-tools 字段
	 */
	private parseAllowedTools(value: any): string[] | undefined {
		if (!value) return undefined
		if (typeof value === "string") {
			return value.split(",").map((s) => s.trim())
		}
		if (Array.isArray(value)) {
			return value.map((s) => String(s).trim())
		}
		return undefined
	}

	/**
	 * 查找支持文件
	 */
	private async findSupportFiles(skillDir: string): Promise<string[]> {
		const files: string[] = []

		try {
			const entries = await fs.readdir(skillDir, { withFileTypes: true, recursive: true })

			for (const entry of entries) {
				if (entry.isFile() && entry.name !== "SKILL.md") {
					const relativePath = path.relative(skillDir, path.join(entry.path, entry.name))
					files.push(relativePath)
				}
			}
		} catch (error) {
			// Ignore errors
		}

		return files
	}

	/**
	 * 获取 Skills 摘要（用于 System Prompt）
	 */
	getSkillsSummary(mode?: string): Array<{ id: string; name: string; description: string }> {
		const config = this.context.globalState.get<SkillsConfig>("skillsConfig")
		const disabled = new Set(config?.disabledSkills || [])

		return Array.from(this.skills.values())
			.filter((skill) => {
				// Filter out disabled skills
				if (disabled.has(skill.id)) return false

				// Filter by mode if specified
				if (mode && skill.requiredModes && !skill.requiredModes.includes(mode)) {
					return false
				}

				return true
			})
			.map((skill) => ({
				id: skill.id,
				name: skill.name,
				description: skill.description + (skill.whenToUse ? `. Use when: ${skill.whenToUse}` : ""),
			}))
	}

	/**
	 * 加载 Skill 的完整内容
	 */
	async loadSkillContent(skillId: string): Promise<string> {
		// Check cache first
		if (this.contentCache.has(skillId)) {
			return this.contentCache.get(skillId)!
		}

		const skill = this.skills.get(skillId)
		if (!skill) {
			throw new Error(`Skill not found: ${skillId}`)
		}

		const skillFile = path.join(skill.path, "SKILL.md")
		const content = await fs.readFile(skillFile, "utf-8")
		const { content: markdown } = matter(content)

		// Cache the content
		this.contentCache.set(skillId, markdown)

		return markdown
	}

	/**
	 * 激活 Skill
	 */
	async activateSkill(skillId: string): Promise<void> {
		this.activeSkills.add(skillId)

		// Load MCP resources if specified
		const skill = this.skills.get(skillId)
		if (skill?.mcpResources && this.mcpHub) {
			for (const resourceUri of skill.mcpResources) {
				try {
					await this.mcpHub.fetchResource(resourceUri)
				} catch (error) {
					console.warn(`Failed to load MCP resource ${resourceUri}:`, error)
				}
			}
		}
	}

	/**
	 * 停用 Skill
	 */
	deactivateSkill(skillId: string): void {
		this.activeSkills.delete(skillId)
	}

	/**
	 * 获取激活的 Skills
	 */
	getActiveSkills(): Skill[] {
		return Array.from(this.activeSkills)
			.map((id) => this.skills.get(id))
			.filter((skill): skill is Skill => skill !== undefined)
	}

	/**
	 * 获取所有 Skills
	 */
	getAllSkills(): Skill[] {
		return Array.from(this.skills.values())
	}

	/**
	 * 按来源获取 Skills
	 */
	getSkillsBySource(source: "personal" | "project" | "extension"): Skill[] {
		return Array.from(this.skills.values()).filter((skill) => skill.source === source)
	}

	/**
	 * 清除缓存
	 */
	clearCache(): void {
		this.contentCache.clear()
	}
}
```

#### 2. System Prompt 集成

**位置**: `src/core/prompts/system.ts` (修改现有文件)

```typescript
// 在 SYSTEM_PROMPT 函数中添加 Skills 支持

export const SYSTEM_PROMPT = async (
	context: vscode.ExtensionContext,
	cwd: string,
	supportsComputerUse: boolean,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	browserViewportSize?: string,
	inputMode: Mode = defaultModeSlug,
	customModePrompts?: CustomModePrompts,
	customModes?: ModeConfig[],
	globalCustomInstructions?: string,
	diffEnabled?: boolean,
	experiments?: Experiments,
	enableMcpServerCreation?: boolean,
	language?: string,
	rooIgnoreInstructions?: string,
	partialReadsEnabled?: boolean,
	settings?: SystemPromptSettings,
	todoList?: TodoItem[],
	modelId?: string,
	clineProviderState?: ClineProviderState,
	skillsManager?: SkillsManager, // 新增参数
): Promise<string> => {
	// ... existing code ...

	const mode = getModeBySlug(inputMode, customModes)?.slug || defaultModeSlug

	// Generate Skills section
	const skillsSection = skillsManager ? await generateSkillsSection(skillsManager, mode) : ""

	return generatePrompt(
		context,
		cwd,
		supportsComputerUse,
		currentMode.slug,
		mcpHub,
		effectiveDiffStrategy,
		browserViewportSize,
		promptComponent,
		customModes,
		globalCustomInstructions,
		diffEnabled,
		experiments,
		enableMcpServerCreation,
		language,
		rooIgnoreInstructions,
		partialReadsEnabled,
		settings,
		todoList,
		modelId,
		clineProviderState,
		skillsSection, // 传递 Skills section
	)
}

/**
 * 生成 Skills 提示部分
 */
async function generateSkillsSection(skillsManager: SkillsManager, mode: string): Promise<string> {
	const skills = skillsManager.getSkillsSummary(mode)

	if (skills.length === 0) {
		return ""
	}

	return `

## Available Agent Skills

You have access to specialized knowledge through Agent Skills. These are modular capabilities that you can use when relevant to the user's request.

**Available Skills:**

${skills.map((skill) => `- **${skill.name}**: ${skill.description}`).join("\n")}

**How to Use Skills:**

1. When a skill is relevant to the user's request, announce it:
   \`[USING SKILL: ${skills[0].name}]\`

2. I will then provide you with the full skill content

3. Follow the skill's instructions carefully

4. You can use multiple skills in a single response if needed

5. Skills are discoverable - only use them when they add value

**Important:** Only announce skills that are directly relevant to the current task. Don't use skills just because they're available.
`
}
```

**位置**: `src/core/prompts/sections/skills.ts` (新文件)

```typescript
import { SkillsManager } from "../../../services/skills/SkillsManager"

/**
 * Skills 提示部分生成器
 */
export async function generateSkillsSection(skillsManager: SkillsManager, mode: string): Promise<string> {
	const config = await skillsManager.getConfig()

	if (!config.enabled) {
		return ""
	}

	const skills = skillsManager.getSkillsSummary(mode)

	if (skills.length === 0) {
		return ""
	}

	return `

## Agent Skills

You have access to the following specialized skills. Use them when relevant by announcing: [USING SKILL: skill-name]

${skills.map((s) => `- **${s.name}**: ${s.description}`).join("\n")}
`
}

/**
 * 从 AI 响应中提取激活的 Skills
 */
export function extractActivatedSkills(response: string): string[] {
	const pattern = /\[USING SKILL:\s*([^\]]+)\]/gi
	const matches = Array.from(response.matchAll(pattern))
	return matches.map((m) => m[1].trim())
}
```

#### 3. WebView UI 组件

**位置**: `webview-ui/src/components/skills/SkillsPanel.tsx` (新文件)

```typescript
import React, { useState, useEffect } from 'react';
import { vscode } from '../../utils/vscode';
import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';

interface Skill {
  id: string;
  name: string;
  description: string;
  source: 'personal' | 'project' | 'extension';
  version?: string;
  active?: boolean;
}

export const SkillsPanel: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Request skills data from extension
    vscode.postMessage({ type: 'getSkills' });

    // Listen for skills data
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'skillsData') {
        setSkills(message.skills);
        setActiveSkills(message.activeSkills || []);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const refreshSkills = () => {
    setLoading(true);
    vscode.postMessage({ type: 'refreshSkills' });
  };

  const groupedSkills = {
    active: skills.filter(s => activeSkills.includes(s.id)),
    project: skills.filter(s => s.source === 'project' && !activeSkills.includes(s.id)),
    personal: skills.filter(s => s.source === 'personal' && !activeSkills.includes(s.id)),
    extension: skills.filter(s => s.source === 'extension' && !activeSkills.includes(s.id)),
  };

  return (
    <div className="skills-panel">
      <div className="skills-header">
        <h2>Agent Skills</h2>
        <VSCodeButton onClick={refreshSkills}>
          <span className="codicon codicon-refresh"></span>
        </VSCodeButton>
      </div>

      {loading ? (
        <div className="loading">Loading skills...</div>
      ) : (
        <>
          {groupedSkills.active.length > 0 && (
            <SkillGroup
              title="Active Skills"
              icon="check"
              skills={groupedSkills.active}
              active
            />
          )}

          <SkillGroup
            title="Project Skills"
            icon="folder"
            skills={groupedSkills.project}
          />

          <SkillGroup
            title="Personal Skills"
            icon="person"
            skills={groupedSkills.personal}
          />

          <SkillGroup
            title="Extension Skills"
            icon="extensions"
            skills={groupedSkills.extension}
          />
        </>
      )}

      <VSCodeDivider />

      <div className="skills-actions">
        <VSCodeButton onClick={() => vscode.postMessage({ type: 'createSkill' })}>
          Create New Skill
        </VSCodeButton>
      </div>
    </div>
  );
};

interface SkillGroupProps {
  title: string;
  icon: string;
  skills: Skill[];
  active?: boolean;
}

const SkillGroup: React.FC<SkillGroupProps> = ({ title, icon, skills, active }) => {
  const [expanded, setExpanded] = useState(active || false);

  if (skills.length === 0) return null;

  return (
    <div className={`skill-group ${active ? 'active' : ''}`}>
      <div className="skill-group-header" onClick={() => setExpanded(!expanded)}>
        <span className={`codicon codicon-chevron-${expanded ? 'down' : 'right'}`}></span>
        <span className={`codicon codicon-${icon}`}></span>
        <span className="skill-group-title">{title} ({skills.length})</span>
      </div>

      {expanded && (
        <div className="skill-group-content">
          {skills.map(skill => (
            <SkillItem key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
};

interface SkillItemProps {
  skill: Skill;
}

const SkillItem: React.FC<SkillItemProps> = ({ skill }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="skill-item">
      <div className="skill-item-header" onClick={() => setExpanded(!expanded)}>
        <div className="skill-item-title">
          <span className="skill-name">{skill.name}</span>
          {skill.version && <span className="skill-version">v{skill.version}</span>}
        </div>
      </div>

      {expanded && (
        <div className="skill-item-details">
          <p className="skill-description">{skill.description}</p>
          <div className="skill-actions">
            <VSCodeButton
              appearance="secondary"
              onClick={() => vscode.postMessage({
                type: 'viewSkillDetails',
                skillId: skill.id
              })}
            >
              View Details
            </VSCodeButton>
          </div>
        </div>
      )}
    </div>
  );
};
```

**位置**: `webview-ui/src/components/skills/SkillsStatusBar.tsx` (新文件)

```typescript
import React from 'react';

interface SkillsStatusBarProps {
  activeSkills: string[];
  onClick?: () => void;
}

export const SkillsStatusBar: React.FC<SkillsStatusBarProps> = ({
  activeSkills,
  onClick
}) => {
  if (activeSkills.length === 0) {
    return null;
  }

  return (
    <div className="skills-status-bar" onClick={onClick}>
      <span className="codicon codicon-lightbulb"></span>
      <span className="skills-count">
        {activeSkills.length} Skill{activeSkills.length > 1 ? 's' : ''} Active
      </span>
      {activeSkills.length <= 3 && (
        <span className="skills-list">
          : {activeSkills.join(', ')}
        </span>
      )}
    </div>
  );
};
```

#### 4. WebView Message Handler

**位置**: `src/core/webview/webviewMessageHandler.ts` (修改现有文件)

```typescript
// 在 webviewMessageHandler 函数中添加新的 case

case "getSkills": {
  try {
    const skillsManager = SkillsManager.getInstance(provider.context, provider.mcpHub);
    const skills = skillsManager.getAllSkills();
    const activeSkills = skillsManager.getActiveSkills().map(s => s.id);

    provider.postMessageToWebview({
      type: "skillsData",
      skills: skills.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        source: s.source,
        version: s.version,
      })),
      activeSkills
    });
  } catch (error) {
    console.error('Failed to get skills:', error);
  }
  break;
}

case "refreshSkills": {
  try {
    const skillsManager = SkillsManager.getInstance(provider.context, provider.mcpHub);
    await skillsManager.scanSkills();

    // Send updated skills data
    const skills = skillsManager.getAllSkills();
    const activeSkills = skillsManager.getActiveSkills().map(s => s.id);

    provider.postMessageToWebview({
      type: "skillsData",
      skills: skills.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        source: s.source,
        version: s.version,
      })),
      activeSkills
    });
  } catch (error) {
    console.error('Failed to refresh skills:', error);
  }
  break;
}

case "viewSkillDetails": {
  const { skillId } = message;
  try {
    const skillsManager = SkillsManager.getInstance(provider.context);
    const skill = skillsManager.getAllSkills().find(s => s.id === skillId);

    if (skill) {
      const content = await skillsManager.loadSkillContent(skillId);

      provider.postMessageToWebview({
        type: "skillDetails",
        skill: {
          ...skill,
          content
        }
      });
    }
  } catch (error) {
    console.error('Failed to load skill details:', error);
  }
  break;
}

case "createSkill": {
  // Open skill creation wizard
  vscode.commands.executeCommand('novelweave.skills.create');
  break;
}
```

#### 5. 命令注册

**位置**: `src/activate/registerCommands.ts` (修改现有文件)

```typescript
// 在 registerCommands 函数中添加新命令

export function registerCommands({
	context,
	outputChannel,
	provider,
}: {
	context: vscode.ExtensionContext
	outputChannel: vscode.OutputChannel
	provider: ClineProvider
}) {
	// ... existing commands ...

	// Skills commands
	context.subscriptions.push(
		vscode.commands.registerCommand("novelweave.skills.refresh", async () => {
			try {
				const skillsManager = SkillsManager.getInstance(context)
				await skillsManager.scanSkills()
				vscode.window.showInformationMessage("Skills refreshed successfully")
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to refresh skills: ${error.message}`)
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("novelweave.skills.create", async () => {
			// Show quick pick for skill location
			const location = await vscode.window.showQuickPick(
				[
					{ label: "Personal Skill", value: "personal" },
					{ label: "Project Skill", value: "project" },
				],
				{
					placeHolder: "Where should this skill be created?",
				},
			)

			if (!location) return

			const name = await vscode.window.showInputBox({
				prompt: "Enter skill name",
				placeHolder: "my-skill-name",
			})

			if (!name) return

			try {
				await createSkillTemplate(context, location.value as "personal" | "project", name)
				vscode.window.showInformationMessage(`Skill "${name}" created successfully`)
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to create skill: ${error.message}`)
			}
		}),
	)
}

/**
 * 创建 Skill 模板
 */
async function createSkillTemplate(
	context: vscode.ExtensionContext,
	location: "personal" | "project",
	name: string,
): Promise<void> {
	const basePath =
		location === "personal"
			? path.join(context.globalStorageUri.fsPath, "skills")
			: path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, ".agent", "skills")

	const skillPath = path.join(basePath, name)
	await fs.mkdir(skillPath, { recursive: true })

	const template = `---
name: ${name
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ")}
description: Brief description of what this skill does and when to use it
version: 1.0.0
---

# ${name
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ")}

## Instructions

Provide clear, step-by-step guidance for how to use this skill.

## Examples

Show concrete examples of using this skill.

## Best Practices

- Principle 1
- Principle 2
- Principle 3
`

	const skillFile = path.join(skillPath, "SKILL.md")
	await fs.writeFile(skillFile, template, "utf-8")

	// Open the file
	const doc = await vscode.workspace.openTextDocument(skillFile)
	await vscode.window.showTextDocument(doc)
}
```

#### 6. Extension 激活集成

**位置**: `src/extension.ts` (修改现有文件)

```typescript
// 在 activate 函数中初始化 SkillsManager

export async function activate(context: vscode.ExtensionContext) {
	// ... existing initialization ...

	// Initialize Skills Manager
	const skillsManager = SkillsManager.getInstance(context)
	await skillsManager.initialize()
	outputChannel.appendLine("Skills Manager initialized")

	// Make it available to provider
	provider.skillsManager = skillsManager

	// ... rest of activation ...
}
```

**位置**: `src/core/webview/ClineProvider.ts` (修改现有类)

```typescript
export class ClineProvider implements vscode.WebviewViewProvider {
	// ... existing properties ...

	public skillsManager?: SkillsManager // 新增属性

	// ... existing methods ...
}
```

---

## 功能需求

### FR-1: Skills 文件系统 (P0)

#### FR-1.1: SKILL.md 格式支持

**需求**：支持 SKILL.md 格式（改编自 Claude Code，适配 NovelWeave）

**YAML Frontmatter 字段**：

| 字段                  | 必需 | 类型   | 说明                                                        | NovelWeave 特有 |
| --------------------- | ---- | ------ | ----------------------------------------------------------- | --------------- |
| `name`                | ✅   | string | Skill 名称（短标识符）                                      |                 |
| `description`         | ✅   | string | **详细描述，清楚说明何时使用**（AI 根据此判断是否使用）     |                 |
| `allowed_tool_groups` | ❌   | array  | 允许的工具分组：`read`, `edit`, `browser`, `command`, `mcp` | ✅              |
| `keywords`            | ❌   | array  | 帮助 AI 理解的关键词（供参考，非机械匹配）                  | ✅              |
| `version`             | ❌   | string | 版本号（语义化版本）                                        |                 |
| `when_to_use`         | ❌   | string | 使用时机的详细说明（帮助 AI 判断）                          |                 |
| `mcp_resources`       | ❌   | array  | 关联的 MCP 资源 URI                                         | ✅              |
| `required_modes`      | ❌   | array  | 适用的 Mode 列表                                            | ✅              |

**与 Claude Code 的差异**：

- ❌ **移除**: `allowed-tools: Read, Grep` (Claude Code 格式)
- ✅ **新增**: `allowed_tool_groups: [read]` (NovelWeave 工具分组)
- ✅ **新增**: `mcp_resources`, `required_modes` (与 NovelWeave 功能集成)
- ⚠️ **重要**: `keywords` 仅供 AI 参考，**不是**机械匹配触发器

**Markdown Content**：

- 支持标准 Markdown 语法
- 可以引用支持文件（相对路径）
- 支持代码块、列表、链接等

**验证规则**：

- ✅ YAML frontmatter 必须在文件开头
- ✅ 必须包含 `name` 和 `description`
- ✅ `description` 应清楚说明何时使用此 Skill（供 AI 判断）
- ✅ `allowed_tool_groups` 必须是有效的工具分组名称
- ✅ `keywords` 如果提供，必须是字符串数组
- ✅ 文件路径使用 Unix 风格斜杠

#### FR-1.2: Skills 目录结构

**目录规范**：

```
# 1. 内置 Skills (扩展自带)
<extension-path>/dist/templates/skills/
├── genre-knowledge/
│   ├── romance/
│   │   └── SKILL.md          # 言情小说创作规范
│   ├── mystery/
│   │   └── SKILL.md          # 悬疑推理技巧
│   └── fantasy/
│       └── SKILL.md          # 奇幻世界构建
├── quality-assurance/
│   ├── consistency-checker/
│   │   └── SKILL.md          # 一致性检查
│   └── workflow-guide/
│       └── SKILL.md          # NovelWeave 工作流指导
└── writing-techniques/
    ├── dialogue-techniques/
    │   └── SKILL.md          # 对话写作技巧
    └── scene-structure/
        └── SKILL.md          # 场景结构设计

# 2. 项目 Skills (.agent/ 目录)
project-root/
└── .agent/
    └── skills/
        ├── series-continuity/     # 系列连续性管理
        │   ├── SKILL.md
        │   ├── characters.md
        │   └── timeline.md
        └── team-style-guide/      # 团队风格指南
            └── SKILL.md

# 3. 个人 Skills (globalStorage)
~/.vscode/globalStorage/novelweave.novelweave/skills/
├── my-writing-style/          # 个人写作风格
│   ├── SKILL.md
│   └── examples.md
└── my-workflow/               # 个人工作流
    └── SKILL.md
```

**扫描优先级**：

1. 内置 Skills (`src/templates/skills/`) - 扩展自带，默认可用
2. 项目 Skills (`.agent/skills/`) - 项目特定，覆盖同名内置 Skills
3. 个人 Skills (`globalStorage/skills/`) - 用户全局配置

**说明**：

- **内置 Skills 始终可用** - 用户安装 NovelWeave 后即可使用
- **项目 Skills 覆盖内置** - 团队可以定制特定项目的 Skills
- **个人 Skills 最低优先级** - 用户个人配置，不与其他冲突

#### FR-1.3: 渐进式加载

**实现策略**：

```typescript
// Stage 1: 扫描时只读 frontmatter
const skills = await scanSkills() // < 50ms for 100 skills

// Stage 2: AI 选择后加载主要内容
if (aiSelectsSkill("fantasy-writing")) {
	const content = await loadSkillContent("fantasy-writing") // < 20ms
}

// Stage 3: AI 需要时读取支持文件
if (aiRequestsFile("magic-systems.md")) {
	const file = await loadSupportFile("fantasy-writing/magic-systems.md") // < 10ms
}
```

**性能目标**：

- ✅ 扫描 100 个 Skills < 50ms
- ✅ 加载单个 Skill 内容 < 20ms
- ✅ 加载支持文件 < 10ms
- ✅ 内存占用 < 50MB

### FR-2: System Prompt 集成 (P0)

#### FR-2.1: Skills Section 生成

**需求**：在 System Prompt 中动态注入 Skills 列表

**实现位置**：`src/core/prompts/system.ts`

**生成策略**：

1. 根据当前 Mode 过滤相关 Skills
2. 排除已禁用的 Skills
3. 包含 name 和 description
4. 提供使用指南

**示例输出**：

```markdown
## Available Agent Skills

You have access to specialized knowledge through Agent Skills.

**Available Skills:**

- **Fantasy World Building**: Guide for creating consistent fantasy worlds...
- **Romance Writing**: Best practices for writing romantic scenes and character chemistry...
- **Consistency Checker**: Monitor plot consistency, character development, and timeline...

**How to Use:**

1. When relevant, announce: [USING SKILL: skill-name]
2. Follow the skill's instructions
3. You can use multiple skills when needed
```

#### FR-2.2: Skills 激活检测

**需求**：从 AI 响应中检测激活的 Skills

**实现方式**：

```typescript
// 从 AI 响应中提取
function extractActivatedSkills(response: string): string[] {
	const pattern = /\[USING SKILL:\s*([^\]]+)\]/gi
	return Array.from(response.matchAll(pattern)).map((m) => m[1].trim())
}

// 在 Task.ts 中处理
const activatedSkills = extractActivatedSkills(assistantResponse)
for (const skillName of activatedSkills) {
	await skillsManager.activateSkill(skillName)
	const content = await skillsManager.loadSkillContent(skillName)
	// 将内容添加到下一次请求的上下文中
}
```

### FR-3: Modes 系统集成 (P0)

#### FR-3.1: Per-Mode Skills 配置

**需求**：每个 Mode 可以有自己的 Skills 配置

**配置结构**：

```typescript
interface SkillsConfig {
	enabled: boolean
	autoActivate: boolean
	perModeConfig: {
		code: {
			enabledSkills: ["code-review", "refactoring-patterns"]
			autoActivate: true
		}
		architect: {
			enabledSkills: ["system-design", "architecture-patterns"]
			autoActivate: true
		}
		"novel-writing": {
			// Custom mode
			enabledSkills: ["fantasy-writing", "character-development"]
			autoActivate: true
		}
	}
}
```

#### FR-3.2: Mode 切换时更新 Skills

**实现**：

```typescript
// 在 ClineProvider 中监听 Mode 变化
private async onModeChanged(newMode: string): Promise<void> {
  const config = await this.skillsManager.getConfig();
  const modeConfig = config.perModeConfig[newMode];

  if (modeConfig && modeConfig.autoActivate) {
    // 激活该 Mode 相关的 Skills
    for (const skillId of modeConfig.enabledSkills) {
      await this.skillsManager.activateSkill(skillId);
    }
  }

  // 更新 WebView 显示
  this.postMessageToWebview({
    type: 'skillsActivated',
    skills: this.skillsManager.getActiveSkills()
  });
}
```

### FR-4: Agent Rules 协同 (P1)

#### FR-4.1: Skills 可以引用 Agent Rules

**需求**：Skills 可以自动加载和应用 `.agent-rules` 文件

**SKILL.md 示例**：

```yaml
---
name: Team Coding Standards
description: Apply team's coding standards and conventions
agent_rules: .agent-rules  # 引用 Agent Rules 文件
---

This skill applies the team's coding standards defined in `.agent-rules`.

## Additional Guidelines

Beyond the rules in `.agent-rules`, also consider:
- ...
```

**实现**：

```typescript
// 在激活 Skill 时自动加载关联的 Agent Rules
async activateSkill(skillId: string): Promise<void> {
  const skill = this.skills.get(skillId);

  if (skill && skill.agentRules) {
    const rulesPath = path.join(skill.path, skill.agentRules);
    const rulesContent = await fs.readFile(rulesPath, 'utf-8');
    // 将 Rules 添加到上下文
  }

  this.activeSkills.add(skillId);
}
```

#### FR-4.2: Skills 作为结构化 Rules

**理念**：Skills 可以看作是结构化、模块化的 Agent Rules

- Agent Rules：适合全局性、项目范围的规则
- Skills：适合特定任务、可组合的专业知识

### FR-5: MCP 资源集成 (P1)

#### FR-5.1: Skills 可以引用 MCP Resources

**SKILL.md 示例**：

```yaml
---
name: API Documentation Reference
description: Use project API documentation when working with APIs
mcp_resources:
    - "mcp://docs-server/api-reference"
    - "mcp://swagger-server/openapi-spec"
---
This skill provides access to API documentation through MCP resources.
```

**实现**：

```typescript
async activateSkill(skillId: string): Promise<void> {
  const skill = this.skills.get(skillId);

  if (skill && skill.mcpResources && this.mcpHub) {
    for (const resourceUri of skill.mcpResources) {
      try {
        const resource = await this.mcpHub.fetchResource(resourceUri);
        // MCP 资源内容会自动添加到上下文
      } catch (error) {
        console.warn(`Failed to load MCP resource: ${resourceUri}`, error);
      }
    }
  }

  this.activeSkills.add(skillId);
}
```

### FR-6: WebView UI (P1)

#### FR-6.1: Skills 管理面板

**需求**：在 WebView 侧边栏添加 Skills 管理界面

**功能**：

- ✅ 查看所有可用 Skills
- ✅ 按来源分组（Personal / Project / Extension）
- ✅ 显示激活状态
- ✅ 查看 Skill 详情
- ✅ 刷新 Skills 列表
- ✅ 创建新 Skill

**UI 设计**：参见上面的 `SkillsPanel.tsx` 组件

#### FR-6.2: Skills 状态指示器

**需求**：在对话界面显示当前激活的 Skills

**功能**：

- ✅ 显示激活的 Skills 数量
- ✅ 列出激活的 Skills 名称（不超过 3 个）
- ✅ 点击展开 Skills 面板

**UI 位置**：在消息输入框上方或对话区域顶部

### FR-7: 开发者工具 (P2)

#### FR-7.1: Skill 创建向导

**功能**：

1. 选择 Skill 位置（Personal / Project）
2. 输入 Skill 名称
3. 选择模板类型
4. 自动生成 SKILL.md
5. 打开文件进行编辑

**命令**：`novelweave.skills.create`

#### FR-7.2: Skills 调试信息

**功能**：

- ✅ 记录 Skills 扫描结果
- ✅ 显示 Skills 激活历史
- ✅ 性能统计（扫描时间、加载时间）
- ✅ 错误日志

**输出位置**：Output Channel "NovelWeave - Skills"

---

## 与现有系统集成

### 1. 与 Modes 系统集成

**集成点**：`src/shared/modes.ts` 和 `src/core/config/CustomModesManager.ts`

**策略**：

- Skills 不替代 Modes，而是增强 Modes
- 每个 Mode 可以有推荐的 Skills
- Mode 切换时自动激活相关 Skills

**示例集成**：

```typescript
// src/shared/modes.ts
export interface Mode {
	slug: string
	name: string
	roleDefinition: string
	defaultBaseInstructions: string
	icon: string
	// 新增字段
	recommendedSkills?: string[] // 推荐的 Skill IDs
}

export const modes: Mode[] = [
	{
		slug: "code",
		name: "Code",
		// ... existing fields
		recommendedSkills: ["code-review", "refactoring-patterns", "testing-best-practices"],
	},
	{
		slug: "architect",
		name: "Architect",
		// ... existing fields
		recommendedSkills: ["system-design", "architecture-patterns", "scalability"],
	},
	// ... other modes
]
```

### 2. 与 Provider Settings 集成

**集成点**：`src/core/config/ProviderSettingsManager.ts`

**策略**：

- Skills 配置独立于 Provider 配置
- 使用 VSCode globalState 和 workspaceState 存储
- 不影响现有的 Provider Settings 结构

**配置存储**：

```typescript
// Skills 配置存储在 globalState
context.globalState.update("skillsConfig", {
	enabled: true,
	autoActivate: true,
	disabledSkills: [],
	perModeConfig: {
		code: { enabledSkills: ["code-review"], autoActivate: true },
		architect: { enabledSkills: ["system-design"], autoActivate: true },
	},
})

// 项目级别配置存储在 workspaceState
context.workspaceState.update("projectSkillsConfig", {
	preferredSkills: ["series-continuity", "team-style-guide"],
})
```

### 3. 与 Agent Rules 集成

**集成点**：`src/core/prompts/sections/custom-instructions.ts`

**策略**：

- Skills 可以包含或引用 Agent Rules
- Agent Rules 适合全局规则，Skills 适合特定知识
- 两者互补，不冲突

**集成方式**：

```typescript
// Skills 可以在 frontmatter 中引用 Agent Rules
---
name: Team Standards
description: Apply team coding standards
agent_rules: ../.agent-rules
---

// 或者 Skills 内容可以包含 Agent Rules 风格的规则
# Team Standards

## Rules

1. Always use TypeScript strict mode
2. Prefer functional programming patterns
3. Write comprehensive unit tests
```

### 4. 与 MCP 服务集成

**集成点**：`src/services/mcp/McpHub.ts` 和 `McpServerManager.ts`

**策略**：

- Skills 可以声明需要的 MCP 资源
- 激活 Skill 时自动加载 MCP 资源
- MCP 资源内容添加到对话上下文

**集成示例**：

```typescript
// SkillsManager.ts
async activateSkill(skillId: string): Promise<void> {
  const skill = this.skills.get(skillId);

  if (skill && skill.mcpResources && this.mcpHub) {
    for (const resourceUri of skill.mcpResources) {
      try {
        // 获取 MCP 资源
        const resource = await this.mcpHub.fetchResource(resourceUri);

        // 资源内容会在 System Prompt 或消息中使用
        console.log(`Loaded MCP resource: ${resourceUri}`);
      } catch (error) {
        console.warn(`Failed to load MCP resource: ${resourceUri}`, error);
      }
    }
  }

  this.activeSkills.add(skillId);
}
```

### 5. 与 Custom Instructions 集成

**集成点**：`src/core/prompts/sections/custom-instructions.ts`

**策略**：

- Custom Instructions 是全局或 Mode 级别的指令
- Skills 是任务特定的、可组合的知识
- Skills 可以补充或增强 Custom Instructions

**优先级**：

1. Custom Instructions（全局）
2. Mode Custom Instructions
3. Active Skills
4. Agent Rules

### 6. 与国际化 (i18n) 集成

**集成点**：`src/i18n/` 目录

**策略**：

- UI 文本使用 i18n
- Skill 内容支持多语言（可选）
- 错误消息本地化

**i18n 文件示例**：

```json
// src/i18n/locales/en/translation.json
{
  "skills": {
    "title": "Agent Skills",
    "activeSkills": "Active Skills",
    "projectSkills": "Project Skills",
    "personalSkills": "Personal Skills",
    "extensionSkills": "Extension Skills",
    "createSkill": "Create New Skill",
    "refreshSkills": "Refresh Skills",
    "viewDetails": "View Details",
    "noSkillsFound": "No skills found",
    "errors": {
      "failedToLoad": "Failed to load skill",
      "invalidFormat": "Invalid SKILL.md format",
      "missingName": "Skill name is required"
    }
  }
}

// src/i18n/locales/zh-CN/translation.json
{
  "skills": {
    "title": "Agent Skills",
    "activeSkills": "激活的技能",
    "projectSkills": "项目技能",
    "personalSkills": "个人技能",
    "extensionSkills": "扩展技能",
    "createSkill": "创建新技能",
    "refreshSkills": "刷新技能",
    "viewDetails": "查看详情",
    "noSkillsFound": "未找到技能",
    "errors": {
      "failedToLoad": "加载技能失败",
      "invalidFormat": "SKILL.md 格式无效",
      "missingName": "技能名称为必填项"
    }
  }
}
```

---

## 学习与参考：novel-writer-skills

### 背景说明

**重要澄清**：本章节参考的是 **Claude Code Skills**（桌面应用），而非 **Claude API Skills**（云端 API）。关于三个 Skills 系统的详细对比，请参阅前面的"[Skills 系统对比分析](#skills-系统对比分析)"章节。

**`novel-writer-skills`** 是专为 **Claude Code** 设计的小说创作工具包，它提供了完整的 Agent Skills 实现，包含类型知识、质量保证、写作技巧等模块。

**为什么参考 Claude Code Skills？**

通过研究 Claude Code 的 Skills 机制（如 `novel-writer-skills` 和 `superpowers` 插件），我们发现：

1. **相同的核心机制**：
    - ✅ 本地文件存储（不上传到云端）
    - ✅ 通过提示词注入指导 AI（不执行代码）
    - ✅ SessionStart Hook / Extension 启动时加载
    - ✅ Git 友好的版本控制

2. **相似的使用场景**：
    - 📝 提供写作知识和技巧
    - 🎯 根据上下文自动激活
    - 👥 支持团队协作（Git 共享）
    - 🔧 可扩展的架构

3. **成熟的内容**：
    - `novel-writer-skills` 已经实现了丰富的小说创作 Skills
    - 包含类型知识（言情、悬疑、奇幻）
    - 包含质量保证（一致性检查、工作流指导）
    - 包含写作技巧（对话、场景结构）

**我们的改编策略**：

虽然 Claude Code 使用**插件系统**管理 Skills，但 NovelWeave 选择**内置功能**方式，因为：

- NovelWeave 本身是 VSCode 扩展，再套一层插件会增加复杂度
- 内置方式与 NovelWeave 的其他功能（Modes、Commands）保持一致
- 用户仍可通过 `.agent/skills/` 添加自定义 Skills

因此，我们**学习其结构和内容**，**将其集成到 NovelWeave 项目中作为内置 Skills**，而非直接使用或创建独立包。

### novel-writer-skills 的结构分析

#### 目录结构

```
novel-writer-skills/
├── templates/
│   ├── commands/           # Slash Commands (Claude Code)
│   ├── skills/             # Agent Skills ✅ 重点学习
│   │   ├── genre-knowledge/
│   │   │   ├── romance/
│   │   │   │   └── SKILL.md
│   │   │   ├── mystery/
│   │   │   │   └── SKILL.md
│   │   │   └── fantasy/
│   │   │       └── SKILL.md
│   │   │
│   │   ├── quality-assurance/
│   │   │   ├── consistency-checker/
│   │   │   │   └── SKILL.md
│   │   │   ├── workflow-guide/
│   │   │   │   └── SKILL.md
│   │   │   ├── requirement-detector/
│   │   │   │   ├── SKILL.md
│   │   │   │   ├── KEYWORDS.md
│   │   │   │   └── EXAMPLES.md
│   │   │   └── style-detector/
│   │   │       └── SKILL.md
│   │   │
│   │   └── writing-techniques/
│   │       ├── dialogue-techniques/
│   │       │   └── SKILL.md
│   │       └── scene-structure/
│   │           └── SKILL.md
│   │
│   ├── knowledge-base/      # 知识库模板
│   └── tracking/            # 追踪系统模板
│
└── src/                     # CLI 工具实现
```

#### SKILL.md 格式分析

**标准格式**（Claude Code 规范）：

```markdown
---
name: skill-identifier
description: "Use when user mentions X - provides Y"
allowed_tool_groups: [read] # NovelWeave 工具分组
---

# 技能标题

## 核心原则

### 子章节

- 要点 1
- 要点 2

## 实用检查清单

- [ ] 检查项 1
- [ ] 检查项 2

## 与其他功能集成

### 与 /command 集成

- 在执行命令时如何激活此 Skill
```

**关键元素**：

- **YAML frontmatter**: `name`, `description`, `allowed_tool_groups` (NovelWeave 专用)
- **触发条件**: description 中描述何时激活
- **详细内容**: Markdown 格式的指导内容
- **检查清单**: 实用的验证工具
- **集成指导**: 如何与其他功能配合

### 可复用的 Skills 内容

#### 1. 类型知识 Skills (genre-knowledge)

**Romance Skill** (`romance/SKILL.md`):

- ✅ **言情小说创作规范** - 内容质量很高，可直接参考
- ✅ **节奏指南** - 初遇、初吻、黑暗时刻时机
- ✅ **常见陷阱** - 一见钟情、误会冲突等
- ✅ **子类型考虑** - 现代、古代、超自然、悬疑言情

**Mystery Skill** (`mystery/SKILL.md`):

- ✅ **悬疑推理技巧**
- ✅ **线索布置规则**
- ✅ **红鲱鱼设计**

**Fantasy Skill** (`fantasy/SKILL.md`):

- ✅ **世界构建规范**
- ✅ **魔法系统设计**
- ✅ **奇幻惯例**

**改写策略**:

- 保留核心创作知识（普世适用）
- 移除 Claude Code 特定集成（如 `/specify`）
- 添加 NovelWeave 特定集成（如与 Novel Commands、Knowledge Base 的集成）

#### 2. 质量保证 Skills (quality-assurance)

**Consistency Checker** (`consistency-checker/SKILL.md`):

- ✅ **一致性监控系统** - 角色、世界规则、时间线
- ✅ **警报格式** - 关键、警告、注意三级
- ✅ **自动修复功能**

**Workflow Guide** (`workflow-guide/SKILL.md`):

- ⚠️ **七步方法论** - 基于 novel-writer，需要改写为 NovelWeave 工作流
- ✅ **进度追踪** - 视觉指示器和里程碑
- ✅ **不同规模项目调整** - 短篇、中篇、长篇

**Requirement Detector** (`requirement-detector/SKILL.md`):

- ✅ **读者需求检测** - anti-AI、fast-paced、sweet romance 等
- ✅ **关键词匹配系统**
- ✅ **冲突解决策略**

**Style Detector** (`style-detector/SKILL.md`):

- ✅ **写作风格检测** - 网文、文学、极简等
- ✅ **风格关键词**
- ✅ **风格冲突处理**

**改写策略**:

- **Workflow Guide**: 完全重写，适配 NovelWeave 的 Novel Commands
- **其他 Skills**: 保留核心逻辑，调整集成部分

#### 3. 写作技巧 Skills (writing-techniques)

**Dialogue Techniques** (`dialogue-techniques/SKILL.md`):

- ✅ **自然对话技巧** - 潜台词、打断、角色声音
- ✅ **对话标签技巧**
- ✅ **动作节拍**

**Scene Structure** (`scene-structure/SKILL.md`):

- ✅ **场景结构** - 目标、冲突、灾难/困境
- ✅ **续写/场景**
- ✅ **节奏控制**

**改写策略**:

- 内容几乎可以完全保留（写作技巧是普世的）
- 仅需调整"与命令集成"部分

### 集成到 NovelWeave 项目

#### 项目结构设计

```
novel/                                   # NovelWeave 项目根目录
├── src/
│   ├── templates/
│   │   └── skills/                     # 内置 Skills 目录（新增）
│   │       ├── README.md               # Skills 使用说明
│   │       │
│   │       ├── genre-knowledge/
│   │       │   ├── romance/
│   │       │   │   ├── SKILL.md        # 改写自 novel-writer-skills
│   │       │   │   └── examples.md     # NovelWeave 特定示例
│   │       │   ├── mystery/
│   │       │   │   └── SKILL.md
│   │       │   └── fantasy/
│   │       │       └── SKILL.md
│   │       │
│   │       ├── quality-assurance/
│   │       │   ├── consistency-checker/
│   │       │   │   └── SKILL.md        # 参考并改进
│   │       │   ├── novelweave-workflow/  # 🆕 完全新写
│   │       │   │   └── SKILL.md        # 基于 NovelWeave 工作流
│   │       │   ├── requirement-detector/
│   │       │   │   └── SKILL.md
│   │       │   └── style-detector/
│   │       │       └── SKILL.md
│   │       │
│   │       └── writing-techniques/
│   │           ├── dialogue-techniques/
│   │           │   └── SKILL.md        # 内容几乎完全保留
│   │           └── scene-structure/
│   │               └── SKILL.md        # 内容几乎完全保留
│   │
│   ├── services/
│   │   └── skills/                     # Skills 服务（新增）
│   │       ├── SkillsManager.ts
│   │       └── SkillsScanner.ts
│   │
│   └── esbuild.mjs                     # 需要配置打包 skills 文件
│
├── package.json                        # 无需添加额外依赖
└── README.md                           # 更新说明内置 Skills
```

**打包配置**（`src/esbuild.mjs`）:

```javascript
// 确保 skills 文件被复制到 dist 目录
const skillsPlugin = {
	name: "copy-skills",
	setup(build) {
		build.onEnd(() => {
			// 复制 src/templates/skills 到 dist/templates/skills
			fs.cpSync(path.join(__dirname, "templates/skills"), path.join(__dirname, "dist/templates/skills"), {
				recursive: true,
			})
		})
	},
}
```

#### SKILL.md 改写模板

**原始格式**（novel-writer-skills / Claude Code）:

```markdown
---
name: romance-novel-conventions
description: "Use when user mentions romance, love story, or relationship-focused narrative"
allowed-tools: Read, Grep # Claude Code 的工具系统
---

# 言情小说创作规范

## 核心要素

...

## 与 Novel-Writer 命令集成

### 当用户执行 `/specify` 时

- 提醒在故事结构中包含关系弧
```

**NovelWeave 改写版本**:

```markdown
---
name: romance-novel-conventions
description: "Use when user mentions romance, love story, or relationship-focused narrative - provides genre conventions, pacing guidelines, and emotional beats for romance writing"
keywords: [romance, love, relationship, couple, 言情, 爱情] # 🆕 帮助 AI 理解场景（供参考）
allowed_tool_groups: [read] # 🆕 NovelWeave 工具分组
when_to_use: "Writing romance novels, developing romantic subplots, or discussing relationship dynamics in fiction"
---

# 言情小说创作规范

## 核心要素

...（内容保留）

## 与 NovelWeave 集成

### 与 Novel Commands 集成

#### 在 `/constitution` 时

- 建议定义言情核心价值观（HEA vs HFN）

#### 在 `/specify` 时

- 提醒在 specification.md 中包含关系弧
- 定义初遇、主要障碍、黑暗时刻、大结局

#### 在 `/plan` 时

- 将情感节奏映射到章节结构
- 计划被迫亲密或分离的时刻

#### 在 `/write` 时

- 应用对话技巧增强浪漫张力
- 通过行动而非想法展现化学反应

### 与 Knowledge Base 集成

- 自动参考 `.novelweave/knowledge/character-profiles.md` 检查角色一致性
- 自动参考 `.novelweave/knowledge/relationships.json` 追踪关系发展

### 与 Tracking System 集成

- 使用 `relationships.json` 追踪情感节奏
- 标记关键情感节拍（初遇、初吻、黑暗时刻）
```

**关键改动**:

1. ✅ 添加 `keywords`（帮助 AI 理解场景，**非**机械匹配）
2. ✅ 将 `allowed-tools` 改为 `allowed_tool_groups`，使用 NovelWeave 工具分组
3. ✅ 移除 Claude Code 特定的命令引用（如 `/command`）
4. ✅ 添加 NovelWeave 特定集成（Novel Commands、Knowledge Base、Tracking）
5. ⚠️ **重要**：保持核心机制一致 - AI 自主判断何时使用，非关键词触发

#### NovelWeave 工具系统说明

**与 Claude Code 的差异**:

| Claude Code                 | NovelWeave                    | 说明                              |
| --------------------------- | ----------------------------- | --------------------------------- |
| `allowed-tools: Read, Grep` | `allowed_tool_groups: [read]` | NovelWeave 使用更细粒度的工具分组 |
| 3 个抽象工具组              | 6 个工具组 + 29 个具体工具    | NovelWeave 工具更丰富             |

**NovelWeave 可用工具分组**:

```yaml
# 在 SKILL.md 中配置允许的工具分组
allowed_tool_groups: [read, edit] # 允许多个分组
```

**工具分组详解**:

| 分组        | 包含工具                                                                                                         | 用途                   | 示例 Skill                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------- |
| **read**    | `read_file`, `search_files`, `list_files`, `list_code_definition_names`, `codebase_search`, `fetch_instructions` | 读取项目文件和代码结构 | consistency-checker, workflow-guide |
| **edit**    | `write_to_file`, `apply_diff`, `edit_file`, `insert_content`, `search_and_replace`, `new_rule`, `generate_image` | 修改文件内容           | （一般 Skill 不需要 edit 权限）     |
| **browser** | `browser_action`                                                                                                 | 浏览器交互             | （写作 Skill 一般不需要）           |
| **command** | `execute_command`                                                                                                | 执行命令               | （写作 Skill 一般不需要）           |
| **mcp**     | `use_mcp_tool`, `access_mcp_resource`                                                                            | 使用 MCP 外部服务      | （高级 Skill 可能需要）             |
| **modes**   | `switch_mode`, `new_task`                                                                                        | 模式切换和任务管理     | （总是可用，无需声明）              |

**始终可用工具**（无需在 `allowed_tool_groups` 中声明）:

- `ask_followup_question` - 询问用户
- `attempt_completion` - 完成任务
- `switch_mode` - 切换模式
- `new_task` - 创建新任务
- `update_todo_list` - 更新待办事项
- `run_slash_command` - 运行斜杠命令
- `report_bug` - 报告问题
- `condense` - 压缩上下文

**推荐配置**:

大部分写作 Skills 只需要 `read` 权限：

```yaml
---
name: consistency-checker
allowed_tool_groups: [read] # 只读，检查一致性
---
```

如果 Skill 需要修改文件（如自动修复）：

```yaml
---
name: auto-fix-consistency
allowed_tool_groups: [read, edit] # 读写，自动修复
---
```

**安全考虑**:

- ⚠️ **最小权限原则**: 只声明 Skill 实际需要的工具分组
- ⚠️ **避免 edit 权限**: 大部分 Skill 只需提供指导，不需要直接修改文件
- ⚠️ **避免 command 权限**: 执行命令有安全风险
- ✅ **优先使用 read**: 读取项目文件来提供上下文感知的建议

**示例：不同 Skills 的工具权限设计**

```yaml
# 1. 类型知识 Skill (只读)
---
name: romance-novel-conventions
allowed_tool_groups: [read]
---
# 2. 一致性检查 Skill (只读)
---
name: consistency-checker
allowed_tool_groups: [read]
---
# 3. 自动修复 Skill (读写)
---
name: auto-fix-typos
allowed_tool_groups: [read, edit]
---
# 4. MCP 集成 Skill (读 + MCP)
---
name: fetch-writing-resources
allowed_tool_groups: [read, mcp]
---
```

### 实施步骤

#### Step 1: 研究与提取 (1-2 天)

**任务**:

1. 完整阅读所有 novel-writer-skills 的 Skills
2. 提取可复用的内容（写作知识、技巧、检查清单）
3. 标记需要重写的部分（命令集成、工作流引导）

**输出**:

- 📄 **Skills 内容审计表** (Markdown 表格)
- 🔖 标记：直接复用 / 需改写 / 完全新写

#### Step 2: 创建目录结构 (半天)

**任务**:

1. 在 NovelWeave 项目中创建 `src/templates/skills/` 目录
2. 创建子目录结构
3. 添加 README.md 说明

**命令**:

```bash
cd /Users/coso/Documents/dev/ai/wordflowlab/novel
mkdir -p src/templates/skills/{genre-knowledge,quality-assurance,writing-techniques}
```

**目录规划**:

```bash
# 创建类型知识 Skills 目录
mkdir -p src/templates/skills/genre-knowledge/{romance,mystery,fantasy}

# 创建质量保证 Skills 目录
mkdir -p src/templates/skills/quality-assurance/{consistency-checker,novelweave-workflow,requirement-detector,style-detector}

# 创建写作技巧 Skills 目录
mkdir -p src/templates/skills/writing-techniques/{dialogue-techniques,scene-structure}
```

#### Step 3: 改写核心 Skills (3-4 天)

**优先级 P0** (必须完成):

- ✅ `genre-knowledge/romance/SKILL.md` - 最常用
- ✅ `quality-assurance/consistency-checker/SKILL.md` - 核心功能
- ✅ `quality-assurance/novelweave-workflow/SKILL.md` - 🆕 完全新写
- ✅ `writing-techniques/dialogue-techniques/SKILL.md` - 高价值

**优先级 P1** (重要):

- `genre-knowledge/mystery/SKILL.md`
- `genre-knowledge/fantasy/SKILL.md`
- `quality-assurance/requirement-detector/SKILL.md`
- `writing-techniques/scene-structure/SKILL.md`

**优先级 P2** (可选):

- `quality-assurance/style-detector/SKILL.md`

#### Step 4: 测试与验证 (1-2 天)

**测试用例**:

1. Skills 能够被 SkillsManager 从 `src/templates/skills/` 正确扫描
2. Skills 能够根据关键词自动激活
3. Skills 内容能够正确注入到 System Prompt
4. Skills 与 Novel Commands 的集成正常工作
5. VSIX 打包后 Skills 文件正确包含

**验收标准**:

```bash
# 启动扩展开发模式
cd /Users/coso/Documents/dev/ai/wordflowlab/novel
pnpm dev

# 在 VSCode Extension Host 中测试
# 1. 打开 Output Channel: "NovelWeave-Code"
# 2. 查看是否显示 "Skills Manager initialized"
# 3. 检查扫描到的 Skills 数量

# 测试 Skill 激活
# 在 NovelWeave 对话中提到"言情小说"
# → 应自动激活 romance-novel-conventions Skill
# → Output 中应显示 "Skill activated: romance-novel-conventions"

# 打包测试
pnpm build
# 检查 dist/templates/skills/ 目录是否存在
ls -la src/dist/templates/skills/
```

#### Step 5: 文档与集成 (1 天)

**文档**:

- `src/templates/skills/README.md` - Skills 使用说明和开发指南
- 更新 NovelWeave 主 README.md - 说明内置 Skills 功能
- 更新 `apps/novelweave-docs/` - 添加 Skills 使用文档

**集成到构建流程**:

1. **更新 esbuild 配置** (`src/esbuild.mjs`):

```javascript
// 添加 skills 文件复制
const copySkillsPlugin = {
	name: "copy-skills",
	setup(build) {
		build.onEnd(() => {
			const fsExtra = require("fs-extra")
			fsExtra.copySync(path.join(__dirname, "templates/skills"), path.join(__dirname, "dist/templates/skills"))
		})
	},
}
```

2. **更新 package.json**:

```json
{
	"files": [
		"dist/",
		"dist/templates/skills/" // 确保 Skills 包含在 VSIX 中
	]
}
```

3. **验证打包**:

```bash
# 构建扩展
pnpm build

# 打包 VSIX
pnpm package

# 检查 VSIX 内容
unzip -l bin/novelweave-*.vsix | grep skills
# 应显示所有 skills/ 下的文件
```

### 工作量估算

| 任务                   | 时间       | 人力       |
| ---------------------- | ---------- | ---------- |
| Step 1: 研究与提取     | 1-2 天     | 1 人       |
| Step 2: 创建包结构     | 0.5 天     | 1 人       |
| Step 3: 改写 P0 Skills | 3-4 天     | 1-2 人     |
| Step 4: 测试与验证     | 1-2 天     | 1 人       |
| Step 5: 文档与发布     | 1 天       | 1 人       |
| **总计**               | **6-9 天** | **1-2 人** |

### 维护与扩展

#### 同步 novel-writer-skills 更新

**监控策略**:

- 在 GitHub 上 Watch novel-writer-skills 仓库
- 每季度检查是否有新 Skills 或重大更新
- 选择性同步有价值的改进

#### 创建 NovelWeave 专属 Skills

**未来扩展方向**:

- **小说项目管理 Skill** - 多项目切换、进度追踪
- **多语言写作 Skill** - 中英文写作惯例差异
- **出版准备 Skill** - 格式化、敏感词检查、出版规范

---

## 实现计划

### Phase 1: 核心基础 (Week 1-2)

#### Sprint 1.1: SkillsManager 实现 (3-4 days)

**任务**：

- [ ] 创建 `SkillsManager` 类
- [ ] 实现 Skills 扫描逻辑
- [ ] 实现 SKILL.md 解析（YAML + Markdown）
- [ ] 实现渐进式加载
- [ ] 单元测试（覆盖率 > 80%）

**交付物**：

- ✅ `src/services/skills/SkillsManager.ts`
- ✅ `src/services/skills/__tests__/SkillsManager.test.ts`
- ✅ 能够扫描和解析所有 Skills

**验收标准**：

```bash
# 运行测试
pnpm test src/services/skills

# 性能测试
# - 扫描 100 个 Skills < 50ms
# - 加载单个 Skill < 20ms
```

#### Sprint 1.2: System Prompt 集成 (2-3 days)

**任务**：

- [ ] 修改 `SYSTEM_PROMPT` 函数添加 Skills 支持
- [ ] 创建 `generateSkillsSection` 函数
- [ ] 创建 `extractActivatedSkills` 函数
- [ ] 在 `Task.ts` 中处理 Skills 激活
- [ ] 单元测试

**交付物**：

- ✅ 修改 `src/core/prompts/system.ts`
- ✅ 新建 `src/core/prompts/sections/skills.ts`
- ✅ 修改 `src/core/task/Task.ts`

**验收标准**：

```typescript
// System Prompt 包含 Skills section
const prompt = await SYSTEM_PROMPT(
	context,
	cwd,
	false,
	undefined,
	undefined,
	undefined,
	"code",
	undefined,
	undefined,
	undefined,
	true,
	undefined,
	true,
	"en",
	undefined,
	true,
	undefined,
	[],
	undefined,
	undefined,
	skillsManager,
)
expect(prompt).toContain("Available Agent Skills")

// 能够检测激活的 Skills
const skills = extractActivatedSkills("[USING SKILL: fantasy-writing] ...")
expect(skills).toEqual(["fantasy-writing"])
```

#### Sprint 1.3: Extension 激活集成 (1-2 days)

**任务**：

- [ ] 在 `extension.ts` 中初始化 SkillsManager
- [ ] 在 `ClineProvider` 中添加 skillsManager 属性
- [ ] 修改 System Prompt 生成调用
- [ ] 测试端到端流程

**交付物**：

- ✅ 修改 `src/extension.ts`
- ✅ 修改 `src/core/webview/ClineProvider.ts`
- ✅ 扩展启动时自动初始化 Skills

**验收标准**：

- 扩展启动成功
- Output Channel 显示 "Skills Manager initialized"
- 能够在对话中使用 Skills

### Phase 2: UI 和交互 (Week 3-4)

#### Sprint 2.1: WebView 组件 (4-5 days)

**任务**：

- [ ] 创建 `SkillsPanel` React 组件
- [ ] 创建 `SkillsStatusBar` React 组件
- [ ] 添加 CSS 样式
- [ ] 集成到主 WebView 界面
- [ ] 组件测试

**交付物**：

- ✅ `webview-ui/src/components/skills/SkillsPanel.tsx`
- ✅ `webview-ui/src/components/skills/SkillsStatusBar.tsx`
- ✅ `webview-ui/src/components/skills/styles.css`
- ✅ 在 `App.tsx` 中集成

**验收标准**：

- UI 正确显示 Skills 列表
- 可以展开/折叠 Skill 组
- 可以查看 Skill 详情
- 响应式设计，适配不同屏幕尺寸

#### Sprint 2.2: WebView Message Handler (2-3 days)

**任务**：

- [ ] 在 `webviewMessageHandler.ts` 添加 Skills 消息处理
- [ ] 实现 `getSkills` 消息处理
- [ ] 实现 `refreshSkills` 消息处理
- [ ] 实现 `viewSkillDetails` 消息处理
- [ ] 添加类型定义

**交付物**：

- ✅ 修改 `src/core/webview/webviewMessageHandler.ts`
- ✅ 修改 `cli/src/types/messages.ts`（添加新消息类型）

**验收标准**：

```typescript
// WebView 可以获取 Skills 数据
vscode.postMessage({ type: "getSkills" })
// 收到响应：{ type: 'skillsData', skills: [...], activeSkills: [...] }

// WebView 可以刷新 Skills
vscode.postMessage({ type: "refreshSkills" })
```

#### Sprint 2.3: 命令注册 (1-2 days)

**任务**：

- [ ] 注册 `novelweave.skills.refresh` 命令
- [ ] 注册 `novelweave.skills.create` 命令
- [ ] 实现 Skill 创建模板生成
- [ ] 在 `package.json` 中添加命令定义

**交付物**：

- ✅ 修改 `src/activate/registerCommands.ts`
- ✅ 修改 `src/package.json`

**验收标准**：

- 命令面板中可以搜索到 Skills 命令
- 执行命令能够正常工作
- 创建的 Skill 文件格式正确

### Phase 3: 高级功能 (Week 5-6)

#### Sprint 3.1: Modes 集成 (2-3 days)

**任务**：

- [ ] 为 Mode 添加 `recommendedSkills` 字段
- [ ] 实现 Mode 切换时更新 Skills
- [ ] 实现 Per-Mode Skills 配置
- [ ] 测试 Mode 切换流程

**交付物**：

- ✅ 修改 `src/shared/modes.ts`
- ✅ 修改 `SkillsManager.ts` 支持 Mode 过滤

**验收标准**：

- 切换 Mode 时自动激活推荐 Skills
- UI 正确显示 Mode 相关的 Skills
- 配置可以持久化

#### Sprint 3.2: MCP 集成 (2-3 days)

**任务**：

- [ ] 支持 Skills 中的 `mcp_resources` 字段
- [ ] 激活 Skill 时自动加载 MCP 资源
- [ ] 处理 MCP 资源加载错误
- [ ] 测试 MCP 集成

**交付物**：

- ✅ 修改 `SkillsManager.ts`
- ✅ 集成测试

**验收标准**：

```yaml
# SKILL.md
mcp_resources:
    - "mcp://docs-server/api-reference"
# 激活 Skill 后，MCP 资源应该被加载
```

#### Sprint 3.3: Agent Rules 协同 (1-2 days)

**任务**：

- [ ] 支持 Skills 引用 Agent Rules
- [ ] 实现 Agent Rules 文件加载
- [ ] 测试协同工作

**交付物**：

- ✅ 修改 `SkillsManager.ts`
- ✅ 测试用例

**验收标准**：

```yaml
# SKILL.md
agent_rules: ../.agent-rules
# 激活 Skill 后，Agent Rules 应该被加载
```

### Phase 4: 优化和发布 (Week 7-8)

#### Sprint 4.1: 性能优化 (2-3 days)

**任务**：

- [ ] 优化 Skills 扫描性能
- [ ] 实现内容缓存机制
- [ ] 减少内存占用
- [ ] 性能基准测试

**性能目标**：

- ✅ 扫描 100 个 Skills < 50ms
- ✅ 加载单个 Skill < 20ms
- ✅ 内存占用 < 50MB

#### Sprint 4.2: 文档和教程 (2-3 days)

**任务**：

- [ ] 编写用户文档
- [ ] 编写开发者文档
- [ ] 创建 Skills 编写指南
- [ ] 制作视频教程

**交付物**：

- ✅ `docs/agent-skills-user-guide.md`
- ✅ `docs/agent-skills-developer-guide.md`
- ✅ `docs/writing-skills-best-practices.md`

#### Sprint 4.3: 测试和修复 (2-3 days)

**任务**：

- [ ] E2E 测试
- [ ] Bug 修复
- [ ] 用户反馈收集
- [ ] 性能调优

#### Sprint 4.4: 内置 Skills 创建 (3-4 days)

**任务**：

- [ ] 创建 `src/templates/skills/` 目录结构
- [ ] 从 `novel-writer-skills` 改写核心 Skills
- [ ] 更新构建配置（复制 skills 到 dist/）
- [ ] 验证 VSIX 打包包含 Skills

**交付物**：

- ✅ `src/templates/skills/` 目录及内容
- ✅ 至少 4 个核心 Skills（romance, consistency-checker, dialogue, workflow）
- ✅ 更新 `src/esbuild.mjs` 配置
- ✅ VSIX 包含内置 Skills

**验收标准**：

```bash
# 构建后检查
pnpm build
ls -la src/dist/templates/skills/

# 打包后检查
pnpm package
unzip -l bin/novelweave-*.vsix | grep "templates/skills"
```

#### Sprint 4.5: 发布准备 (1-2 days)

**任务**：

- [ ] 更新 CHANGELOG
- [ ] 准备发布说明
- [ ] 更新 README 说明内置 Skills
- [ ] 版本号更新

**交付物**：

- ✅ `CHANGELOG.md` 更新
- ✅ 版本 v0.13.0（包含 Agent Skills 功能）
- ✅ 更新文档说明 Skills 使用方式

### Phase 5: Skills 市场（可选，v0.14.0+）

**说明**：Skills 市场是增强功能，可在 v0.13.0 发布后作为 v0.14.0 的主要特性开发。

#### Sprint 5.1: Skills Registry 基础设施 (3-4 days)

**任务**：

- [ ] 创建 `novelweave-skills-registry` GitHub 仓库
- [ ] 设计 `registry.json` 结构
- [ ] 创建提交 Skills 的 PR 模板
- [ ] 编写验证脚本（验证 SKILL.md 格式）
- [ ] 设置 GitHub Actions 自动验证

**交付物**：

- ✅ `https://github.com/wordflowlab/novelweave-skills-registry`
- ✅ `registry.json` 初始版本（包含官方 Skills）
- ✅ `.github/workflows/validate-skill.yml`
- ✅ `scripts/validate-skill.js`
- ✅ `CONTRIBUTING.md`（如何贡献 Skill）

**验收标准**：

- 社区可以通过 PR 提交新 Skills
- 自动验证 SKILL.md 格式
- 合并后自动更新 registry.json

#### Sprint 5.2: 市场 UI 组件 (4-5 days)

**任务**：

- [ ] 创建 `SkillsMarketplace` React 组件
- [ ] 实现 Skills 浏览和搜索
- [ ] 实现 Skill 详情页面
- [ ] 实现安装/更新/卸载功能
- [ ] 添加评分和下载统计

**交付物**：

- ✅ `webview-ui/src/components/skills/SkillsMarketplace.tsx`
- ✅ `webview-ui/src/components/skills/SkillCard.tsx`
- ✅ `webview-ui/src/components/skills/SkillDetails.tsx`

**UI 功能**：

```typescript
// 市场主界面
<SkillsMarketplace>
  <SearchBar placeholder="搜索 Skills..." />
  <CategoryFilter categories={['writing', 'coding', 'quality']} />
  <SkillsGrid>
    {skills.map(skill => (
      <SkillCard
        key={skill.id}
        skill={skill}
        onInstall={() => installSkill(skill)}
        onViewDetails={() => showDetails(skill)}
      />
    ))}
  </SkillsGrid>
</SkillsMarketplace>

// Skill 详情
<SkillDetails skill={skill}>
  <SkillHeader name={skill.name} author={skill.author} rating={skill.rating} />
  <SkillDescription description={skill.description} />
  <SkillExamples examples={skill.examples} />
  <SkillReviews reviews={skill.reviews} />
  <InstallButton onClick={() => installSkill(skill)} />
</SkillDetails>
```

#### Sprint 5.3: SkillsMarketManager 实现 (3-4 days)

**任务**：

- [ ] 创建 `SkillsMarketManager` 类
- [ ] 实现 registry.json 获取和缓存
- [ ] 实现 Skill 安装（git clone）
- [ ] 实现 Skill 更新（git pull）
- [ ] 实现 Skill 卸载
- [ ] 集成到 SkillsManager

**交付物**：

- ✅ `src/services/skills/SkillsMarketManager.ts`

**核心功能**：

```typescript
export class SkillsMarketManager {
	// 获取市场 Skills 列表
	async fetchMarketSkills(): Promise<MarketSkill[]> {
		const response = await fetch(REGISTRY_URL)
		const registry = await response.json()
		return registry.skills
	}

	// 安装 Skill
	async installSkill(skillId: string, location: "project" | "personal"): Promise<void> {
		const skill = await this.findSkill(skillId)
		const targetPath = this.getSkillPath(location, skillId)

		// Git clone
		await execAsync(`git clone ${skill.repository} ${targetPath}`)

		// 刷新 Skills
		await this.skillsManager.scanSkills()
	}

	// 更新 Skill
	async updateSkill(skillId: string): Promise<void> {
		const skillPath = this.getInstalledSkillPath(skillId)
		await execAsync(`git -C ${skillPath} pull`)
		await this.skillsManager.scanSkills()
	}

	// 卸载 Skill
	async uninstallSkill(skillId: string): Promise<void> {
		const skillPath = this.getInstalledSkillPath(skillId)
		await fs.rm(skillPath, { recursive: true })
		await this.skillsManager.scanSkills()
	}

	// 检查更新
	async checkUpdates(): Promise<SkillUpdate[]> {
		const installed = this.skillsManager.getAllSkills()
		const market = await this.fetchMarketSkills()

		return installed
			.filter((s) => s.source !== "extension")
			.map((s) => {
				const marketSkill = market.find((m) => m.id === s.id)
				if (marketSkill && marketSkill.version > s.version) {
					return { skillId: s.id, currentVersion: s.version, latestVersion: marketSkill.version }
				}
			})
			.filter(Boolean)
	}
}
```

#### Sprint 5.4: WebView 消息处理 (2-3 days)

**任务**：

- [ ] 添加市场相关消息类型
- [ ] 实现消息处理逻辑
- [ ] 添加进度通知
- [ ] 错误处理

**新增消息类型**：

```typescript
// 消息类型
type SkillsMarketMessage =
	| { type: "getMarketSkills" }
	| { type: "installSkill"; skillId: string; location: "project" | "personal" }
	| { type: "updateSkill"; skillId: string }
	| { type: "uninstallSkill"; skillId: string }
	| { type: "checkSkillUpdates" }

// 响应类型
type SkillsMarketResponse =
	| { type: "marketSkillsData"; skills: MarketSkill[] }
	| { type: "skillInstalled"; skillId: string }
	| { type: "skillUpdated"; skillId: string }
	| { type: "skillUninstalled"; skillId: string }
	| { type: "skillUpdatesAvailable"; updates: SkillUpdate[] }
	| { type: "skillOperationError"; error: string }
```

#### Sprint 5.5: 测试和发布 (2-3 days)

**任务**：

- [ ] E2E 测试市场功能
- [ ] 性能测试（大量 Skills）
- [ ] 安全审计（Git clone 安全性）
- [ ] 文档更新
- [ ] Beta 测试

**交付物**：

- ✅ 市场功能完整测试
- ✅ 版本 v0.14.0（Skills 市场功能）
- ✅ 市场使用文档

**验收标准**：

- 用户可以浏览市场 Skills
- 用户可以一键安装 Skills
- 用户可以检查和更新已安装的 Skills
- 社区可以通过 PR 贡献 Skills

---

## 测试策略

### 1. 单元测试

**工具**：Vitest

**测试覆盖率目标**：> 80%

**关键测试文件**：

```typescript
// src/services/skills/__tests__/SkillsManager.test.ts
describe("SkillsManager", () => {
	describe("scanSkills", () => {
		test("should scan skills from all sources", async () => {
			const manager = new SkillsManager(mockContext)
			await manager.scanSkills()

			const skills = manager.getAllSkills()
			expect(skills.length).toBeGreaterThan(0)
		})

		test("should respect scan priority", async () => {
			// Project skills should override personal skills with same name
		})
	})

	describe("parseSkillFile", () => {
		test("should parse valid SKILL.md", async () => {
			const skill = await manager.parseSkillFile("test-skill/SKILL.md")

			expect(skill.name).toBe("Test Skill")
			expect(skill.description).toBeDefined()
		})

		test("should throw on invalid SKILL.md", async () => {
			await expect(manager.parseSkillFile("invalid-skill/SKILL.md")).rejects.toThrow("Invalid SKILL.md")
		})

		test("should parse allowed-tools correctly", async () => {
			// Test comma-separated string
			// Test array format
		})
	})

	describe("loadSkillContent", () => {
		test("should load content on demand", async () => {
			const content = await manager.loadSkillContent("skill-id")
			expect(content).toContain("# Skill Name")
		})

		test("should cache loaded content", async () => {
			// First load
			await manager.loadSkillContent("skill-id")

			// Second load should use cache
			const start = performance.now()
			await manager.loadSkillContent("skill-id")
			const duration = performance.now() - start

			expect(duration).toBeLessThan(1) // Should be < 1ms (cached)
		})
	})

	describe("activateSkill", () => {
		test("should activate skill", async () => {
			await manager.activateSkill("skill-id")

			const activeSkills = manager.getActiveSkills()
			expect(activeSkills.some((s) => s.id === "skill-id")).toBe(true)
		})

		test("should load MCP resources when activating", async () => {
			const mcpHub = createMockMcpHub()
			const manager = new SkillsManager(mockContext, mcpHub)

			await manager.activateSkill("skill-with-mcp")

			expect(mcpHub.fetchResource).toHaveBeenCalledWith("mcp://test/resource")
		})
	})
})

// src/core/prompts/sections/__tests__/skills.test.ts
describe("generateSkillsSection", () => {
	test("should generate section with skills", async () => {
		const section = await generateSkillsSection(skillsManager, "code")

		expect(section).toContain("Available Agent Skills")
		expect(section).toContain("fantasy-writing")
	})

	test("should return empty string when no skills", async () => {
		const section = await generateSkillsSection(emptySkillsManager, "code")
		expect(section).toBe("")
	})

	test("should filter by mode", async () => {
		const section = await generateSkillsSection(skillsManager, "code")

		// Should only include code-related skills
		expect(section).toContain("code-review")
		expect(section).not.toContain("romance-writing")
	})
})

describe("extractActivatedSkills", () => {
	test("should extract single skill", () => {
		const text = "[USING SKILL: fantasy-writing] ..."
		const skills = extractActivatedSkills(text)

		expect(skills).toEqual(["fantasy-writing"])
	})

	test("should extract multiple skills", () => {
		const text = `
      [USING SKILL: fantasy-writing]
      ...
      [USING SKILL: consistency-checker]
    `
		const skills = extractActivatedSkills(text)

		expect(skills).toEqual(["fantasy-writing", "consistency-checker"])
	})

	test("should handle no skills", () => {
		const text = "Normal text without skills"
		const skills = extractActivatedSkills(text)

		expect(skills).toEqual([])
	})
})
```

### 2. 集成测试

```typescript
// src/__tests__/integration/skills-integration.test.ts
describe("Skills Integration", () => {
	test("full workflow: scan -> activate -> use", async () => {
		// 1. Initialize
		const manager = SkillsManager.getInstance(context)
		await manager.initialize()

		// 2. Verify skills loaded
		const skills = manager.getAllSkills()
		expect(skills.length).toBeGreaterThan(0)

		// 3. Generate system prompt
		const prompt = await SYSTEM_PROMPT(
			context,
			cwd,
			false,
			undefined,
			undefined,
			undefined,
			"code",
			undefined,
			undefined,
			undefined,
			true,
			undefined,
			true,
			"en",
			undefined,
			true,
			undefined,
			[],
			undefined,
			undefined,
			manager,
		)

		expect(prompt).toContain("Available Agent Skills")

		// 4. Simulate AI response with skill activation
		const aiResponse = "[USING SKILL: code-review] Let me review your code..."
		const activatedSkills = extractActivatedSkills(aiResponse)

		// 5. Activate skill
		for (const skillName of activatedSkills) {
			await manager.activateSkill(skillName)
		}

		// 6. Verify skill is active
		const activeSkills = manager.getActiveSkills()
		expect(activeSkills.some((s) => s.name === "code-review")).toBe(true)
	})

	test("mode change updates active skills", async () => {
		// 切换到 'code' mode
		await clineProvider.changeMode("code")

		// 验证激活了 code 相关的 skills
		const activeSkills = manager.getActiveSkills()
		expect(activeSkills.some((s) => s.id === "code-review")).toBe(true)

		// 切换到 'architect' mode
		await clineProvider.changeMode("architect")

		// 验证激活了 architect 相关的 skills
		const activeSkills2 = manager.getActiveSkills()
		expect(activeSkills2.some((s) => s.id === "system-design")).toBe(true)
	})
})
```

### 3. E2E 测试

**工具**：Playwright (已有的 `apps/playwright-e2e`)

```typescript
// apps/playwright-e2e/tests/skills.test.ts
test.describe("Agent Skills", () => {
	test("should display skills panel", async ({ page }) => {
		// Open skills panel
		await page.click('[data-testid="skills-button"]')

		// Verify panel is visible
		await expect(page.locator(".skills-panel")).toBeVisible()

		// Verify skills are listed
		const skills = page.locator(".skill-item")
		await expect(skills).toHaveCountGreaterThan(0)
	})

	test("should create new skill", async ({ page }) => {
		// Click create skill button
		await page.click('[data-testid="create-skill-button"]')

		// Fill in skill name
		await page.fill('input[name="skill-name"]', "test-skill")

		// Select location
		await page.selectOption('select[name="location"]', "personal")

		// Submit
		await page.click('[data-testid="create-button"]')

		// Verify skill was created
		await expect(page.locator("text=test-skill")).toBeVisible()
	})

	test("should activate skill during conversation", async ({ page }) => {
		// Start a conversation that triggers a skill
		await page.fill('[data-testid="chat-input"]', "Review my TypeScript code")
		await page.click('[data-testid="send-button"]')

		// Wait for AI response
		await page.waitForSelector('[data-testid="ai-message"]')

		// Verify skill was activated
		const statusBar = page.locator(".skills-status-bar")
		await expect(statusBar).toContainText("1 Skill Active")
		await expect(statusBar).toContainText("code-review")
	})
})
```

### 4. 性能测试

```typescript
// src/__tests__/performance/skills-performance.test.ts
describe("Skills Performance", () => {
	test("scan 100 skills < 50ms", async () => {
		// Create 100 test skills
		await createTestSkills(100)

		const start = performance.now()
		await manager.scanSkills()
		const duration = performance.now() - start

		expect(duration).toBeLessThan(50)
	})

	test("load single skill content < 20ms", async () => {
		const start = performance.now()
		await manager.loadSkillContent("test-skill")
		const duration = performance.now() - start

		expect(duration).toBeLessThan(20)
	})

	test("memory usage < 50MB", async () => {
		const initialMemory = process.memoryUsage().heapUsed

		// Load 100 skills
		await manager.scanSkills()
		for (let i = 0; i < 100; i++) {
			await manager.loadSkillContent(`skill-${i}`)
		}

		const finalMemory = process.memoryUsage().heapUsed
		const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024 // MB

		expect(memoryIncrease).toBeLessThan(50)
	})
})
```

---

## 风险评估

### 技术风险

| 风险                 | 影响 | 概率 | 缓解措施                        | 负责人   |
| -------------------- | ---- | ---- | ------------------------------- | -------- |
| **性能问题**         | 高   | 中   | 渐进式加载、缓存、性能监控      | 核心团队 |
| **Skills 格式兼容**  | 中   | 低   | 严格遵循 Claude Code 规范，测试 | 核心团队 |
| **WebView 通信延迟** | 中   | 低   | 批量消息、状态管理优化          | 前端团队 |
| **MCP 集成复杂度**   | 中   | 中   | 分阶段实现，先基础后高级        | 核心团队 |
| **内存泄漏**         | 高   | 低   | 定期清理缓存，内存监控          | 核心团队 |

### 产品风险

| 风险                   | 影响 | 概率 | 缓解措施                     | 负责人   |
| ---------------------- | ---- | ---- | ---------------------------- | -------- |
| **用户学习曲线**       | 中   | 高   | 详细文档、教程、默认 Skills  | 产品团队 |
| **Skills 质量参差**    | 中   | 高   | 官方审核、社区评分、最佳实践 | 社区团队 |
| **与现有功能冲突**     | 高   | 中   | 充分测试、清晰的功能边界     | 核心团队 |
| **社区采用缓慢**       | 中   | 中   | 激励机制、展示优秀 Skills    | 市场团队 |
| **扩展性不如插件系统** | 中   | 低   | 三层架构 + 未来扩展市场支持  | 架构团队 |

### 依赖风险

| 依赖            | 风险     | 影响 | 缓解措施             |
| --------------- | -------- | ---- | -------------------- |
| **gray-matter** | 维护问题 | 低   | 已有依赖，成熟稳定   |
| **VSCode API**  | 版本变更 | 中   | 关注更新，及时适配   |
| **MCP 协议**    | 规范变更 | 中   | 抽象层隔离，版本兼容 |

---

## 附录

### A. SKILL.md 完整示例

#### 示例 1：简单 Skill

```yaml
---
name: TypeScript Best Practices
description: Guide for writing clean, maintainable TypeScript code. Use when working with TypeScript projects, reviewing code, or refactoring.
version: 1.0.0
---

# TypeScript Best Practices

## Key Principles

1. **Use strict type checking**
   - Enable `strict: true` in tsconfig.json
   - Avoid `any` type unless absolutely necessary
   - Use type guards for runtime safety

2. **Prefer interfaces over types**
   - Use `interface` for object shapes
   - Use `type` for unions, intersections, and complex types

3. **Leverage utility types**
   - `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`
   - `Record<K, T>`, `Exclude<T, U>`, `Extract<T, U>`

## Examples

### Good

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User | null {
  // Implementation
}
\`\`\`

### Bad

\`\`\`typescript
function getUser(id: any): any {
  // Implementation
}
\`\`\`

## Common Pitfalls

- Over-using `as` type assertions
- Ignoring `null` and `undefined` checks
- Not using `readonly` for immutable data
```

#### 示例 2：多文件 Skill

```yaml
---
name: Fantasy World Building
description: Comprehensive guide for creating consistent and engaging fantasy worlds. Use when discussing magic systems, world geography, cultures, or fantasy novel planning.
version: 2.0.1
allowed_tool_groups: [read]  # NovelWeave 工具分组
keywords: [fantasy, magic, world-building, 奇幻, 魔法, 世界构建]  # 帮助 AI 理解
when_to_use: "Designing fantasy worlds, creating magic systems, or developing fantasy novel settings"
required_modes: ["code", "architect"]
---

# Fantasy World Building

## Quick Start

Start with the magic system - it should have:
- Clear rules and limitations
- Costs and consequences
- Internal consistency

For detailed guidelines, see:
- [Magic Systems](magic-systems.md)
- [Geography Design](geography.md)
- [Cultural Development](cultures.md)

## Templates

Use our templates to get started:
- [World Bible Template](templates/world-bible.md)
- [Magic System Template](templates/magic-system.md)
- [Culture Template](templates/culture.md)

## Validation Checklist

Run the validation script to check consistency:

\`\`\`bash
python scripts/validate-world.py world-bible.md
\`\`\`

## Version History

- v2.0.1 (2025-10-19): Added validation script
- v2.0.0 (2025-09-15): Major update with templates
- v1.0.0 (2025-08-01): Initial release
```

**目录结构**：

```
fantasy-world-building/
├── SKILL.md
├── magic-systems.md
├── geography.md
├── cultures.md
├── templates/
│   ├── world-bible.md
│   ├── magic-system.md
│   └── culture.md
└── scripts/
    └── validate-world.py
```

#### 示例 3：与 MCP 集成的 Skill

```yaml
---
name: API Documentation Assistant
description: Helps work with API documentation from MCP servers. Use when implementing APIs, reviewing endpoints, or debugging API calls.
mcp_resources:
  - 'mcp://docs-server/api/reference'
  - 'mcp://swagger-server/openapi/spec'
---

# API Documentation Assistant

This skill provides access to API documentation through MCP resources.

When I activate this skill, the following resources are automatically loaded:
- API Reference Documentation
- OpenAPI/Swagger Specification

## How to Use

1. Ask me about API endpoints
2. Request examples of API calls
3. Get information about request/response formats
4. Understand authentication requirements

## Example Queries

- "What are the available user endpoints?"
- "Show me an example of creating a new user"
- "What authentication method does the API use?"
- "What's the rate limit for API calls?"
```

### B. 术语表

| 术语                       | 定义                                                      |
| -------------------------- | --------------------------------------------------------- |
| **Agent Skills**           | AI 自动发现和使用的模块化知识包                           |
| **SKILL.md**               | Skills 的定义文件，包含 YAML frontmatter 和 Markdown 内容 |
| **Model-Invoked**          | 由 AI 模型自主决定何时使用，非用户手动触发                |
| **Progressive Disclosure** | 渐进式披露，按需加载内容以优化性能                        |
| **allowed-tools**          | Skill 可使用的工具权限列表                                |
| **Personal Skills**        | 存储在用户全局目录的个人 Skills                           |
| **Project Skills**         | 存储在项目 .agent/ 目录的团队共享 Skills                  |
| **Extension Skills**       | 来自 npm 包或扩展的预置 Skills                            |

### C. 参考资料

- [Claude Code Skills 官方文档](https://docs.claude.com/zh-CN/docs/claude-code/skills)
- [NovelWeave GitHub Repository](https://github.com/wordflowlab/novelweave)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [gray-matter (YAML parser)](https://github.com/jonschlinkert/gray-matter)

### D. FAQ

**Q: Skills 与 Slash Commands 有什么区别？**

A:

- **Skills** 是 AI 自动发现和使用的（Model-Invoked）
- **Slash Commands** 是用户明确输入的（User-Invoked）
- Skills 更智能，AI 根据上下文决定何时使用
- Slash Commands 更明确，用户精确控制执行

**Q: Skills 与 Agent Rules 有什么区别？**

A:

- **Agent Rules**：全局性、项目范围的规则，静态文本
- **Skills**：特定任务的、可组合的知识，结构化格式
- Skills 可以包含或引用 Agent Rules
- 两者互补，不冲突

**Q: Skills 与 Custom Modes 有什么区别？**

A:

- **Custom Modes**：定义 AI 的角色和基础指令，需手动切换
- **Skills**：提供特定领域的知识，自动激活
- Skills 可以增强 Modes，为每个 Mode 提供专业知识

**Q: 性能如何？会影响扩展启动速度吗？**

A:

- 启动时只扫描 Skills 的 frontmatter（< 50ms for 100 skills）
- 完整内容按需加载
- 使用缓存机制
- 内存占用 < 50MB

**Q: 如何与团队共享 Skills？**

A:

1. 将 Skills 放在 `.agent/skills/` 目录
2. 提交到 git
3. 团队成员 pull 后自动获得
4. NovelWeave 自动扫描和加载

**Q: 为什么 NovelWeave 不采用插件系统？**

A:

- **架构考虑**：NovelWeave 本身是 VSCode 扩展（插件），再套一层插件系统会增加复杂度
- **一致性**：NovelWeave 的 Modes、Commands 等功能都是内置的，保持架构一致
- **用户体验**：内置 Skills 开箱即用，无需额外安装
- **灵活性不减**：通过三层架构（内置/项目/个人）+ 未来扩展市场仍保持足够灵活性
- **维护简化**：统一版本管理，减少兼容性问题

详见"与 Claude Code 的对比"章节的"设计权衡分析"。

**Q: 可以使用 Claude Code 社区的 Skills 吗？**

A:

- ✅ 完全兼容 Claude Code 的 SKILL.md 格式
- ✅ 可以直接复制使用社区 Skills
- ✅ 支持 `allowed-tools` 等所有官方字段
- ✅ 额外支持 NovelWeave 特有字段（`mcp_resources`, `required_modes`, `keywords`, `auto_activate` 等）
- 📂 将 Skills 放入 `.agent/skills/` 或 `globalStorage/skills/` 即可使用

**Q: 支持哪些 AI 模型？**

A:

- 所有 NovelWeave 支持的 AI 提供商
- OpenAI (GPT-4, GPT-4o, GPT-4-turbo)
- Anthropic (Claude 3.5 Sonnet, Opus)
- Google (Gemini Pro, Ultra)
- 以及其他 400+ 模型
- 通过 System Prompt 注入，与模型无关

**Q: Skills 市场如何工作？**

A:

- 📦 **社区驱动**：类似 MCP 市场，基于 GitHub registry
- 🔍 **浏览发现**：在 WebView UI 中浏览和搜索社区 Skills
- ⚡ **一键安装**：点击按钮即可安装（通过 git clone）
- 🔄 **自动更新**：检查并更新已安装的 Skills（通过 git pull）
- ⭐ **社区贡献**：通过 PR 提交新 Skills 到 registry 仓库
- 🛡️ **安全简单**：Skills 只是文本文件，不执行代码，无需审核

**Q: 如何向市场贡献 Skills？**

A:

1. 创建 Skill 并在本地测试
2. 将 Skill 推送到 GitHub 公开仓库
3. Fork `novelweave-skills-registry` 仓库
4. 在 `registry.json` 中添加你的 Skill 条目
5. 提交 PR，GitHub Actions 自动验证格式
6. 合并后立即在市场中可用

**Q: Skills 市场何时发布？**

A:

- **v0.13.0**（计划）：核心 Skills 功能，内置 Skills
- **v0.14.0**（计划）：Skills 市场功能
- 市场是可选增强功能，不影响核心功能使用

---

## 更新日志

### v2.2.0 (2025-10-19 - 当前版本)

**重大修正** - 感谢用户指出设计问题：

- 🔴 **修正核心错误**：移除关键词自动匹配机制
- ✅ **正确设计**：**AI 根据上下文自主判断**何时使用 Skills（与 Claude Code 一致）
- ✅ 删除 `auto_activate` 字段（不需要机械触发）
- ✅ 重新定义 `keywords` 字段用途：
    - ❌ 不是用于机械匹配
    - ✅ 帮助 AI 理解 Skill 的适用场景
    - ✅ 用于 UI 搜索和市场分类
- ✅ 添加详细对比表格：关键词匹配 vs AI 自主判断
- ✅ 更新所有示例和接口定义

**为什么这个修正很重要**：

- 🎯 **符合 "Agent Skills" 的定义** - Model-Invoked，非 Rule-Based
- 🧠 **发挥 AI 智能** - 语义理解而非关键词匹配
- 🔗 **与 Claude Code 保持一致** - 学习成熟的设计模式
- 💡 **更好的用户体验** - 自然、智能的 Skills 激活

### v2.1.0 (2025-10-19)

**新增功能**：

- ✅ **Skills 市场设计**：借鉴 MCP 市场，提供社区驱动的 Skills 分发机制
- ✅ **扩展性分析**：详细对比插件系统 vs 市场机制，证明设计合理性
- ✅ **实现计划**：添加 Phase 5（v0.14.0）的 Skills 市场开发计划
- ✅ **完整工作流**：从浏览、安装、更新到贡献的完整用户体验设计

**设计优化**：

- ✅ 更新对比表格，明确 Skills 市场优势
- ✅ 添加设计权衡分析，包含安全性考虑
- ✅ 补充社区贡献流程和 registry 架构
- ✅ FAQ 新增 Skills 市场相关问题

**关键洞察**：

- 💡 Skills 市场比插件系统更安全（只是文本文件）
- 💡 通过 GitHub registry 实现轻量级社区分发
- 💡 一键安装体验与插件市场无异
- 💡 自动验证和更新机制保证质量

### v2.0.0 (2025-10-19)

**重大变更**：

- ✅ 基于 NovelWeave 实际架构重写整个 PRD
- ✅ 移除不适用的 AIModelAdapter 设计
- ✅ 采用 System Prompt 注入方式
- ✅ WebView UI 使用 React 组件
- ✅ 遵循项目目录规范（.agent/ 而非 .novelweave/）
- ✅ 深度集成 Modes、MCP、Agent Rules
- ✅ 完整的实现计划和测试策略

**主要改进**：

- 与现有系统完全兼容
- 清晰的集成方案
- 详细的代码示例
- 完整的技术架构设计

### v1.0.0 (2025-10-19)

- ❌ 初始版本（已废弃）
- ❌ 架构设计与项目实际不符
- ❌ 需要大幅修改

---

**文档结束**

_本 PRD 基于 NovelWeave v0.12.0 实际代码架构编写_  
_如有疑问，请联系: WordFlow Lab Team_
