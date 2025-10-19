# Agent Skills 用户指南

## 概述

Agent Skills 是 NovelWeave 的强大功能，允许 AI 助手自动激活和使用专业知识模块。通过 Skills，您可以：

- 📚 为 AI 提供专业的写作技巧和规范
- 🎯 让 AI 根据任务自动选择合适的知识
- 🔄 在团队中共享和复用最佳实践
- ⚡ 提高写作质量和一致性

## 快速开始

### 1. 打开 Skills 面板

在 NovelWeave 中，点击侧边栏的 **Skills** 按钮，或使用快捷键打开 Skills 标签页。

### 2. 浏览可用 Skills

Skills 按来源分为四类：

- **Active Skills** (活动中) - 当前 AI 正在使用的 Skills
- **Extension Skills** (内置) - NovelWeave 提供的官方 Skills
- **Project Skills** (项目) - 当前项目的 Skills (`.agent/skills/`)
- **Personal Skills** (个人) - 您的个人 Skills 库

### 3. 查看 Skill 详情

点击任意 Skill 卡片可以展开查看：

- 📝 描述和用途
- 🔑 关键词
- 📦 版本信息
- 🎯 适用场景
- 📁 支持文件

点击 **View Full Content** 按钮可以在编辑器中查看完整内容。

### 4. 创建新 Skill

1. 点击 **Create New Skill** 按钮
2. 选择 Skill 类型：
    - **Personal** - 保存在您的个人目录
    - **Project** - 保存在当前项目的 `.agent/skills/`
3. 输入 Skill 名称 (使用 kebab-case，如 `romance-writing`)
4. 编辑生成的 SKILL.md 文件

## 使用方式

### AI 自动激活

当您与 AI 对话时，AI 会自动：

1. 查看所有可用的 Skills
2. 根据您的问题选择相关的 Skills
3. 在回复中声明使用的 Skill: `[USING SKILL: skill-name]`
4. 应用 Skill 中的知识和规范

**示例对话**：

```
用户: 帮我写一段言情小说的对话场景

AI: [USING SKILL: romance-writing]
[USING SKILL: dialogue-techniques]

根据言情小说创作规范，我来为您创作这段对话...
```

### 手动指定 Skill

您也可以在问题中明确要求使用某个 Skill：

```
用户: 使用 consistency-checker skill 检查我的小说一致性
```

## Skill 结构

每个 Skill 是一个 Markdown 文件 (`SKILL.md`)，包含：

### 1. YAML Frontmatter (元数据)

```yaml
---
name: romance-writing
description: 言情小说创作规范和技巧
version: 1.0.0
keywords:
    - romance
    - writing
    - guidelines
whenToUse: 创作言情小说、分析感情线、设计角色关系时使用
requiredModes:
    - novelist
---
```

### 2. Markdown 内容 (知识)

```markdown
# 言情小说创作规范

## 核心要素

1. **情感张力** - 制造冲突和误会
2. **角色成长** - 双方在关系中成长
3. **感情线节奏** - 循序渐进，有起伏

## 对话技巧

- 使用潜台词表达情感
- 避免直白的告白
- 通过动作和神态描写情绪

...
```

## 高级功能

### 按 Mode 过滤 Skills

某些 Skills 只在特定 Mode 下可用。在 Skill 的 frontmatter 中设置：

```yaml
requiredModes:
    - novelist
    - editor
```

这样，只有在 Novelist 或 Editor Mode 下，AI 才能看到和使用这个 Skill。

### 支持文件

Skill 可以包含支持文件（示例、模板等）：

```
.agent/skills/romance-writing/
├── SKILL.md
├── examples/
│   ├── dialogue-example.md
│   └── scene-template.md
└── assets/
    └── character-worksheet.md
```

在 SKILL.md 中引用支持文件：

```markdown
参考示例：[对话示例](./examples/dialogue-example.md)
```

### MCP 资源集成 (实验性)

Skills 可以声明需要的 MCP 资源：

```yaml
mcpResources:
    - writing-database://romance-tropes
    - reference://character-archetypes
```

