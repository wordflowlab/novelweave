# NovelWeave Agent Skills 支持功能 PRD v0.14.0

## 📋 文档信息

| 项目         | 信息                                 |
| ------------ | ------------------------------------ |
| **文档版本** | v0.14.0 ⚠️ **重大架构变更**          |
| **创建日期** | 2025-10-20                           |
| **产品名称** | NovelWeave - Agent Skills Support    |
| **目标版本** | v0.14.0                              |
| **负责人**   | WordFlow Lab                         |
| **状态**     | 📝 Design Review                     |
| **前置版本** | v0.13.0 设计（已废弃，存在设计缺陷） |

## 修订历史

| 版本    | 日期       | 作者         | 变更说明                                                 |
| ------- | ---------- | ------------ | -------------------------------------------------------- |
| v0.14.0 | 2025-10-20 | AI Assistant | **重大架构变更**：采用项目初始化模式（学习 Claude Code） |
| v0.13.0 | 2025-10-19 | AI Assistant | 初始设计（已废弃，存在设计缺陷）                         |

---

## 🎯 为什么需要 v0.14.0？

### v0.13.0 设计的关键缺陷

v0.13.0 的初始设计存在**致命的架构问题**：

#### 问题 1：内置 Skills 无法修改

```
内置 Skills 位置：dist/templates/skills/  ← 构建产物
                                         ← 只读
                                         ← 每次构建覆盖
                                         ← 用户修改会丢失！
```

**影响**：

- ❌ 用户无法自定义内置 Skills
- ❌ 即使声称"项目 Skills 覆盖内置"，用户得从零写一个同名 Skill
- ❌ 不符合"开箱即用"的承诺

#### 问题 2：三层优先级过于复杂

```typescript
// v0.13.0 设计
extension:romance  ← 内置（只读）
project:romance    ← 项目（可修改）
personal:romance   ← 个人（可修改）

// 三个不同的 Skill！无法真正"覆盖"
```

**影响**：

- ❌ Skill ID 包含 source 前缀，无法覆盖
- ❌ 逻辑复杂，难以理解
- ❌ 用户困惑：为什么有三个 romance Skill？

#### 问题 3：不符合行业最佳实践

**Cursor / Claude Code 的做法**：

```bash
# 首次使用时
.claude/
├── skills/      ← 从模板复制到项目
├── commands/    ← 用户完全掌控
└── config.json  ← Git 版本控制
```

**v0.13.0 的做法**（错误）：

```bash
# 运行时
dist/templates/skills/  ← 只读，用户无法修改
.agent/skills/          ← 可修改，但需要从零写
```

---

## ✅ v0.14.0 的核心变更

### 设计理念：项目初始化模式

**学习 Claude Code / Cursor**：将内置 Skills 作为**初始化模板**，而非运行时依赖。

```
┌─────────────────────────────────────────────────────────┐
│ 1. 首次使用                                              │
│    用户打开项目 → 检测到未初始化                          │
│    ↓                                                      │
│    提示："是否初始化 Agent Skills 到项目？"                │
│    ↓                                                      │
│    用户确认 → 复制所有内置 Skills 到 .agent/skills/       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. 日常使用                                              │
│    用户可以：                                             │
│    - ✅ 直接修改 .agent/skills/ 中的任何 Skill           │
│    - ✅ 删除不需要的 Skills                              │
│    - ✅ 添加新的 Skills                                  │
│    - ✅ 提交到 Git，团队共享                             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. 团队协作                                              │
│    团队成员 clone 项目 → .agent/skills/ 已存在            │
│    ↓                                                      │
│    直接使用，无需初始化                                   │
│    ↓                                                      │
│    修改 Skills → 提交 → 团队同步                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 v0.13.0 vs v0.14.0 对比

| 维度                   | v0.13.0（废弃）                         | v0.14.0（当前）                          |
| ---------------------- | --------------------------------------- | ---------------------------------------- |
| **内置 Skills 位置**   | `dist/templates/skills/`（运行时读取）  | `dist/templates/skills/`（仅初始化模板） |
| **内置 Skills 可修改** | ❌ 只读，构建时覆盖                     | ✅ 初始化到项目后可修改                  |
| **Skill ID**           | `extension:romance`（包含 source）      | `romance`（只用目录名）                  |
| **优先级**             | extension < project < personal（三层）  | project > personal（两层）               |
| **覆盖机制**           | ❌ 无法覆盖（ID 不同）                  | ✅ 同名自动覆盖                          |
| **用户控制权**         | ⚠️ 部分（内置只读，需从零写项目 Skill） | ✅ 完全（所有 Skills 在项目中）          |
| **团队协作**           | ⚠️ 可行但复杂（需要理解三层逻辑）       | ✅ 简单（Git 共享 `.agent/skills/`）     |
| **首次使用**           | 立即可用（但无法修改）                  | 需初始化（一次性，然后完全掌控）         |
| **更新机制**           | ⚠️ 扩展更新自动更新（覆盖用户修改）     | ✅ 不自动更新（用户完全掌控）            |
| **学习曲线**           | ⚠️ 中等（需理解三层优先级）             | ✅ 低（项目文件，直接修改）              |
| **符合业界实践**       | ❌ 自创模式                             | ✅ 学习 Cursor/Claude Code               |

---

## 🏗️ 核心架构设计

### Skills 来源重定义

| 来源            | 位置                     | 作用               | 可修改 | Git 管理 | 优先级 |
| --------------- | ------------------------ | ------------------ | ------ | -------- | ------ |
| **模板**        | `dist/templates/skills/` | 仅用于初始化到项目 | ❌     | ❌       | N/A    |
| **项目 Skills** | `.agent/skills/`         | 主要使用，团队共享 | ✅     | ✅       | 高     |
| **个人 Skills** | `globalStorage/skills/`  | 跨项目的个人模板   | ✅     | ❌       | 低     |

**关键变化**：

- ✅ 模板不再参与运行时扫描（仅初始化时使用）
- ✅ 项目 Skills 成为主要使用方式
- ✅ 个人 Skills 用于跨项目复用（如"我的写作风格"）

### Skills 扫描逻辑简化

```typescript
// v0.14.0：只扫描两个位置
async scanSkills(): Promise<void> {
    this.skills.clear()

    const paths = [
        // 1. 个人 Skills（全局）
        { source: 'personal', path: globalStorage/skills/ },

        // 2. 项目 Skills（当前项目）
        { source: 'project', path: .agent/skills/ }
    ]

    // 后者覆盖前者（Map.set 自动覆盖同名 key）
    for (const {source, path} of paths) {
        await this.scanDirectory(path, source)
    }
}

