# Agent Skills 开发者文档

## 架构概览

Agent Skills 系统由以下核心组件组成：

```
┌─────────────────────────────────────────────────────────┐
│                    Extension Host                        │
├─────────────────────────────────────────────────────────┤
│  SkillsManager (Singleton)                              │
│  ├─ scanSkills()      - 扫描所有 Skills 目录            │
│  ├─ loadSkillContent() - 渐进式加载内容                 │
│  ├─ activateSkill()   - 激活 Skill                      │
│  └─ getSkillsSummary() - 生成 System Prompt 内容        │
├─────────────────────────────────────────────────────────┤
│  System Prompt Integration                              │
│  └─ generateSkillsSection() - 注入可用 Skills 列表      │
├─────────────────────────────────────────────────────────┤
│  Task Flow Integration                                  │
│  └─ extractActivatedSkills() - 检测 AI 激活的 Skills    │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    WebView UI                           │
├─────────────────────────────────────────────────────────┤
│  SkillsView                                             │
│  └─ SkillsPanel                                         │
│      ├─ SkillGroup                                      │
│      └─ SkillItem                                       │
└─────────────────────────────────────────────────────────┘
```

## 核心类: SkillsManager

### 职责

1. **Skills 扫描** - 发现和解析所有 SKILL.md 文件
2. **内容加载** - 渐进式加载 Skill 内容
3. **激活管理** - 跟踪哪些 Skills 当前激活
4. **配置管理** - 保存用户偏好和禁用列表

### 单例模式

```typescript
export class SkillsManager {
	private static instance: SkillsManager | null = null

	public static getInstance(context: vscode.ExtensionContext): SkillsManager {
		if (!SkillsManager.instance) {
			SkillsManager.instance = new SkillsManager(context)
		}
		return SkillsManager.instance
	}

	private constructor(private context: vscode.ExtensionContext) {}
}
```

### Skills 路径解析

```typescript
private getSkillsPaths(): { path: string; source: SkillSource }[] {
  const paths: { path: string; source: SkillSource }[] = []

  // 1. Extension built-in skills
  const extensionSkillsPath = path.join(
    this.context.extensionPath,
    "dist/templates/skills"
  )
  paths.push({ path: extensionSkillsPath, source: "extension" })

  // 2. Project skills
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (workspaceFolders && workspaceFolders.length > 0) {
    const projectSkillsPath = path.join(
      workspaceFolders[0].uri.fsPath,
      ".agent/skills"
    )
    paths.push({ path: projectSkillsPath, source: "project" })
  }

  // 3. Personal skills
  const homeDir = process.env.HOME || process.env.USERPROFILE
  if (homeDir) {
    const personalSkillsPath = path.join(homeDir, ".novelweave/skills")
    paths.push({ path: personalSkillsPath, source: "personal" })
  }

  return paths
}
```

### Skill 解析

使用 `gray-matter` 解析 YAML frontmatter:

```typescript
private async parseSkillFile(
  filePath: string,
  source: SkillSource
): Promise<Skill | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const { data, content: markdownContent } = matter(content)

    const skill: Skill = {
      id: this.generateSkillId(filePath, source),
      name: data.name || path.basename(path.dirname(filePath)),
      description: data.description || "",
      path: filePath,
      source,
      version: data.version,
      keywords: data.keywords,
      whenToUse: data.whenToUse,
      requiredModes: data.requiredModes,
      mcpResources: data.mcpResources,
      allowedToolGroups: data.allowedToolGroups,
    }

    return skill
  } catch (error) {
    console.error(`Failed to parse skill file ${filePath}:`, error)
    return null
  }
}
```

### 渐进式加载

扫描时只加载元数据，使用时才加载完整内容：

```typescript
public async loadSkillContent(skillId: string): Promise<string | null> {
  const skill = this.skills.get(skillId)
  if (!skill) return null

  // Return cached content if available
  if (skill.content) {
    return skill.content
  }

  // Load content from file
  try {
    const fileContent = await fs.readFile(skill.path, "utf-8")
    const { content } = matter(fileContent)

    // Cache the content
    skill.content = content

    return content
  } catch (error) {
    console.error(`Failed to load skill content for ${skillId}:`, error)
    return null
  }
}
```

## System Prompt 集成

### 注入 Skills 列表

在 `src/core/prompts/sections/skills.ts`:

```typescript
export function generateSkillsSection(skillsManager: SkillsManager, currentMode?: string): string {
	const summary = skillsManager.getSkillsSummary(currentMode)

	if (summary.length === 0) {
		return ""
	}

	const skillsList = summary.map((skill) => `- **${skill.name}**: ${skill.description}`).join("\n")

	return `
# Available Skills

You have access to the following expert knowledge modules (Skills).
When relevant to the user's request, you can activate a Skill by declaring:
[USING SKILL: skill-name]

${skillsList}

When you activate a Skill, its full content will be loaded into context.
Only activate Skills that are directly relevant to the current task.
`
}
```

### 检测 AI 激活

在 `src/core/assistant-message/presentAssistantMessage.ts`:

```typescript
import { extractActivatedSkills } from "../prompts/sections/skills"

// In message processing
const activatedSkillNames = extractActivatedSkills(assistantMessage)

for (const skillName of activatedSkillNames) {
	const skill = skillsManager.findSkillByName(skillName)

	if (skill) {
		await skillsManager.activateSkill(skill.id)
		const content = await skillsManager.loadSkillContent(skill.id)

		// Add content to next request context
		if (content) {
			contextMessages.push({
				role: "user",
				content: `[SKILL: ${skill.name}]\n${content}`,
			})
		}
	}
}
```

## WebView 消息通信

### Extension → WebView

```typescript
// src/core/webview/webviewMessageHandler.ts

case "getSkills": {
  const skills = skillsManager.getAllSkills()
  const activeSkills = skillsManager.getActiveSkills()

  this.postMessageToWebview({
    type: "skillsData",
    skills: skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      source: skill.source,
      version: skill.version,
      keywords: skill.keywords,
      whenToUse: skill.whenToUse,
      requiredModes: skill.requiredModes,
    })),
    activeSkills: activeSkills.map(s => s.id),
  })
  break
}

case "refreshSkills": {
  await skillsManager.initialize()
  // Send updated skills data
  break
}

case "viewSkillDetails": {
  const skillId = message.values?.skillId
  const content = await skillsManager.loadSkillContent(skillId)

  // Open in editor
  const doc = await vscode.workspace.openTextDocument({
    content,
    language: "markdown"
  })
  await vscode.window.showTextDocument(doc)
  break
}
```

### WebView → Extension

```typescript
// webview-ui/src/utils/vscode.ts

export function getSkills() {
	vscode.postMessage({ type: "getSkills" })
}

export function refreshSkills() {
	vscode.postMessage({ type: "refreshSkills" })
}

export function viewSkillDetails(skillId: string) {
	vscode.postMessage({
		type: "viewSkillDetails",
		values: { skillId },
	})
}
```

## 类型定义

共享类型在 `packages/types/src/skills.ts`:

```typescript
export interface Skill {
	id: string
	name: string
	description: string
	path: string
	source: "personal" | "project" | "extension"

	// Optional metadata
	allowedToolGroups?: string[]
	keywords?: string[]
	version?: string
	whenToUse?: string

	// Lazy-loaded content
	content?: string
	supportFiles?: string[]

	// Integration
	mcpResources?: string[]
	requiredModes?: string[]
}

export interface SkillsConfig {
	enabled: boolean
	disabledSkills: string[]
	perModeConfig: Record<
		string,
		{
			enabledSkills?: string[]
		}
	>
}

export type SkillSource = "personal" | "project" | "extension"
```

## 性能优化

### 1. 扫描优化

```typescript
public async scanSkills(): Promise<void> {
  const startTime = Date.now()
  const paths = this.getSkillsPaths()

  // Parallel scanning
  const results = await Promise.all(
    paths.map(({ path, source }) => this.scanDirectory(path, source))
  )

  const scanDuration = Date.now() - startTime
  console.log(`Scanned ${this.skills.size} skills in ${scanDuration}ms`)
}
```

### 2. 内容缓存

```typescript
private contentCache = new Map<string, string>()

public async loadSkillContent(skillId: string): Promise<string | null> {
  // Check cache first
  if (this.contentCache.has(skillId)) {
    return this.contentCache.get(skillId)!
  }

  // Load and cache
  const content = await this.loadFromFile(skillId)
  if (content) {
    this.contentCache.set(skillId, content)
  }

  return content
}
```

### 3. 按需加载

```typescript
// Only load content when actually needed
const content = skill.content || (await skillsManager.loadSkillContent(skill.id))
```

