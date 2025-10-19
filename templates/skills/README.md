# NovelWeave 内置 Skills

这个目录包含了 NovelWeave 的内置 Agent Skills，帮助 AI 助手在写作过程中提供专业指导。

## 什么是 Agent Skills？

Agent Skills 是模块化的知识库，AI 可以根据当前任务自动激活和使用。当你请求帮助时，AI 会智能判断哪些 Skills 对当前情况最有帮助。

## 内置 Skills 目录

### 📚 类型知识 (genre-knowledge)

- **romance/** - 言情小说创作指南
- **mystery/** - 悬疑小说写作技巧
- **fantasy/** - 奇幻世界构建技巧

### ✅ 质量保证 (quality-assurance)

- **consistency-checker/** - 一致性检查工具
- **requirement-detector/** - 需求检测器
- **forgotten-elements/** - 遗漏元素检查
- **pre-write-checklist/** - 预写作检查清单
- **getting-started/** - 新手入门指南
- **setting-detector/** - 设定检测器
- **style-detector/** - 风格检测器
- **workflow-guide/** - 工作流指南

### ✍️ 写作技巧 (writing-techniques)

- **dialogue-techniques/** - 对话写作技巧
- **scene-structure/** - 场景结构指南

### 🔧 NovelWeave 工作流 (novelweave-workflow)

- NovelWeave 平台的使用指南和最佳实践

## Skill 文件格式

每个 Skill 都存储在 `SKILL.md` 文件中，包含：

### YAML Frontmatter（必需）

```yaml
---
name: Skill 名称
description: 详细描述此 Skill 的用途和适用场景
version: 1.0.0
keywords: [关键词1, 关键词2]
when_to_use: 何时使用此 Skill
allowed_tool_groups: [read, edit]
required_modes: [code, architect] # 可选：限制适用的 Modes
---
```

### Markdown 内容

Frontmatter 后的 Markdown 内容包含：

- 指导原则
- 最佳实践
- 示例
- 检查清单
- 相关技能链接

## AI 如何使用 Skills

1. **自动发现**：AI 在每次对话开始时看到可用 Skills 列表
2. **智能激活**：根据用户请求内容，AI 自主判断是否需要某个 Skill
3. **声明使用**：AI 通过 `[USING SKILL: Skill Name]` 声明激活
4. **内容注入**：系统自动加载完整 Skill 内容到 AI 上下文
5. **应用指导**：AI 按照 Skill 中的指导完成任务

## 创建自定义 Skills

用户可以在以下位置创建自定义 Skills：

### 个人 Skills

- 位置：VSCode 全局存储 `skills/` 目录
- 用途：个人写作风格和偏好
- 创建：命令面板 → "NovelWeave: Create New Agent Skill" → "Personal Skill"

### 项目 Skills

- 位置：工作区 `.novelweave/skills/` 目录
- 用途：项目特定的规范和约定
- 创建：命令面板 → "NovelWeave: Create New Agent Skill" → "Project Skill"
- 优势：通过 Git 共享给团队成员

### 优先级

- Project Skills > Personal Skills > Extension Skills
- 同名 Skill 会被高优先级覆盖

## 最佳实践

### 编写 Skills

1. **聚焦单一主题**：每个 Skill 应该专注于一个明确的领域
2. **提供具体指导**：包含可操作的步骤和检查清单
3. **包含示例**：好的和坏的示例对比最有效
4. **保持简洁**：避免冗长，突出关键点
5. **使用标准格式**：遵循上述 YAML frontmatter 格式

### 使用 Skills

1. **信任 AI 判断**：让 AI 自主决定何时使用 Skills
2. **明确需求**：清晰描述你的写作任务
3. **查看激活**：注意 AI 响应中的 `[USING SKILL: ...]` 声明
4. **反馈改进**：如果 Skill 不够有用，修改或创建新的

## 技术细节

### 扫描机制

- 扩展启动时自动扫描所有 Skills 目录
- 使用渐进式加载：扫描时只读 frontmatter，使用时才加载内容
- 性能目标：扫描 100 个 Skills < 50ms

### 缓存策略

- Skill 内容加载后缓存在内存中
- 避免重复文件读取，提高性能

### Mode 集成

- Skills 可以通过 `required_modes` 限制适用 Modes
- Modes 可以通过 `recommendedSkills` 推荐特定 Skills
- Mode 切换时自动更新可用 Skills 列表

## 相关命令

- `NovelWeave: Refresh Agent Skills` - 重新扫描 Skills 目录
- `NovelWeave: Create New Agent Skill` - 创建新的 Skill

## 贡献

欢迎贡献高质量的内置 Skills！请确保：

1. 格式正确（包含有效的 YAML frontmatter）
2. 内容实用且准确
3. 包含清晰的示例
4. 遵循最佳实践

---

**注意**：内置 Skills 随 NovelWeave 扩展一起打包分发，所有用户都可以使用。