// Skill ID 生成：只用目录名
generateSkillId(skillPath: string): string {
    return path.basename(skillPath)  // "romance"（不包含 source）
}
```

**删除的复杂逻辑**：

- ❌ 不再扫描 `dist/templates/skills/`
- ❌ 不再处理 source 前缀
- ❌ 不再需要复杂的优先级判断

---

## 🚀 核心功能：Skills 初始化器

### SkillsInitializer 设计

**位置**：`src/services/skills/SkillsInitializer.ts`

```typescript
import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"

/**
 * Skills 初始化器
 * 负责将内置 Skills 模板复制到项目
 */
export class SkillsInitializer {
	constructor(private context: vscode.ExtensionContext) {}

	/**
	 * 检测项目是否已初始化 Skills
	 */
	async isInitialized(): Promise<boolean> {
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return false
		}

		const skillsPath = path.join(workspaceFolders[0].uri.fsPath, ".agent", "skills")

		try {
			await fs.access(skillsPath)
			return true
		} catch {
			return false
		}
	}

	/**
	 * 初始化 Skills 到项目
	 * @param force 是否强制覆盖已存在的 Skills
	 */
	async initializeSkills(force: boolean = false): Promise<void> {
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (!workspaceFolders || workspaceFolders.length === 0) {
			throw new Error("No workspace folder open")
		}

		const projectRoot = workspaceFolders[0].uri.fsPath
		const targetPath = path.join(projectRoot, ".agent", "skills")

		// 检查是否已存在
		if (!force && (await this.isInitialized())) {
			throw new Error("Skills already initialized. Use force=true to overwrite.")
		}

		// 获取模板路径
		const templatePath = path.join(this.context.extensionPath, "dist", "templates", "skills")

		// 复制所有 Skills
		await this.copyDirectory(templatePath, targetPath)

		// 创建 README
		await this.createReadme(targetPath)
	}

	/**
	 * 递归复制目录
	 */
	private async copyDirectory(src: string, dest: string): Promise<void> {
		await fs.mkdir(dest, { recursive: true })

		const entries = await fs.readdir(src, { withFileTypes: true })

		for (const entry of entries) {
			const srcPath = path.join(src, entry.name)
			const destPath = path.join(dest, entry.name)

			if (entry.isDirectory()) {
				await this.copyDirectory(srcPath, destPath)
			} else {
				await fs.copyFile(srcPath, destPath)
			}
		}
	}

	/**
	 * 创建 README 文件
	 */
	private async createReadme(skillsPath: string): Promise<void> {
		const readme = `# NovelWeave Agent Skills

这个目录包含您的项目 Agent Skills。

## 说明

- ✅ 您可以自由修改、删除或添加 Skills
- ✅ Skills 文件会被 Git 跟踪，团队共享
- ✅ 每个 Skill 是一个目录，包含 SKILL.md 文件

## 目录结构

\`\`\`
.agent/skills/
├── genre-knowledge/       # 类型知识
│   ├── romance/
│   ├── mystery/
│   └── fantasy/
├── quality-assurance/     # 质量保证
│   ├── consistency-checker/
│   └── novelweave-workflow/
└── writing-techniques/    # 写作技巧
    ├── dialogue-techniques/
    └── scene-structure/
\`\`\`

## 如何使用

1. **查看 Skill**：打开任意 Skill 目录中的 SKILL.md 文件
2. **修改 Skill**：直接编辑 SKILL.md 或添加支持文件
3. **删除 Skill**：删除整个 Skill 目录
4. **添加新 Skill**：创建新目录，添加 SKILL.md 文件

## 参考资料

- [Skills 编写指南](https://docs.novelweave.com/skills-guide)
- [SKILL.md 格式规范](https://docs.novelweave.com/skill-format)

---

_初始化时间：${new Date().toISOString()}_
_NovelWeave 版本：${this.context.extension.packageJSON.version}_
`

		await fs.writeFile(path.join(skillsPath, "README.md"), readme, "utf-8")
	}

	/**
	 * 检查是否有新的官方 Skills
	 * 对比模板和项目中的 Skills
	 */
	async checkForNewSkills(): Promise<string[]> {
		const templatePath = path.join(this.context.extensionPath, "dist", "templates", "skills")

		const projectPath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, ".agent", "skills")

		const templateSkills = await this.listSkills(templatePath)
		const projectSkills = await this.listSkills(projectPath)

		// 找出模板中有但项目中没有的 Skills
		return templateSkills.filter((skill) => !projectSkills.includes(skill))
	}

	/**
	 * 列出目录中的所有 Skills
	 */
	private async listSkills(basePath: string): Promise<string[]> {
		const skills: string[] = []

		try {
			const categories = await fs.readdir(basePath, { withFileTypes: true })

			for (const category of categories) {
				if (category.isDirectory() && !category.name.startsWith(".")) {
					const categoryPath = path.join(basePath, category.name)
					const skillDirs = await fs.readdir(categoryPath, { withFileTypes: true })

					for (const skillDir of skillDirs) {
						if (skillDir.isDirectory()) {
							skills.push(`${category.name}/${skillDir.name}`)
						}
					}
				}
			}
		} catch (error) {
			// Directory doesn't exist
		}

		return skills
	}

	/**
	 * 添加缺失的 Skills
	 */
	async addMissingSkills(skillPaths: string[]): Promise<void> {
		const templateBasePath = path.join(this.context.extensionPath, "dist", "templates", "skills")

		const projectBasePath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, ".agent", "skills")

		for (const skillPath of skillPaths) {
			const src = path.join(templateBasePath, skillPath)
			const dest = path.join(projectBasePath, skillPath)

			await this.copyDirectory(src, dest)
		}
	}
}
```

### 首次使用流程

```typescript
// src/extension.ts

