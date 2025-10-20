# NovelWeave Agent Skills 市场 PRD v0.15.0

## 📋 文档信息

| 项目         | 信息                                  |
| ------------ | ------------------------------------- |
| **文档版本** | v0.15.0                               |
| **创建日期** | 2025-10-20                            |
| **产品名称** | NovelWeave - Agent Skills Marketplace |
| **目标版本** | v0.15.0                               |
| **依赖版本** | v0.14.0（项目初始化模式）             |
| **负责人**   | WordFlow Lab                          |
| **状态**     | 📝 Design Review                      |

## 修订历史

| 版本    | 日期       | 作者         | 变更说明                             |
| ------- | ---------- | ------------ | ------------------------------------ |
| v0.15.0 | 2025-10-20 | AI Assistant | Skills 市场功能设计（学习 MCP 市场） |

---

## 📑 目录

1. [产品背景](#产品背景)
2. [核心概念](#核心概念)
3. [技术架构](#技术架构)
4. [Skills Registry 设计](#skills-registry-设计)
5. [功能需求](#功能需求)
6. [实现计划](#实现计划)
7. [用户体验](#用户体验)
8. [附录](#附录)

---

## 🎯 产品背景

### 为什么需要 Skills 市场？

虽然 **v0.14.0** 实现了项目初始化模式，让用户可以完全掌控项目 Skills，但仍存在以下问题：

#### 当前痛点

1. **Skills 发现困难**
    - 用户不知道有哪些社区 Skills 可用
    - 只能通过 GitHub 搜索或文档查找
    - 没有统一的浏览和发现入口

2. **安装过程复杂**
    - 需要手动 Git clone 仓库
    - 需要手动移动文件到 `.agent/skills/`
    - 容易出错（路径、结构等）

3. **更新管理混乱**
    - 不知道哪些 Skills 有更新
    - 手动 Git pull 麻烦
    - 没有版本管理

4. **质量参差不齐**
    - 没有评分和反馈机制
    - 难以判断 Skill 质量
    - 缺乏官方认证

### 学习 MCP 市场的成功经验

NovelWeave 已经成功实现了 **MCP 市场**，提供了出色的用户体验：

| 功能特性       | MCP 市场             | 应用到 Skills 市场      |
| -------------- | -------------------- | ----------------------- |
| **浏览市场**   | ✅ 卡片式展示        | ✅ 同样的 UI 模式       |
| **一键安装**   | ✅ 点击安装按钮      | ✅ Git clone 到目标目录 |
| **搜索过滤**   | ✅ 按名称、标签搜索  | ✅ 按类型、关键词搜索   |
| **详情展示**   | ✅ README、作者、URL | ✅ SKILL.md 预览、示例  |
| **安装选项**   | ✅ 项目/全局         | ✅ 项目/个人            |
| **已安装标识** | ✅ 显示"已安装"      | ✅ 显示"已安装"         |

**核心优势**：

- ✅ 用户已经熟悉 MCP 市场的交互模式
- ✅ 技术栈已验证（MarketplaceManager、RemoteConfigLoader）
- ✅ UI 组件可复用（MarketplaceCard、InstallModal）

### 社区生态建设

Skills 市场将建立一个繁荣的社区生态：

```
┌─────────────────────────────────────────────────────────┐
│ 官方 Skills                                              │
│ - 由 WordFlow Lab 维护                                   │
│ - 高质量保证                                             │
│ - 定期更新                                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 社区贡献                                                 │
│ - 任何人都可以提交                                       │
│ - PR 审核流程                                            │
│ - 自动验证                                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 用户受益                                                 │
│ - 丰富的 Skills 选择                                     │
│ - 快速发现和安装                                         │
│ - 社区评分和反馈                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 核心概念

### Skills 市场 vs MCP 市场

| 维度         | MCP 市场              | Skills 市场                                      |
| ------------ | --------------------- | ------------------------------------------------ |
| **安装内容** | JSON 配置             | Git 仓库（完整 Skill 目录）                      |
| **目标位置** | `mcp.json` 文件       | `.agent/skills/` 或 `globalStorage/skills/` 目录 |
| **数据源**   | API (`api.cline.bot`) | GitHub Registry (`registry.json`)                |
| **安装方式** | 写入配置到 JSON 文件  | Git clone/sparse-checkout                        |
| **更新方式** | 修改配置参数          | Git pull                                         |
| **验证**     | JSON schema           | SKILL.md 格式验证                                |
| **依赖**     | npm/Python 包         | 无外部依赖                                       |
| **大小**     | 配置项（几行 JSON）   | 文件夹（数 KB）                                  |

### Skills 市场的三种 Skill 来源

```
┌─────────────────────────────────────────────────────────┐
│ 1. 市场 Skills（Marketplace Skills）                     │
│    - 来源：novelweave-skills-registry                    │
│    - 安装：从市场一键安装                                │
│    - 更新：检测更新并一键更新                            │
│    - 管理：在 Skills 市场面板中                          │
└─────────────────────────────────────────────────────────┘
                        +
┌─────────────────────────────────────────────────────────┐
│ 2. 初始化 Skills（Initialized Skills）                   │
│    - 来源：内置模板（dist/templates/skills/）            │
│    - 安装：项目初始化时复制                              │
│    - 更新：不自动更新（用户完全掌控）                    │
│    - 管理：直接编辑项目文件                              │
└─────────────────────────────────────────────────────────┘
                        +
┌─────────────────────────────────────────────────────────┐
│ 3. 自定义 Skills（Custom Skills）                        │
│    - 来源：用户自己创建                                  │
│    - 安装：手动创建 SKILL.md                             │
│    - 更新：用户自行维护                                  │
│    - 管理：直接编辑文件                                  │
└─────────────────────────────────────────────────────────┘
```

**关键区别**：

- **市场 Skills**：有 Git 远程仓库，可检测更新
- **初始化 Skills**：没有远程仓库，不可更新
- **自定义 Skills**：用户创建，完全自主

---

## 🏗️ 技术架构

### 系统架构图

```
┌───────────────────────────────────────────────────────────────┐
│                    NovelWeave Extension                        │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   ClineProvider                          │  │
│  │  - fetchSkillsMarketplace()                             │  │
│  │  - installSkillFromMarketplace(skillId, target)         │  │
│  │  - checkSkillUpdates()                                  │  │
│  └────────────────────┬────────────────────────────────────┘  │
│                       │                                        │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │           MarketplaceManager（扩展）                     │  │
│  │  - 已支持 type: "mode" | "mcp"                          │  │
│  │  - 新增 type: "skill"  ← 扩展                           │  │
│  │  - installMarketplaceItem(item, options)                │  │
│  └────────┬─────────────────────────┬─────────────────────┘  │
│           │                         │                         │
│  ┌────────▼─────────┐    ┌─────────▼────────┐               │
│  │ RemoteConfigLoader│    │ SimpleInstaller   │               │
│  │ (复用)            │    │ (扩展)            │               │
│  │                   │    │                   │               │
│  │ - loadConfig()    │    │ - installMcp()    │               │
│  │   for registry    │    │ - installMode()   │               │
│  │                   │    │ - installSkill()  │ ← 新增        │
│  └───────────────────┘    └───────────────────┘               │
│                                     │                          │
│                          ┌──────────▼──────────┐              │
│                          │ SkillsInstaller     │  ← 新建      │
│                          │ (新服务)            │              │
│                          │                     │              │
│                          │ - cloneSkill()      │              │
│                          │ - validateSkill()   │              │
│                          │ - updateSkill()     │              │
│                          └─────────────────────┘              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼─────────┐         ┌─────────▼─────────┐
    │  GitHub Registry   │         │   WebView UI       │
    ├───────────────────┤         ├───────────────────┤
    │ registry.json     │         │ SkillsMarketplace  │
    │ skills/           │         │ SkillCard          │
    │   romance/        │         │ InstallModal       │
    │   fantasy/        │         │                   │
    └───────────────────┘         └───────────────────┘
```

### 核心组件设计

#### 1. 类型系统扩展（packages/types/src/marketplace.ts）

```typescript
// 新增 Skill 市场项类型
export const skillMarketplaceItemSchema = baseMarketplaceItemSchema.extend({
	// Git 仓库 URL
	repository: z.string().url(),

	// Skill 类别
	category: z.enum([
		"genre-knowledge", // 类型知识
		"quality-assurance", // 质量保证
		"writing-techniques", // 写作技巧
		"productivity", // 生产力工具
		"language-specific", // 语言特定
		"other",
	]),

	// 关键词（用于搜索）
	keywords: z.array(z.string()).optional(),

	// 版本号
	version: z.string().regex(/^\d+\.\d+\.\d+$/),

	// 下载统计
	downloads: z.number().default(0),

	// 评分
	rating: z.number().min(0).max(5).optional(),

	// 是否官方验证
	verified: z.boolean().default(false),

	// 最后更新时间
	lastUpdated: z.string().datetime().optional(),

	// 预览图
	previewImage: z.string().url().optional(),
})

export type SkillMarketplaceItem = z.infer<typeof skillMarketplaceItemSchema>

// 扩展 MarketplaceItem 联合类型
export const marketplaceItemSchema = z.discriminatedUnion("type", [
	modeMarketplaceItemSchema.extend({ type: z.literal("mode") }),
	mcpMarketplaceItemSchema.extend({ type: z.literal("mcp") }),
	skillMarketplaceItemSchema.extend({ type: z.literal("skill") }), // 新增
])

export type MarketplaceItem = z.infer<typeof marketplaceItemSchema>
```

#### 2. SkillsInstaller（src/services/skills/SkillsInstaller.ts）

```typescript
import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"
import matter from "gray-matter"

const execAsync = promisify(exec)

export interface SkillInstallOptions {
	target: "project" | "personal"
	skipValidation?: boolean
}

export interface SkillInstallResult {
	skillPath: string
	skillId: string
	wasUpdated: boolean
}

/**
 * Skills Installer
 * 负责从 Git 仓库安装 Skills
 */
export class SkillsInstaller {
	constructor(private context: vscode.ExtensionContext) {}

	/**
	 * 从 Git 仓库安装 Skill
	 */
	async installSkill(
		repositoryUrl: string,
		skillId: string,
		options: SkillInstallOptions,
	): Promise<SkillInstallResult> {
		const { target, skipValidation = false } = options

		// 1. 确定目标路径
		const targetBasePath = this.getTargetBasePath(target)
		const skillPath = path.join(targetBasePath, skillId)

		// 2. 检查是否已安装
		const exists = await this.skillExists(skillPath)

		if (exists) {
			// 已存在，执行更新
			return await this.updateSkill(skillPath, skillId)
		}

		// 3. Git clone
		await this.cloneRepository(repositoryUrl, skillPath)

		// 4. 验证 SKILL.md
		if (!skipValidation) {
			await this.validateSkill(skillPath)
		}

		// 5. 创建 .git-remote 文件（记录远程仓库）
		await this.saveRemoteInfo(skillPath, repositoryUrl)

		return {
			skillPath,
			skillId,
			wasUpdated: false,
		}
	}

	/**
	 * 更新已安装的 Skill
	 */
	async updateSkill(skillPath: string, skillId: string): Promise<SkillInstallResult> {
		// 检查是否有 .git 目录
		const gitDir = path.join(skillPath, ".git")

		try {
			await fs.access(gitDir)

			// 有 .git，执行 git pull
			const { stdout, stderr } = await execAsync("git pull", {
				cwd: skillPath,
			})

			const wasUpdated = !stdout.includes("Already up to date")

			return {
				skillPath,
				skillId,
				wasUpdated,
			}
		} catch (error) {
			// 没有 .git 目录，检查 .git-remote 文件
			const remoteFile = path.join(skillPath, ".git-remote")

			try {
				const remoteUrl = await fs.readFile(remoteFile, "utf-8")

				// 删除旧文件，重新 clone
				await fs.rm(skillPath, { recursive: true, force: true })
				await this.cloneRepository(remoteUrl.trim(), skillPath)

				return {
					skillPath,
					skillId,
					wasUpdated: true,
				}
			} catch {
				throw new Error(
					`Cannot update skill: no Git repository information found. ` +
						`This skill may have been manually created or copied.`,
				)
			}
		}
	}

	/**
	 * 检查 Skill 更新
	 */
	async checkSkillUpdate(skillPath: string): Promise<boolean> {
		const gitDir = path.join(skillPath, ".git")

		try {
			await fs.access(gitDir)

			// Fetch 远程更新
			await execAsync("git fetch", { cwd: skillPath })

			// 检查是否有新的 commits
			const { stdout } = await execAsync("git rev-list HEAD...origin/main --count", { cwd: skillPath })

			return parseInt(stdout.trim()) > 0
		} catch {
			return false
		}
	}

	/**
	 * 卸载 Skill
	 */
	async uninstallSkill(skillPath: string): Promise<void> {
		await fs.rm(skillPath, { recursive: true, force: true })
	}

	/**
	 * Git clone 仓库
	 */
	private async cloneRepository(repositoryUrl: string, targetPath: string): Promise<void> {
		// 确保父目录存在
		await fs.mkdir(path.dirname(targetPath), { recursive: true })

		try {
			// 尝试 sparse checkout（只下载必需文件）
			await execAsync(`git clone --depth 1 --filter=blob:none --sparse ${repositoryUrl} ${targetPath}`)

			// 设置 sparse-checkout
			await execAsync("git sparse-checkout init --cone", { cwd: targetPath })
			await execAsync("git sparse-checkout set SKILL.md *.md examples/ templates/", { cwd: targetPath })
		} catch (error) {
			// Fallback: 普通 clone
			await execAsync(`git clone --depth 1 ${repositoryUrl} ${targetPath}`)
		}
	}

	/**
	 * 验证 SKILL.md 格式
	 */
	private async validateSkill(skillPath: string): Promise<void> {
		const skillFile = path.join(skillPath, "SKILL.md")

		try {
			const content = await fs.readFile(skillFile, "utf-8")
			const { data: frontmatter } = matter(content)

			// 验证必需字段
			if (!frontmatter.name) {
				throw new Error("Missing required field: name")
			}

			if (!frontmatter.description) {
				throw new Error("Missing required field: description")
			}
		} catch (error) {
			throw new Error(`Invalid skill format: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	/**
	 * 保存远程仓库信息
	 */
	private async saveRemoteInfo(skillPath: string, repositoryUrl: string): Promise<void> {
		const remoteFile = path.join(skillPath, ".git-remote")
		await fs.writeFile(remoteFile, repositoryUrl, "utf-8")
	}

	/**
	 * 获取目标基础路径
	 */
	private getTargetBasePath(target: "project" | "personal"): string {
		if (target === "project") {
			const workspaceFolders = vscode.workspace.workspaceFolders
			if (!workspaceFolders || workspaceFolders.length === 0) {
				throw new Error("No workspace folder open")
			}
			return path.join(workspaceFolders[0].uri.fsPath, ".agent", "skills")
		} else {
			return path.join(this.context.globalStorageUri.fsPath, "skills")
		}
	}

	/**
	 * 检查 Skill 是否存在
	 */
	private async skillExists(skillPath: string): Promise<boolean> {
		try {
			await fs.access(skillPath)
			return true
		} catch {
			return false
		}
	}
}
```

#### 3. SimpleInstaller 扩展（src/services/marketplace/SimpleInstaller.ts）

```typescript
// 在 SimpleInstaller 类中添加

private async installSkill(
    item: MarketplaceItem,
    target: 'project' | 'global',
    options?: InstallOptions
): Promise<{ filePath: string; line?: number }> {
    if (item.type !== 'skill') {
        throw new Error('Item is not a skill')
    }

    const skillsInstaller = new SkillsInstaller(this.context)

    // 从 repository URL 提取 skill ID
    const skillId = this.extractSkillId(item.repository)

    // 安装 Skill
    const result = await skillsInstaller.installSkill(
        item.repository,
        skillId,
        { target: target === 'project' ? 'project' : 'personal' }
    )

    // 返回 SKILL.md 文件路径
    const skillFilePath = path.join(result.skillPath, 'SKILL.md')

    return { filePath: skillFilePath }
}

private extractSkillId(repositoryUrl: string): string {
    // 从 Git URL 提取 skill ID
    // https://github.com/wordflowlab/skill-romance-writing
    // → romance-writing
    const match = repositoryUrl.match(/\/skill-([^\/]+?)(?:\.git)?$/)
    return match ? match[1] : path.basename(repositoryUrl, '.git')
}
```

#### 4. ClineProvider 集成（src/core/webview/ClineProvider.ts）

```typescript
// 在 ClineProvider 类中添加

/**
 * 获取 Skills 市场数据
 */
async fetchSkillsMarketplace(forceRefresh: boolean = false): Promise<void> {
    try {
        const marketplaceManager = MarketplaceManager.getInstance(this.context)

        // 加载 Skills 市场数据
        const skills = await marketplaceManager.updateWithFilteredItems({
            type: 'skill'
        })

        // 发送到 WebView
        await this.postMessageToWebview({
            type: 'skillsMarketplaceData',
            skills
        })
    } catch (error) {
        console.error('[fetchSkillsMarketplace] Error:', error)
        vscode.window.showErrorMessage(
            `Failed to fetch skills marketplace: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

/**
 * 从市场安装 Skill
 */
async installSkillFromMarketplace(
    skillId: string,
    target: 'project' | 'personal' = 'project'
): Promise<void> {
    try {
        const marketplaceManager = MarketplaceManager.getInstance(this.context)

        // 查找 Skill
        const allItems = await marketplaceManager.updateWithFilteredItems({
            type: 'skill'
        })

        const skillItem = allItems.find(item => item.id === skillId)

        if (!skillItem || skillItem.type !== 'skill') {
            throw new Error(`Skill not found: ${skillId}`)
        }

        // 显示安装进度
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Installing skill: ${skillItem.name}`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Cloning repository...' })

            // 安装
            const result = await marketplaceManager.installMarketplaceItem(
                skillItem,
                { target }
            )

            progress.report({ increment: 100, message: 'Done!' })

            // 刷新 Skills Manager
            await this.skillsManager?.scanSkills()

            // 通知 WebView
            await this.postMessageToWebview({
                type: 'skillInstalled',
                skillId,
                target
            })
        })

        vscode.window.showInformationMessage(
            `Skill "${skillItem.name}" installed successfully!`,
            'View Skill'
        ).then(selection => {
            if (selection === 'View Skill') {
                vscode.commands.executeCommand('novelweave.skills.view', skillId)
            }
        })
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to install skill: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

/**
 * 检查 Skill 更新
 */
async checkSkillUpdates(): Promise<void> {
    // TODO: 实现更新检测逻辑
}
```

---

## 📦 Skills Registry 设计

### GitHub 仓库结构

```
novelweave-skills-registry/
├── README.md                          # 仓库说明
├── CONTRIBUTING.md                    # 贡献指南
├── registry.json                      # 主索引文件（核心）
├── .github/
│   └── workflows/
│       ├── validate-skill.yml         # 验证 PR 的 Skill 格式
│       └── update-stats.yml           # 更新下载统计
├── skills/                            # Skills 列表（可选，用于展示）
│   ├── romance-writing.md
│   ├── fantasy-worldbuilding.md
│   └── ...
└── assets/                            # 资源文件
    └── previews/
        ├── romance-writing.png
        └── fantasy-worldbuilding.png
```

### registry.json 格式

```json
{
	"version": "1.0.0",
	"lastUpdated": "2025-10-20T10:00:00Z",
	"skills": [
		{
			"id": "romance-writing",
			"type": "skill",
			"name": "Romance Novel Conventions",
			"description": "Complete guide for romance writing with genre conventions, pacing guidelines, and emotional beats.",
			"author": "WordFlow Lab",
			"authorUrl": "https://github.com/wordflowlab",
			"repository": "https://github.com/wordflowlab/skill-romance-writing",
			"category": "genre-knowledge",
			"keywords": ["romance", "love", "relationship", "言情", "爱情"],
			"version": "1.2.0",
			"downloads": 1523,
			"rating": 4.8,
			"verified": true,
			"lastUpdated": "2025-10-15T08:30:00Z",
			"previewImage": "https://raw.githubusercontent.com/wordflowlab/novelweave-skills-registry/main/assets/previews/romance-writing.png",
			"tags": ["writing", "genre", "romance"],
			"prerequisites": []
		},
		{
			"id": "fantasy-worldbuilding",
			"type": "skill",
			"name": "Fantasy World Building",
			"description": "Create consistent fantasy worlds with magic systems, geography, and cultures.",
			"author": "Community",
			"authorUrl": "https://github.com/fantasy-writers",
			"repository": "https://github.com/fantasy-writers/skill-fantasy-worldbuilding",
			"category": "genre-knowledge",
			"keywords": ["fantasy", "magic", "worldbuilding", "奇幻", "魔法"],
			"version": "2.1.0",
			"downloads": 892,
			"rating": 4.6,
			"verified": false,
			"lastUpdated": "2025-10-10T14:20:00Z",
			"tags": ["writing", "genre", "fantasy"],
			"prerequisites": []
		},
		{
			"id": "dialogue-techniques",
			"type": "skill",
			"name": "Natural Dialogue Writing",
			"description": "Techniques for writing authentic, engaging dialogue with subtext and character voice.",
			"author": "WordFlow Lab",
			"authorUrl": "https://github.com/wordflowlab",
			"repository": "https://github.com/wordflowlab/skill-dialogue-techniques",
			"category": "writing-techniques",
			"keywords": ["dialogue", "conversation", "character", "对话"],
			"version": "1.0.5",
			"downloads": 1245,
			"rating": 4.9,
			"verified": true,
			"lastUpdated": "2025-10-18T11:00:00Z",
			"tags": ["writing", "technique", "dialogue"],
			"prerequisites": []
		}
	]
}
```

### Skill 仓库结构

每个 Skill 在独立的 Git 仓库中：

```
skill-romance-writing/                 # 仓库根目录
├── README.md                          # GitHub 展示（可选）
├── SKILL.md                           # 主要内容（必需）
├── examples/                          # 示例（可选）
│   ├── good-example.md
│   └── bad-example.md
├── templates/                         # 模板（可选）
│   └── romance-scene-template.md
└── assets/                            # 资源（可选）
    └── preview.png
```

**SKILL.md 示例**：

```yaml
---
name: Romance Novel Conventions
description: Complete guide for romance writing with genre conventions, pacing guidelines, and emotional beats for crafting compelling love stories. Use when writing romance novels or developing romantic subplots.
keywords: [romance, love, relationship, couple, 言情, 爱情]
allowed_tool_groups: [read]
version: 1.2.0
when_to_use: "Writing romance novels, developing romantic subplots, or discussing relationship dynamics in fiction"
---

# Romance Novel Conventions

## Core Elements

### The Central Love Story
- The romance must be the main plot
- End with emotional satisfaction (HEA/HFN)
- Focus on the relationship journey

### Character Chemistry
- Show attraction through action, not just thoughts
- Create believable obstacles
- Develop authentic emotional connection

## Pacing Guidelines

### Act 1: Meeting
- Compelling first encounter
- Immediate attraction or conflict
- Establish stakes

### Act 2: Development
- Forced proximity or collaboration
- Escalating emotional intimacy
- External and internal obstacles

### Act 3: Resolution
- Black moment / Dark night
- Grand gesture or revelation
- Satisfying emotional resolution

## Common Pitfalls to Avoid

- ❌ Insta-love without foundation
- ❌ Manufactured misunderstandings
- ❌ Passive protagonists
- ❌ Lack of chemistry

## Genre-Specific Considerations

### Contemporary Romance
- Modern relationship dynamics
- Realistic conflicts
- Current social issues

### Historical Romance
- Period-accurate courtship
- Social restrictions as conflict
- Historical research required

### Paranormal Romance
- Unique species/magic rules
- Balance romance and world-building
- Supernatural obstacles

## Integration with NovelWeave

### With Novel Commands
- `/constitution`: Define your romance values (HEA vs HFN)
- `/specify`: Include relationship arc in specification
- `/plan`: Map emotional beats to chapters

### With Knowledge Base
- Reference `character-profiles.md` for consistency
- Track relationship development in `relationships.json`

---

_Version 1.2.0 - Updated 2025-10-15_
```

### 社区贡献流程

```
┌─────────────────────────────────────────────────────────┐
│ 1. 创建 Skill 仓库                                       │
│    - 在 GitHub 创建新仓库                                │
│    - 命名规范：skill-{skill-name}                        │
│    - 添加 SKILL.md                                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. 提交到 Registry                                       │
│    - Fork novelweave-skills-registry                     │
│    - 在 registry.json 中添加条目                         │
│    - 提交 Pull Request                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. 自动验证                                              │
│    - GitHub Actions 运行验证脚本                         │
│    - 检查 SKILL.md 格式                                  │
│    - 验证 Git 仓库可访问                                 │
│    - 检查 JSON 格式正确                                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. 人工审核                                              │
│    - WordFlow Lab 团队审核                               │
│    - 检查内容质量                                        │
│    - 验证无恶意代码                                      │
│    - 批准或请求修改                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. 合并发布                                              │
│    - PR 合并到 main 分支                                 │
│    - 自动更新 lastUpdated                                │
│    - Skill 立即在市场中可用                              │
└─────────────────────────────────────────────────────────┘
```

### GitHub Actions 验证脚本

**.github/workflows/validate-skill.yml**：

```yaml
name: Validate Skill PR

on:
    pull_request:
        paths:
            - "registry.json"

jobs:
    validate:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "18"

            - name: Install dependencies
              run: npm install zod gray-matter

            - name: Validate registry.json
              run: node scripts/validate-registry.js

            - name: Check new skills
              run: node scripts/check-new-skills.js

            - name: Validate SKILL.md format
              run: node scripts/validate-skill-format.js

            - name: Comment PR
              uses: actions/github-script@v6
              with:
                  script: |
                      github.rest.issues.createComment({
                        issue_number: context.issue.number,
                        owner: context.repo.owner,
                        repo: context.repo.repo,
                        body: '✅ Validation passed! Ready for review.'
                      })
```

---

## 📋 功能需求

### FR-1: Skills 市场浏览（P0）

#### FR-1.1: 市场数据加载

**需求**：从 GitHub Registry 加载 Skills 列表

**实现**：

- 使用 `RemoteConfigLoader` 加载 `registry.json`
- 缓存数据到本地（避免重复请求）
- 支持强制刷新

**API**：

```typescript
await clineProvider.fetchSkillsMarketplace((forceRefresh = false))
```

#### FR-1.2: Skills 卡片展示

**需求**：卡片式展示 Skills，类似 MCP 市场

**UI 元素**：

- Skill 名称
- 作者和评分
- 描述（截断）
- 类别标签
- 下载次数
- "已安装"标识
- "安装"按钮

**组件**：`SkillMarketplaceCard.tsx`

#### FR-1.3: 搜索和过滤

**需求**：支持搜索和多维度过滤

**过滤维度**：

- 按名称搜索
- 按类别过滤（genre-knowledge、writing-techniques 等）
- 按关键词过滤
- 按验证状态过滤（官方认证）
- 按评分排序

**UI**：

- 搜索框
- 类别下拉菜单
- 排序选项

### FR-2: Skills 安装（P0）

#### FR-2.1: 一键安装

**需求**：点击按钮即可安装 Skill

**流程**：

```
点击"安装"按钮
  ↓
显示安装选项 Modal
  - 安装到项目 (.agent/skills/)
  - 安装到个人 (globalStorage/skills/)
  ↓
用户选择 → 开始安装
  ↓
显示进度通知
  - "Cloning repository..."
  - "Validating SKILL.md..."
  - "Done!"
  ↓
安装成功
  - 刷新 SkillsManager
  - 更新 UI（显示"已安装"）
  - 显示成功提示
```

#### FR-2.2: 安装验证

**需求**：安装后验证 SKILL.md 格式

**验证项**：

- ✅ SKILL.md 文件存在
- ✅ YAML frontmatter 格式正确
- ✅ 必需字段存在（name、description）
- ✅ 版本号格式正确

**错误处理**：

- 如果验证失败 → 删除已安装文件
- 显示详细错误信息
- 提示用户联系 Skill 作者

#### FR-2.3: 已安装检测

**需求**：显示哪些 Skills 已安装

**实现**：

```typescript
// 检查 Skill 是否已安装
function isSkillInstalled(skillId: string): boolean {
	const projectPath = `.agent/skills/${skillId}`
	const personalPath = `globalStorage/skills/${skillId}`

	return existsSync(projectPath) || existsSync(personalPath)
}
```

**UI**：

- 已安装 → 显示"已安装"标识
- 已安装 → 按钮变为"更新"或"重新安装"

### FR-3: Skills 更新（P1）

#### FR-3.1: 检测更新

**需求**：检测已安装 Skills 是否有更新

**实现**：

```typescript
// 检查 Skill 是否有更新
async function checkSkillUpdate(skillPath: string): Promise<boolean> {
	// Git fetch
	await execAsync("git fetch", { cwd: skillPath })

	// 检查 commits
	const { stdout } = await execAsync("git rev-list HEAD...origin/main --count", { cwd: skillPath })

	return parseInt(stdout) > 0
}
```

**UI**：

- 在 Skills 面板中显示"有更新"标识
- 提供"更新"按钮

#### FR-3.2: 一键更新

**需求**：点击按钮更新 Skill

**流程**：

```
点击"更新"按钮
  ↓
Git pull
  ↓
显示更新内容（可选）
  ↓
刷新 SkillsManager
  ↓
显示成功提示
```

#### FR-3.3: 批量更新

**需求**：一次更新所有有更新的 Skills

**UI**：

- 在 Skills 面板顶部显示"全部更新"按钮
- 显示有多少个 Skills 有更新

### FR-4: Skills 详情（P1）

#### FR-4.1: 详情模态框

**需求**：点击 Skill 卡片显示详情

**显示内容**：

- SKILL.md 完整内容（Markdown 渲染）
- 作者信息和 GitHub 链接
- 版本历史
- 下载统计
- 评分和评论（未来）
- 安装按钮

#### FR-4.2: 预览功能

**需求**：安装前预览 SKILL.md 内容

**实现**：

- 从 GitHub Raw URL 获取 SKILL.md
- 在 WebView 中渲染 Markdown
- 不下载整个仓库

### FR-5: WebView UI 集成（P0）

#### FR-5.1: Skills 标签页

**需求**：在设置面板中添加 Skills 标签

**位置**：Settings → Skills（类似 MCP 标签）

**子标签**：

- **已安装**：显示已安装的 Skills
- **市场**：浏览和安装 Skills

#### FR-5.2: 已安装 Skills 管理

**功能**：

- 列出所有已安装 Skills
- 按来源分组（项目/个人/初始化）
- 显示更新状态
- 提供更新/卸载按钮

---

## 📅 实现计划

### Phase 1: 类型系统和基础设施（Week 1）

#### Sprint 1.1: 类型定义（2 days）

**任务**：

- [ ] 扩展 `packages/types/src/marketplace.ts`
- [ ] 添加 `SkillMarketplaceItem` schema
- [ ] 添加到 `MarketplaceItem` 联合类型
- [ ] 更新 TypeScript 类型导出

**交付物**：

- ✅ 类型定义完成
- ✅ 通过类型检查

#### Sprint 1.2: SkillsInstaller 实现（3 days）

**任务**：

- [ ] 创建 `SkillsInstaller` 类
- [ ] 实现 `installSkill()` 方法
- [ ] 实现 `updateSkill()` 方法
- [ ] 实现 `validateSkill()` 方法
- [ ] 单元测试

**交付物**：

- ✅ `src/services/skills/SkillsInstaller.ts`
- ✅ 测试用例

#### Sprint 1.3: SimpleInstaller 集成（2 days）

**任务**：

- [ ] 在 `SimpleInstaller` 添加 `installSkill()` 方法
- [ ] 集成 `SkillsInstaller`
- [ ] 处理错误情况
- [ ] 测试

**交付物**：

- ✅ `SimpleInstaller.installSkill()` 实现

### Phase 2: Provider 集成（Week 2）

#### Sprint 2.1: ClineProvider 方法（3 days）

**任务**：

- [ ] 添加 `fetchSkillsMarketplace()` 方法
- [ ] 添加 `installSkillFromMarketplace()` 方法
- [ ] 添加 `checkSkillUpdates()` 方法
- [ ] 消息处理逻辑

**交付物**：

- ✅ `ClineProvider` 扩展完成

#### Sprint 2.2: MarketplaceManager 支持（2 days）

**任务**：

- [ ] 确保 `MarketplaceManager` 支持 `type: "skill"`
- [ ] 测试过滤功能
- [ ] 测试安装流程

**交付物**：

- ✅ Skills 类型完全支持

### Phase 3: WebView UI（Week 3）

#### Sprint 3.1: Skills 市场组件（4 days）

**任务**：

- [ ] 创建 `SkillsMarketplace.tsx`
- [ ] 创建 `SkillMarketplaceCard.tsx`
- [ ] 创建 `SkillInstallModal.tsx`
- [ ] 样式和布局

**交付物**：

- ✅ Skills 市场 UI 组件

#### Sprint 3.2: 已安装 Skills 管理（3 days）

**任务**：

- [ ] 创建 `InstalledSkills.tsx`
- [ ] 列表和分组
- [ ] 更新/卸载功能
- [ ] UI 集成

**交付物**：

- ✅ 已安装 Skills 管理 UI

### Phase 4: Skills Registry 和文档（Week 4）

#### Sprint 4.1: Registry 仓库创建（2 days）

**任务**：

- [ ] 创建 `novelweave-skills-registry` GitHub 仓库
- [ ] 创建 `registry.json` 初始版本
- [ ] 添加官方 Skills（3-5 个）
- [ ] README 和 CONTRIBUTING

**交付物**：

- ✅ Registry 仓库上线

#### Sprint 4.2: GitHub Actions（2 days）

**任务**：

- [ ] 创建验证工作流
- [ ] 创建统计更新工作流
- [ ] 测试 PR 流程

**交付物**：

- ✅ 自动化验证流程

#### Sprint 4.3: 文档和测试（3 days）

**任务**：

- [ ] 用户文档
- [ ] 开发者文档
- [ ] Skills 编写指南
- [ ] E2E 测试

**交付物**：

- ✅ 完整文档
- ✅ 测试覆盖

---

## 🎨 用户体验流程

### 场景 1：首次浏览 Skills 市场

```
1. 用户打开 NovelWeave 设置
   ↓
2. 点击"Skills"标签
   ↓
3. 看到两个子标签：
   - 已安装（0 个）
   - 市场
   ↓
4. 点击"市场"标签
   ↓
5. 显示加载中...
   ↓
6. Skills 卡片展示：
   ┌─────────────────────────────────────┐
   │ 📖 Romance Novel Conventions        │
   │ by WordFlow Lab ⭐ 4.8              │
   │                                     │
   │ Complete guide for romance writing  │
   │ with genre conventions...           │
   │                                     │
   │ 📥 1,523 downloads                  │
   │ 🏷️ genre-knowledge                 │
   │                                     │
   │ [安装]                              │
   └─────────────────────────────────────┘

   ┌─────────────────────────────────────┐
   │ 🧙 Fantasy World Building           │
   │ by Community ⭐ 4.6                 │
   │                                     │
   │ Create consistent fantasy worlds... │
   │                                     │
   │ 📥 892 downloads                    │
   │ 🏷️ genre-knowledge                 │
   │                                     │
   │ [安装]                              │
   └─────────────────────────────────────┘
```

### 场景 2：搜索和安装 Skill

```
1. 用户在搜索框输入："对话"
   ↓
2. 过滤结果，显示相关 Skills：
   - Natural Dialogue Writing
   - Character Voice Development
   ↓
3. 点击"Natural Dialogue Writing"卡片
   ↓
4. 显示详情模态框：
   ┌─────────────────────────────────────┐
   │ Natural Dialogue Writing             │
   │ by WordFlow Lab                      │
   │                                      │
   │ [关闭]                    [安装]     │
   ├─────────────────────────────────────┤
   │                                      │
   │ ## Dialogue Techniques               │
   │                                      │
   │ ### Writing Authentic Dialogue       │
   │ - Use subtext                        │
   │ - Vary speech patterns               │
   │ - ...                                │
   │                                      │
   │ （完整 SKILL.md 内容）               │
   │                                      │
   └─────────────────────────────────────┘
   ↓
5. 点击"安装"按钮
   ↓
6. 显示安装选项：
   ┌─────────────────────────────────────┐
   │ 安装到哪里？                         │
   │                                      │
   │ ○ 项目 (.agent/skills/)             │
   │   整个团队共享                       │
   │                                      │
   │ ○ 个人 (全局)                       │
   │   仅我使用                           │
   │                                      │
   │ [取消]                    [安装]     │
   └─────────────────────────────────────┘
   ↓
7. 选择"项目" → 点击"安装"
   ↓
8. 显示进度通知：
   "Installing skill: Natural Dialogue Writing..."
   "Cloning repository..."
   "Done!"
   ↓
9. 安装成功提示：
   "Skill 'Natural Dialogue Writing' installed successfully!"
   [View Skill]
   ↓
10. Skills 市场卡片更新：
    - "安装"按钮 → "已安装"标识
    - 可以点击"重新安装"或"更新"
```

### 场景 3：检查和更新 Skills

```
1. 用户打开"已安装"标签
   ↓
2. 看到已安装的 Skills 列表：

   📁 项目 Skills (2)
   ├─ Romance Novel Conventions
   │  v1.2.0 | 有更新 → v1.3.0
   │  [更新] [卸载]
   │
   └─ Natural Dialogue Writing
      v1.0.5 | 最新
      [卸载]

   📁 个人 Skills (0)
   ↓
3. 点击"Romance Novel Conventions"的"更新"按钮
   ↓
4. 显示更新进度：
   "Updating skill..."
   "Pulling latest changes..."
   "Done!"
   ↓
5. 更新成功：
   "Skill updated to v1.3.0"
   ↓
6. 列表更新：
   ├─ Romance Novel Conventions
   │  v1.3.0 | 最新  ← 更新
   │  [卸载]
```

### 场景 4：团队协作使用

```
【开发者 A】
1. 从 Skills 市场安装"Romance Novel Conventions"到项目
   ↓
2. 文件结构：
   .agent/
   └── skills/
       └── romance-writing/
           ├── SKILL.md
           ├── .git/
           └── .git-remote
   ↓
3. 提交到 Git：
   $ git add .agent/skills/romance-writing/
   $ git commit -m "Add romance writing skill"
   $ git push

【开发者 B】
1. Pull 最新代码
   $ git pull
   ↓
2. 打开 NovelWeave
   ↓
3. SkillsManager 自动扫描到新 Skill
   ↓
4. 在"已安装"标签中看到：

   📁 项目 Skills (1)
   └─ Romance Novel Conventions
      v1.2.0 | 来自市场
      [更新] [卸载]
   ↓
5. 可以正常使用，也可以检查更新
```

---

## 📊 与 MCP 市场对比

| 特性             | MCP 市场     | Skills 市场  | 状态                |
| ---------------- | ------------ | ------------ | ------------------- |
| **浏览市场**     | ✅           | ✅           | 复用 UI 组件        |
| **搜索过滤**     | ✅           | ✅           | 复用逻辑            |
| **一键安装**     | ✅           | ✅           | 新实现（Git clone） |
| **安装位置选择** | ✅ 项目/全局 | ✅ 项目/个人 | 相同模式            |
| **已安装标识**   | ✅           | ✅           | 复用逻辑            |
| **详情展示**     | ✅ README    | ✅ SKILL.md  | 新组件              |
| **更新检测**     | ❌           | ✅           | 新功能              |
| **版本管理**     | ❌ 配置更新  | ✅ Git tags  | 更强大              |
| **卸载**         | ✅ 删除配置  | ✅ 删除目录  | 相同模式            |

---

## 🔒 安全考虑

### 1. Git 仓库安全

**风险**：恶意仓库可能包含危险代码

**缓解措施**：

- ✅ Skills 只是文本文件（SKILL.md），不执行代码
- ✅ 人工审核 PR（WordFlow Lab 团队）
- ✅ 官方认证标识（verified: true）
- ✅ 社区评分和反馈

### 2. Git clone 安全

**风险**：Git clone 可能执行 hooks

**缓解措施**：

- ✅ 使用 `--depth 1`（浅克隆）
- ✅ 使用 `--filter=blob:none --sparse`（稀疏检出）
- ✅ 禁用 Git hooks：`git config core.hooksPath /dev/null`

### 3. 内容验证

**风险**：恶意 SKILL.md 可能包含有害提示

**缓解措施**：

- ✅ 格式验证（YAML + Markdown）
- ✅ 内容审核（人工）
- ✅ 社区举报机制（未来）

---

## 📚 附录

### A. registry.json Schema

```typescript
import { z } from "zod"

export const registrySchema = z.object({
	version: z.string(),
	lastUpdated: z.string().datetime(),
	skills: z.array(skillMarketplaceItemSchema),
})

export type SkillsRegistry = z.infer<typeof registrySchema>
```

### B. Git 操作最佳实践

**推荐的 Git clone 命令**：

```bash
# 方案 1：稀疏检出（推荐）
git clone --depth 1 --filter=blob:none --sparse <repo-url> <target-path>
cd <target-path>
git sparse-checkout init --cone
git sparse-checkout set SKILL.md *.md examples/ templates/

# 方案 2：浅克隆（Fallback）
git clone --depth 1 <repo-url> <target-path>
```

**更新命令**：

```bash
git pull --rebase
```

### C. Skills 命名规范

**仓库命名**：

- 格式：`skill-{skill-name}`
- 示例：`skill-romance-writing`、`skill-fantasy-worldbuilding`

**Skill ID**：

- 格式：`{category}-{name}`
- 示例：`romance-writing`、`fantasy-worldbuilding`

**文件命名**：

- 主文件：`SKILL.md`（必需）
- 示例：`examples/good-example.md`
- 模板：`templates/scene-template.md`

### D. FAQ

**Q: Skills 市场与项目初始化的关系？**

**A**: 两者互补：

- **项目初始化**（v0.14.0）：首次使用时从内置模板复制
- **Skills 市场**（v0.15.0）：随时从社区安装额外 Skills

用户可以同时拥有初始化 Skills 和市场 Skills。

**Q: 如何区分市场 Skills 和自定义 Skills？**

**A**: 通过 `.git` 或 `.git-remote` 文件：

- 市场 Skills：有 `.git/` 或 `.git-remote` 文件
- 自定义 Skills：都没有

**Q: 更新会覆盖我的修改吗？**

**A**: 取决于安装方式：

- **市场 Skills**：`git pull` 会提示冲突，需要手动解决
- **初始化 Skills**：不会自动更新，完全由用户掌控
- **建议**：如果要修改市场 Skill，先删除 `.git/`，变成自定义 Skill

**Q: 可以提交私有 Skills 吗？**

**A**: Registry 只支持公开仓库，但可以：

- 在团队内部创建私有 Registry
- 手动安装私有 Skill（提供 Git URL）

---

## ✅ 验收标准

### 核心功能

- [ ] ✅ 可以浏览 Skills 市场
- [ ] ✅ 可以搜索和过滤 Skills
- [ ] ✅ 可以查看 Skill 详情
- [ ] ✅ 可以一键安装到项目/个人
- [ ] ✅ 可以检测和更新 Skills
- [ ] ✅ 可以卸载 Skills

### UI/UX

- [ ] ✅ Skills 标签页集成到设置面板
- [ ] ✅ 市场 UI 与 MCP 市场一致
- [ ] ✅ 已安装 Skills 管理界面完整
- [ ] ✅ 加载和错误状态处理

### Registry

- [ ] ✅ GitHub Registry 仓库创建
- [ ] ✅ registry.json 格式正确
- [ ] ✅ 至少 3 个官方 Skills
- [ ] ✅ 自动验证流程工作

### 文档

- [ ] ✅ PRD v0.15.0 完整
- [ ] ✅ 用户使用指南
- [ ] ✅ Skills 编写指南
- [ ] ✅ 社区贡献指南

---

## 📝 总结

v0.15.0 Skills 市场功能通过学习 NovelWeave 成功的 MCP 市场经验，为用户提供：

1. ✅ **便捷的 Skills 发现**：浏览、搜索、过滤
2. ✅ **一键安装体验**：简单快速，无需手动操作
3. ✅ **完善的更新管理**：检测更新、一键更新
4. ✅ **社区生态建设**：任何人都可以贡献 Skills
5. ✅ **安全可靠**：验证、审核、评分机制

**与 v0.14.0 的配合**：

- v0.14.0 提供项目初始化（内置 Skills）
- v0.15.0 提供市场安装（社区 Skills）
- 两者结合，提供完整的 Skills 生态

这是一个**完善的、可持续的、社区驱动的** Skills 管理方案。

---

**文档结束**

_本 PRD 基于 NovelWeave MCP 市场的成功经验设计_  
_参考：MarketplaceManager、SimpleInstaller、MCP 市场 UI_  
_如有疑问，请联系: WordFlow Lab Team_