## 测试

### 单元测试示例

```typescript
// src/services/skills/__tests__/SkillsManager.test.ts

import { SkillsManager } from "../SkillsManager"

describe("SkillsManager", () => {
	it("should scan and parse valid SKILL.md files", async () => {
		const manager = SkillsManager.getInstance(mockContext)
		await manager.initialize()

		const skills = manager.getAllSkills()
		expect(skills.length).toBeGreaterThan(0)
	})

	it("should load skill content on demand", async () => {
		const manager = SkillsManager.getInstance(mockContext)
		const skills = manager.getAllSkills()
		const firstSkill = skills[0]

		expect(firstSkill.content).toBeUndefined()

		const content = await manager.loadSkillContent(firstSkill.id)
		expect(content).toBeTruthy()
		expect(firstSkill.content).toBe(content)
	})
})
```

## 扩展 Skills 系统

### 添加新的 Skill 字段

1. 更新类型定义 (`packages/types/src/skills.ts`):

```typescript
export interface Skill {
	// ... existing fields
	author?: string // New field
	license?: string // New field
	dependencies?: string[] // New field
}
```

2. 更新解析逻辑 (`SkillsManager.ts`):

```typescript
const skill: Skill = {
	// ... existing fields
	author: data.author,
	license: data.license,
	dependencies: data.dependencies,
}
```

3. 更新 UI 组件显示新字段

### 添加新的消息类型

1. 定义消息类型 (`src/shared/WebviewMessage.ts`):

```typescript
export interface WebviewMessage {
	type:
		| "getSkills"
		| "refreshSkills"
		| "enableSkill" // New
		| "disableSkill" // New
	// ...
}
```

2. 实现处理逻辑 (`webviewMessageHandler.ts`):

```typescript
case "enableSkill": {
  const skillId = message.values?.skillId
  await skillsManager.enableSkill(skillId)
  break
}
```

## 最佳实践

### 1. 错误处理

```typescript
try {
	const content = await fs.readFile(filePath, "utf-8")
	// Process content
} catch (error) {
	console.error(`Error reading skill file ${filePath}:`, error)
	// Return gracefully, don't throw
	return null
}
```

### 2. 日志记录

```typescript
console.log(`[SkillsManager] Scanning ${paths.length} directories`)
console.log(`[SkillsManager] Found ${this.skills.size} skills`)
console.log(`[SkillsManager] Scan completed in ${duration}ms`)
```

### 3. 配置持久化

```typescript
private async saveConfig(): Promise<void> {
  await this.context.globalState.update("skillsConfig", this.config)
}

private async loadConfig(): Promise<void> {
  const saved = this.context.globalState.get<SkillsConfig>("skillsConfig")
  if (saved) {
    this.config = saved
  }
}
```

## 调试技巧

### 1. 启用详细日志

在 Extension 设置中启用:

```json
{
	"novelweave.skills.debug": true
}
```

### 2. 查看 Skill 路径

在开发者控制台运行:

```typescript
const manager = SkillsManager.getInstance(context)
console.log(manager.getSkillsPaths())
```

### 3. 检查 Skill 内容

```typescript
const skills = manager.getAllSkills()
const skill = skills.find((s) => s.name === "romance-writing")
const content = await manager.loadSkillContent(skill.id)
console.log(content)
```

## 常见问题

### Q: Skills 没有被扫描到

A: 检查：

1. 文件名必须是 `SKILL.md`
2. YAML frontmatter 格式正确
3. 目录权限可读
4. 查看扩展输出面板的错误信息

### Q: 性能问题

A:

1. 减少 Skills 数量（移除不常用的）
2. 优化 Skill 内容大小
3. 使用 `requiredModes` 过滤
4. 清理 content cache

### Q: Skills 内容未更新

A:

1. Skills 内容会被缓存
2. 需要调用 `refreshSkills()` 重新扫描
3. 或重启 Extension Host

## 贡献指南

如果您想为 Skills 系统贡献代码：

1. Fork 仓库
2. 创建功能分支
3. 编写测试
4. 确保所有测试通过
5. 提交 Pull Request

代码风格：

- 使用 TypeScript strict mode
- 遵循 ESLint 规则
- 添加 JSDoc 注释
- 保持函数简短 (< 50 行)

---

**版本**: v0.13.0
**最后更新**: 2025-10-19