export async function activate(context: vscode.ExtensionContext) {
	// ... existing initialization ...

	// 初始化 SkillsInitializer
	const skillsInitializer = new SkillsInitializer(context)

	// 检测是否已初始化
	const isInitialized = await skillsInitializer.isInitialized()

	if (!isInitialized && vscode.workspace.workspaceFolders) {
		// 首次使用，提示初始化
		const action = await vscode.window.showInformationMessage(
			"检测到这是新项目，是否初始化 Agent Skills？",
			{
				modal: false,
				detail: "将复制所有内置 Skills 到 .agent/skills/，您可以自由修改。",
			},
			"初始化",
			"稍后",
			"不再提示",
		)

		if (action === "初始化") {
			try {
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "初始化 Agent Skills...",
						cancellable: false,
					},
					async (progress) => {
						progress.report({ increment: 0, message: "复制 Skills 模板..." })
						await skillsInitializer.initializeSkills()

						progress.report({ increment: 100, message: "完成！" })
					},
				)

				vscode.window
					.showInformationMessage(
						"Agent Skills 初始化成功！您现在可以在 .agent/skills/ 中修改它们。",
						"打开 Skills 目录",
					)
					.then((selection) => {
						if (selection === "打开 Skills 目录") {
							const skillsUri = vscode.Uri.file(
								path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, ".agent", "skills"),
							)
							vscode.commands.executeCommand("revealInExplorer", skillsUri)
						}
					})
			} catch (error) {
				vscode.window.showErrorMessage(`初始化失败: ${error.message}`)
			}
		} else if (action === "不再提示") {
			// 记录用户选择
			context.globalState.update("skills.dontAskAgain", true)
		}
	}

	// 初始化 SkillsManager（只扫描 project 和 personal）
	const skillsManager = SkillsManager.getInstance(context)
	await skillsManager.initialize()

	// ... rest of activation ...
}
```

---

## 📋 SkillsManager 简化

### 简化后的接口

```typescript
export interface Skill {
	id: string // 只用目录名："romance"
	name: string
	description: string
	path: string
	source: "personal" | "project" // ❌ 删除 'extension'

	// Optional fields
	allowedToolGroups?: string[]
	keywords?: string[]
	version?: string
	whenToUse?: string

	// Content (lazy loaded)
	content?: string
	supportFiles?: string[]

	// Integration
	mcpResources?: string[]
	requiredModes?: string[]
}
```

### 简化的 SkillsManager

```typescript
export class SkillsManager {
	private skills: Map<string, Skill> = new Map()