当 Skill 被激活时，相关的 MCP 资源会自动加载。

## 团队协作

### 共享项目 Skills

1. 在项目根目录创建 `.agent/skills/` 目录
2. 添加 SKILL.md 文件
3. 提交到 Git 仓库

团队成员拉取代码后，Skills 会自动出现在他们的 Skills 列表中。

### 版本控制

使用 Git 管理 Skills 的版本：

```yaml
version: 1.2.0 # 遵循语义化版本
```

当 Skill 更新时，更新版本号并记录变更。

## 最佳实践

### 1. 清晰的命名

- 使用 kebab-case: `romance-writing`, `consistency-checker`
- 名称要描述性强，一目了然

### 2. 详细的描述

在 `description` 和 `whenToUse` 字段中清楚说明：

- Skill 的用途
- 适用场景
- 使用时机

### 3. 合理的关键词

添加相关的关键词，帮助 AI 更好地匹配：

```yaml
keywords:
    - romance
    - love story
    - relationship
    - emotional arc
```

### 4. 结构化内容

使用标题、列表、示例组织 Skill 内容：

```markdown
# 主题

## 子主题

### 要点

- 第一点
- 第二点

**示例**：
...
```

### 5. 保持更新

定期审查和更新 Skills：

- 修正错误
- 添加新发现
- 改进说明

## 故障排除

### Skills 没有出现

1. 检查文件位置：
    - Project Skills: `.agent/skills/`
    - Personal Skills: `~/.novelweave/skills/`

2. 验证文件名：必须是 `SKILL.md`

3. 检查 YAML frontmatter 格式：

    ```yaml
    ---
    name: skill-name
    description: Skill description
    ---
    ```

4. 刷新 Skills 列表：点击刷新按钮

### AI 没有使用 Skill

1. 确认 Skill 的 `whenToUse` 描述清晰
2. 在问题中明确提到相关关键词
3. 检查 `requiredModes` 是否与当前 Mode 匹配

### Skill 内容未加载

1. 检查文件编码：应为 UTF-8
2. 验证 Markdown 格式是否正确
3. 查看 NovelWeave 输出面板的错误信息

## 示例 Skills

### 言情小说规范

```markdown
---
name: romance-writing
description: 言情小说创作规范和技巧
version: 1.0.0
keywords: [romance, love, relationship]
whenToUse: 创作言情小说、设计感情线时使用
---

# 言情小说创作规范

## 情感发展阶段

1. **初遇** - 制造深刻印象
2. **了解** - 发现共同点
3. **冲突** - 误会和障碍
4. **和解** - 理解和接纳
5. **升华** - 情感的深化

## 对话技巧

- 用潜台词表达真实情感
- 通过动作配合对话
- 避免过于直白的表白

...
```

### 一致性检查

```markdown
---
name: consistency-checker
description: 检查小说中的逻辑一致性和细节
version: 1.0.0
keywords: [consistency, logic, continuity]
whenToUse: 审查小说、检查情节漏洞时使用
---

# 一致性检查清单

## 角色一致性

- [ ] 性格前后是否统一
- [ ] 能力设定是否矛盾
- [ ] 外貌描写是否一致

## 时间线一致性

- [ ] 事件顺序是否合理
- [ ] 时间跨度是否准确
- [ ] 季节描写是否匹配

...
```

## 进阶阅读

- [开发者文档](./agent-skills-developer-guide.md) - 了解 Skills 的技术实现
- [Skills 编写最佳实践](./writing-skills-best-practices.md) - 深入的编写指南
- [Skills 市场](https://github.com/wordflowlab/novelweave-skills-registry) - 浏览社区 Skills

## 获取帮助

如果遇到问题：

1. 查看 [常见问题](https://docs.novelweave.com/faq)
2. 加入 [Discord 社区](https://discord.gg/novelweave)
3. 提交 [GitHub Issue](https://github.com/wordflowlab/novelweave/issues)

---

**版本**: v0.13.0
**最后更新**: 2025-10-19