	/**
	 * 扫描 Skills（只扫描 project 和 personal）
	 */
	async scanSkills(): Promise<void> {
		this.skills.clear()

		const paths = this.getSkillsPaths()

		// 按优先级从低到高扫描（后者覆盖前者）
		for (const [source, basePath] of paths) {
			try {
				await this.scanDirectory(basePath, source)
			} catch (error) {
				console.warn(`Failed to scan skills from ${basePath}:`, error)
			}
		}
	}

	/**
	 * 获取 Skills 路径（只有 2 个）
	 */
	private getSkillsPaths(): Array<["personal" | "project", string]> {
		const paths: Array<["personal" | "project", string]> = []

		// 1. Personal skills（优先级低）
		const personalPath = path.join(this.context.globalStorageUri.fsPath, "skills")
		paths.push(["personal", personalPath])

		// 2. Project skills（优先级高，覆盖 personal）
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (workspaceFolders && workspaceFolders.length > 0) {
			const projectPath = path.join(workspaceFolders[0].uri.fsPath, ".agent", "skills")
			paths.push(["project", projectPath])
		}

		return paths
	}

	/**
	 * 生成 Skill ID（只用目录名）
	 */
	private generateSkillId(skillPath: string): string {
		return path.basename(skillPath) // "romance"（不包含 source）
	}

	// ... rest of the implementation (same as v0.13.0 design) ...
}
```

**删除的代码**：

- ❌ 扫描 extension Skills 的逻辑
- ❌ `${source}:${dirName}` 的 ID 生成
- ❌ 三层优先级判断逻辑

---

## 🎨 用户体验流程

### 场景 1：首次使用（新项目）

```
1. 用户安装 NovelWeave 扩展
   ↓
2. 打开一个新项目（没有 .agent/skills/）
   ↓
3. NovelWeave 激活 → 检测到未初始化
   ↓
4. 显示提示：
   ┌─────────────────────────────────────────────┐
   │ 💡 检测到这是新项目，是否初始化 Agent Skills？ │
   │                                              │
   │ 将复制所有内置 Skills 到 .agent/skills/，    │
   │ 您可以自由修改。                              │
   │                                              │
   │ [初始化]  [稍后]  [不再提示]                  │
   └─────────────────────────────────────────────┘
   ↓
5. 用户点击"初始化" → 进度通知
   ↓
6. 完成！显示：
   ┌─────────────────────────────────────────────┐
   │ ✅ Agent Skills 初始化成功！                  │
   │                                              │
   │ 您现在可以在 .agent/skills/ 中修改它们。      │
   │                                              │
   │ [打开 Skills 目录]                           │
   └─────────────────────────────────────────────┘
   ↓
7. 项目结构：
   .agent/
   └── skills/
       ├── README.md
       ├── genre-knowledge/
       │   ├── romance/
       │   │   └── SKILL.md
       │   ├── mystery/
       │   │   └── SKILL.md
       │   └── fantasy/
       │       └── SKILL.md
       ├── quality-assurance/
       │   ├── consistency-checker/
       │   │   └── SKILL.md
       │   └── novelweave-workflow/
       │       └── SKILL.md
       └── writing-techniques/
           ├── dialogue-techniques/
           │   └── SKILL.md
           └── scene-structure/
               └── SKILL.md
```

### 场景 2：修改 Skill

```
1. 用户在 VS Code 中打开 .agent/skills/romance/SKILL.md
   ↓
2. 直接编辑文件（普通的 Markdown 文件）
   ↓
3. 修改 frontmatter 或内容
   ---
   name: Romance Novel Conventions
   description: My customized romance writing guide  ← 修改
   keywords: [romance, love, 言情小说]
   ---

   # 我的言情小说创作规范  ← 修改

   ## 核心要素（我的风格）  ← 添加
   ...
   ↓
4. 保存文件（Cmd+S / Ctrl+S）
   ↓
5. NovelWeave 自动检测文件变化
   ↓
6. 重新扫描 Skills
   ↓
7. 下次 AI 使用时，使用修改后的版本 ✅
```

### 场景 3：团队协作

```
【开发者 A】
1. 初始化 Skills 到项目
   ↓
2. 自定义团队的 Skills（如修改 romance Skill）
   ↓
3. 提交到 Git
   $ git add .agent/skills/
   $ git commit -m "Custom romance skill for our project"
   $ git push

【开发者 B】
1. Clone 项目
   $ git clone <repo>
   ↓
2. 打开项目 → NovelWeave 激活
   ↓
3. 检测到 .agent/skills/ 已存在 → 跳过初始化提示
   ↓
4. 直接使用团队自定义的 Skills ✅
   ↓
5. 如果需要修改 → 直接编辑 → 提交 Git
```

### 场景 4：NovelWeave 更新后

```
1. NovelWeave 发布新版本（如 v0.14.0）
   - 新增了 "sci-fi" Skill
   - 改进了 "dialogue-techniques" Skill
   ↓
2. 用户更新扩展
   ↓
3. 打开项目 → NovelWeave 激活
   ↓
4. 用户手动执行：NovelWeave: Check for New Skills
   ↓
5. 显示：
   ┌─────────────────────────────────────────────┐
   │ 💡 发现 1 个新的官方 Skill：                  │
   │                                              │
   │  - genre-knowledge/sci-fi                    │
   │                                              │
   │ 是否添加到项目？                              │
   │                                              │
   │ [添加]  [稍后]  [查看详情]                    │
   └─────────────────────────────────────────────┘
   ↓
6. 用户选择"添加" → 只复制新 Skill
   ↓
7. 已存在的 Skills 不受影响（用户的修改保留） ✅
```

---

## 🛠️ 命令注册

### 新增命令

```typescript
// src/activate/registerCommands.ts

export function registerCommands({ context, provider }: { context: vscode.ExtensionContext; provider: ClineProvider }) {
	// ... existing commands ...

	// Skills 初始化命令
	context.subscriptions.push(
		vscode.commands.registerCommand("novelweave.skills.initialize", async () => {
			const initializer = new SkillsInitializer(context)

			try {
				// 检查是否已初始化
				const isInitialized = await initializer.isInitialized()

				if (isInitialized) {
					const action = await vscode.window.showWarningMessage(
						"Skills 已经初始化。是否重新初始化（将覆盖现有 Skills）？",
						{ modal: true },
						"重新初始化",
						"取消",
					)

					if (action !== "重新初始化") {
						return
					}
				}

				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "初始化 Agent Skills...",
						cancellable: false,
					},
					async (progress) => {
						await initializer.initializeSkills(true)
					},
				)

				vscode.window
					.showInformationMessage("Agent Skills 初始化成功！", "打开 Skills 目录")
					.then((selection) => {
						if (selection === "打开 Skills 目录") {
							const skillsUri = vscode.Uri.file(
								path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, ".agent", "skills"),
							)
							vscode.commands.executeCommand("revealInExplorer", skillsUri)
						}
					})

				// 重新扫描 Skills
				await provider.skillsManager?.scanSkills()
			} catch (error) {
				vscode.window.showErrorMessage(`初始化失败: ${error.message}`)
			}
		}),
	)

	// 检查新 Skills 命令
	context.subscriptions.push(
		vscode.commands.registerCommand("novelweave.skills.checkNew", async () => {
			const initializer = new SkillsInitializer(context)

			try {
				const newSkills = await initializer.checkForNewSkills()

				if (newSkills.length === 0) {
					vscode.window.showInformationMessage("没有发现新的官方 Skills。")
					return
				}

				const action = await vscode.window.showInformationMessage(
					`发现 ${newSkills.length} 个新的官方 Skills：\n\n${newSkills.join("\n")}\n\n是否添加到项目？`,
					{ modal: true },
					"添加",
					"取消",
				)

				if (action === "添加") {
					await vscode.window.withProgress(
						{
							location: vscode.ProgressLocation.Notification,
							title: "添加新 Skills...",
							cancellable: false,
						},
						async (progress) => {
							await initializer.addMissingSkills(newSkills)
						},
					)

					vscode.window.showInformationMessage(`成功添加 ${newSkills.length} 个新 Skills！`)

					// 重新扫描 Skills
					await provider.skillsManager?.scanSkills()
				}
			} catch (error) {
				vscode.window.showErrorMessage(`检查失败: ${error.message}`)
			}
		}),
	)

	// Skills 刷新命令（保留）
	context.subscriptions.push(
		vscode.commands.registerCommand("novelweave.skills.refresh", async () => {
			try {
				await provider.skillsManager?.scanSkills()
				vscode.window.showInformationMessage("Skills 刷新成功")
			} catch (error) {
				vscode.window.showErrorMessage(`刷新失败: ${error.message}`)
			}
		}),
	)
}
```

### package.json 命令定义

```json
{
	"contributes": {
		"commands": [
			{
				"command": "novelweave.skills.initialize",
				"title": "NovelWeave: Initialize Agent Skills",
				"category": "NovelWeave"
			},
			{
				"command": "novelweave.skills.checkNew",
				"title": "NovelWeave: Check for New Skills",
				"category": "NovelWeave"
			},
			{
				"command": "novelweave.skills.refresh",
				"title": "NovelWeave: Refresh Skills",
				"category": "NovelWeave"
			}
		]
	}
}
```

---

## 📦 构建配置

### esbuild 配置（复制模板）

```javascript
// src/esbuild.mjs

const copySkillsPlugin = {
	name: "copy-skills",
	setup(build) {
		build.onEnd(async () => {
			const fs = require("fs-extra")
			const path = require("path")

			const src = path.join(__dirname, "templates/skills")
			const dest = path.join(__dirname, "dist/templates/skills")

			// 复制 Skills 模板到 dist/
			await fs.copy(src, dest, {
				overwrite: true,
				errorOnExist: false,
			})

			console.log("✅ Skills templates copied to dist/")
		})
	},
}

// 添加到 plugins
export default {
	// ... other config
	plugins: [
		// ... other plugins
		copySkillsPlugin,
	],
}
```

### .gitignore 更新

```bash
# .gitignore

# 构建产物
dist/

# 但保留源代码中的 Skills 模板
!src/templates/skills/
```

### .agent/.gitignore（用户项目）

```bash
# .agent/.gitignore

# 跟踪 Skills（团队共享）
!skills/

# 但忽略临时文件
skills/**/*.tmp
skills/**/.DS_Store
```

---

## 📋 实现计划

### Phase 1: 核心初始化功能（Week 1）

#### Sprint 1.1: SkillsInitializer 实现（3 days）

**任务**：

- [ ] 创建 `SkillsInitializer` 类
- [ ] 实现 `isInitialized()` 检测逻辑
- [ ] 实现 `initializeSkills()` 复制逻辑
- [ ] 实现 `checkForNewSkills()` 对比逻辑
- [ ] 实现 `addMissingSkills()` 添加逻辑
- [ ] 单元测试

**交付物**：

- ✅ `src/services/skills/SkillsInitializer.ts`
- ✅ `src/services/skills/__tests__/SkillsInitializer.test.ts`

#### Sprint 1.2: 扩展激活集成（2 days）

**任务**：

- [ ] 在 `extension.ts` 中添加首次初始化提示
- [ ] 实现初始化流程 UI
- [ ] 处理用户选择（初始化/稍后/不再提示）
- [ ] 测试首次使用体验

**交付物**：

- ✅ 修改 `src/extension.ts`
- ✅ 首次使用提示流程

#### Sprint 1.3: SkillsManager 简化（2 days）

**任务**：

- [ ] 移除 extension Skills 扫描逻辑
- [ ] 移除 source 前缀生成
- [ ] 简化为两层优先级（personal → project）
- [ ] 更新测试用例

**交付物**：

- ✅ 简化的 `src/services/skills/SkillsManager.ts`
- ✅ 更新的测试用例

### Phase 2: 命令和 UI（Week 2）

#### Sprint 2.1: 命令注册（2 days）

**任务**：

- [ ] 注册 `novelweave.skills.initialize` 命令
- [ ] 注册 `novelweave.skills.checkNew` 命令
- [ ] 更新 `package.json` 命令定义
- [ ] 测试命令执行

**交付物**：

- ✅ 修改 `src/activate/registerCommands.ts`
- ✅ 修改 `src/package.json`

#### Sprint 2.2: WebView UI 更新（3 days）

**任务**：

- [ ] 移除"Extension Skills"分组
- [ ] 只显示 Project 和 Personal Skills
- [ ] 添加"初始化 Skills"按钮（如未初始化）
- [ ] 添加"检查新 Skills"按钮

**交付物**：

- ✅ 修改 `webview-ui/src/components/skills/SkillsPanel.tsx`
- ✅ 更新 UI 逻辑

### Phase 3: 内置 Skills 创建（Week 2-3）

#### Sprint 3.1: 创建 Skills 模板（4 days）

**任务**：

- [ ] 创建 `src/templates/skills/` 目录结构
- [ ] 从 `novel-writer-skills` 改写核心 Skills：
    - [ ] genre-knowledge/romance
    - [ ] genre-knowledge/mystery
    - [ ] genre-knowledge/fantasy
    - [ ] quality-assurance/consistency-checker
    - [ ] quality-assurance/novelweave-workflow（全新）
    - [ ] writing-techniques/dialogue-techniques
    - [ ] writing-techniques/scene-structure
- [ ] 创建 Skills README 模板

**交付物**：

- ✅ `src/templates/skills/` 目录及所有 Skills
- ✅ 至少 7 个核心 Skills

### Phase 4: 测试和文档（Week 3）

#### Sprint 4.1: 端到端测试（2 days）

**任务**：

- [ ] 测试首次初始化流程
- [ ] 测试修改 Skills 流程
- [ ] 测试团队协作场景
- [ ] 测试更新检测

**交付物**：

- ✅ E2E 测试用例

#### Sprint 4.2: 文档编写（2 days）

**任务**：

- [ ] 编写用户指南
- [ ] 编写开发者指南
- [ ] 更新 README
- [ ] 创建迁移指南（从 v0.13.0 设计）

**交付物**：

- ✅ `docs/agent-skills-user-guide-v3.md`
- ✅ `docs/agent-skills-developer-guide.md`
- ✅ 更新主 README

#### Sprint 4.3: 发布准备（1 day）

**任务**：

- [ ] 更新 CHANGELOG
- [ ] 准备发布说明
- [ ] 版本号更新到 v0.13.0

**交付物**：

- ✅ `CHANGELOG.md` 更新
- ✅ 发布说明

---

## 🔄 从 v0.13.0 设计迁移（如果已开发）

### 如果已按 v0.13.0 设计实现

**迁移步骤**：

1. **保留的代码**：
    - ✅ Skill 接口定义（大部分字段）
    - ✅ SKILL.md 解析逻辑
    - ✅ 渐进式加载
    - ✅ System Prompt 集成
    - ✅ WebView 基础组件

2. **需要修改的代码**：
    - ⚠️ SkillsManager.scanSkills()（移除 extension 扫描）
    - ⚠️ generateSkillId()（移除 source 前缀）
    - ⚠️ getSkillsPaths()（只返回 2 个路径）

3. **需要新增的代码**：
    - ✅ SkillsInitializer 类
    - ✅ extension.ts 中的初始化提示
    - ✅ 新命令注册

4. **需要删除的代码**：
    - ❌ 三层优先级逻辑
    - ❌ Extension Skills 相关代码

### 迁移检查清单

- [ ] 创建 SkillsInitializer
- [ ] 简化 SkillsManager（删除 extension 相关）
- [ ] 修改 Skill ID 生成（去掉 source 前缀）
- [ ] 更新扩展激活逻辑（添加初始化提示）
- [ ] 注册新命令
- [ ] 更新 WebView UI（移除 Extension Skills 分组）
- [ ] 创建 Skills 模板目录
- [ ] 更新构建配置（复制模板）
- [ ] 更新测试用例
- [ ] 更新文档

---

## ❓ FAQ

### Q: v0.14.0 与 v0.13.0 设计的主要区别？

**A**: v0.14.0 采用**项目初始化模式**，内置 Skills 是模板而非运行时依赖：

- ✅ 用户完全掌控 Skills（可修改）
- ✅ 架构更简单（只有 2 层，不是 3 层）
- ✅ 符合业界最佳实践（学习 Cursor/Claude Code）

### Q: 为什么不能直接使用 dist/ 中的 Skills？

**A**: `dist/` 是构建产物，每次 `pnpm build` 都会覆盖：

- ❌ 用户修改会丢失
- ❌ 无法 Git 版本控制（dist/ 在 .gitignore 中）
- ❌ 不支持团队协作

### Q: 如果用户不想初始化怎么办？

**A**: 可以选择"稍后"或"不再提示"：

- 选择"稍后" → 下次打开项目时再提示
- 选择"不再提示" → 记录设置，不再自动提示
- 随时可以手动执行 `NovelWeave: Initialize Agent Skills` 命令

### Q: 个人 Skills（globalStorage）还有必要吗？

**A**: 有！用于**跨项目**的个人模板：

- 例如："我的写作风格"（适用于所有项目）
- 例如："我的审稿清单"（个人习惯）
- 不适合放在项目中（太个人化，团队可能不需要）

### Q: 如果团队成员修改了同一个 Skill 怎么办？

**A**: 和普通代码一样，通过 Git 解决冲突：

```bash
# 两人都修改了 romance/SKILL.md
$ git pull
Auto-merging .agent/skills/romance/SKILL.md
CONFLICT (content): Merge conflict in .agent/skills/romance/SKILL.md

# 手动解决冲突
$ code .agent/skills/romance/SKILL.md
# 编辑，选择保留的内容

$ git add .agent/skills/romance/SKILL.md
$ git commit -m "Merge romance skill changes"
```

### Q: NovelWeave 更新会覆盖我的 Skills 吗？

**A**: **绝对不会**！

- ✅ 项目中的 Skills（.agent/skills/）完全由用户掌控
- ✅ 扩展更新只影响模板（dist/templates/skills/）
- ✅ 新 Skills 需要手动添加（通过"检查新 Skills"命令）

### Q: 可以只初始化部分 Skills 吗？

**A**: v0.14.0 初版是"全部初始化"，但可以：

- 初始化后删除不需要的 Skills
- 或者手动从模板复制需要的 Skills

未来版本可能添加"选择性初始化"功能。

### Q: 如何备份我的 Skills？

**A**: Skills 在项目中，随 Git 自动备份：

```bash
$ git add .agent/skills/
$ git commit -m "Update skills"
$ git push
```

---

## 📊 设计验证

### 与 Claude Code 对齐

| 特性             | Claude Code   | NovelWeave v0.14.0 | 一致性 |
| ---------------- | ------------- | ------------------ | ------ |
| **初始化到项目** | ✅ `.claude/` | ✅ `.agent/`       | ✅     |
| **用户完全掌控** | ✅            | ✅                 | ✅     |
| **Git 版本控制** | ✅            | ✅                 | ✅     |
| **团队共享**     | ✅            | ✅                 | ✅     |
| **可自由修改**   | ✅            | ✅                 | ✅     |
| **AI 自主激活**  | ✅            | ✅                 | ✅     |
| **不自动更新**   | ✅            | ✅                 | ✅     |

### 设计原则检查

- ✅ **用户控制权优先**：用户完全掌控项目 Skills
- ✅ **简单性**：两层架构，易于理解
- ✅ **Git 友好**：Skills 在项目中，自然支持版本控制
- ✅ **团队协作**：通过 Git 共享，无需额外机制
- ✅ **最佳实践**：学习成熟产品（Cursor/Claude Code）
- ✅ **向后兼容**：保留个人 Skills（globalStorage）支持
- ✅ **渐进增强**：可选的初始化，可选的更新检测

---

## 📚 附录

### A. 完整的目录结构

```
novel/                                      # NovelWeave 项目
├── src/
│   ├── templates/
│   │   └── skills/                        # Skills 模板（源代码）
│   │       ├── README.md
│   │       ├── genre-knowledge/
│   │       │   ├── romance/
│   │       │   │   └── SKILL.md
│   │       │   ├── mystery/
│   │       │   │   └── SKILL.md
│   │       │   └── fantasy/
│   │       │       └── SKILL.md
│   │       ├── quality-assurance/
│   │       │   ├── consistency-checker/
│   │       │   │   └── SKILL.md
│   │       │   └── novelweave-workflow/
│   │       │       └── SKILL.md
│   │       └── writing-techniques/
│   │           ├── dialogue-techniques/
│   │           │   └── SKILL.md
│   │           └── scene-structure/
│   │               └── SKILL.md
│   │
│   ├── services/
│   │   └── skills/
│   │       ├── SkillsManager.ts           # 简化版
│   │       ├── SkillsInitializer.ts       # 新增
│   │       └── __tests__/
│   │
│   └── dist/
│       └── templates/
│           └── skills/                    # 复制自 src/templates/skills/
│
└── esbuild.mjs                            # 构建时复制 Skills

---

用户项目/                                  # 用户的小说项目
├── .agent/
│   └── skills/                           # 从模板初始化，用户完全掌控
│       ├── README.md
│       ├── genre-knowledge/
│       │   └── romance/
│       │       └── SKILL.md              # 可修改 ✅
│       └── ...
│
└── .git/                                 # Git 跟踪 .agent/skills/

---

globalStorage/                            # 跨项目的个人 Skills
└── skills/
    └── my-writing-style/
        └── SKILL.md
```

### B. Skill ID 对比

**v0.13.0 设计（错误）**：

```typescript
// 三个不同的 Skill，无法覆盖
skills.set("extension:romance", extensionRomanceSkill)
skills.set("project:romance", projectRomanceSkill)
skills.set("personal:romance", personalRomanceSkill)

// 结果：存在 3 个 romance Skill
```

**v0.14.0（正确）**：

```typescript
// 同名自动覆盖（Map 特性）
skills.set("romance", personalRomanceSkill) // 先扫描 personal
skills.set("romance", projectRomanceSkill) // 后扫描 project，覆盖

// 结果：只有 1 个 romance Skill（project 版本）
```

---

## ✅ 验收标准

### 核心功能

- [ ] ✅ 首次使用时自动提示初始化
- [ ] ✅ 初始化成功复制所有 Skills 到 `.agent/skills/`
- [ ] ✅ 用户可以直接修改项目 Skills
- [ ] ✅ 项目 Skills 覆盖个人 Skills
- [ ] ✅ Skill ID 只用目录名（无 source 前缀）
- [ ] ✅ 不再扫描 dist/templates/skills/（仅模板）

### 命令

- [ ] ✅ `NovelWeave: Initialize Agent Skills` 命令工作正常
- [ ] ✅ `NovelWeave: Check for New Skills` 命令工作正常
- [ ] ✅ 已初始化时再次初始化会警告

### 用户体验

- [ ] ✅ 首次使用提示清晰易懂
- [ ] ✅ 初始化进度显示
- [ ] ✅ 初始化成功后可打开 Skills 目录
- [ ] ✅ 修改 Skills 后立即生效（重新扫描）

### 团队协作

- [ ] ✅ `.agent/skills/` 可提交到 Git
- [ ] ✅ 团队成员 clone 后直接使用
- [ ] ✅ Skills 冲突可通过 Git 解决

### 文档

- [ ] ✅ PRD v0.14.0 完整清晰
- [ ] ✅ 用户指南详细
- [ ] ✅ 开发者指南完整
- [ ] ✅ 从 v0.13.0 设计迁移指南

---

## 📝 总结

v0.14.0 通过采用**项目初始化模式**，彻底解决了 v0.13.0 设计的缺陷：

1. ✅ **用户完全掌控**：Skills 在项目中，可自由修改
2. ✅ **架构简化**：两层结构，易于理解
3. ✅ **Git 友好**：天然支持版本控制和团队协作
4. ✅ **符合最佳实践**：学习 Cursor/Claude Code 成熟模式
5. ✅ **向后兼容**：保留个人 Skills 支持

这是一个**更正确、更简单、更强大**的设计。

---

**文档结束**

_本 PRD 基于 v0.13.0 设计的经验教训，采用项目初始化模式重新设计_  
_参考：Cursor、Claude Code 的最佳实践_  
_如有疑问，请联系: WordFlow Lab Team_
