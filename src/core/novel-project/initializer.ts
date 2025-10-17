/**
 * 小说项目初始化器
 * 创建新的小说项目结构
 */

import * as path from "path"
import * as fs from "fs/promises"
import { NovelProjectConfig } from "./types"

export interface InitializeOptions {
	name: string
	rootPath: string
	aiModel?: string
	includeScripts?: boolean
}

export class ProjectInitializer {
	/**
	 * 初始化小说项目
	 */
	static async initializeProject(options: InitializeOptions): Promise<void> {
		const { name, rootPath, aiModel, includeScripts = false } = options

		// 创建基础目录结构
		await this.createDirectoryStructure(rootPath, includeScripts)

		// 创建配置文件
		await this.createConfigFile(rootPath, name, aiModel)

		// 创建初始文件
		await this.createInitialFiles(rootPath, name)

		// 创建追踪文件模板
		await this.createTrackingTemplates(rootPath)

		// 创建知识库模板
		await this.createKnowledgeBaseTemplates(rootPath)
	}

	/**
	 * 创建目录结构
	 */
	private static async createDirectoryStructure(rootPath: string, includeScripts: boolean): Promise<void> {
		const directories = [
			".novelweave",
			".novelweave/memory",
			"spec",
			"spec/tracking",
			"spec/presets",
			"spec/knowledge",
			"stories",
		]

		if (includeScripts) {
			directories.push(".novelweave/scripts", ".novelweave/scripts/bash", ".novelweave/scripts/powershell")
		}

		for (const dir of directories) {
			const dirPath = path.join(rootPath, dir)
			await fs.mkdir(dirPath, { recursive: true })
		}
	}

	/**
	 * 创建配置文件
	 */
	private static async createConfigFile(rootPath: string, name: string, aiModel?: string): Promise<void> {
		const config: NovelProjectConfig = {
			name,
			type: "novel",
			version: "1.0.0",
			created: new Date().toISOString(),
			format: "novelweave",
			aiModel: aiModel || "claude-sonnet-4",
			methods: ["seven-step"],
			features: {
				tracking: true,
				knowledgeBase: true,
				slashCommands: true,
			},
		}

		const configPath = path.join(rootPath, ".novelweave", "config.json")
		await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8")
	}

	/**
	 * 创建初始文件
	 */
	private static async createInitialFiles(rootPath: string, name: string): Promise<void> {
		// 创建 constitution 模板
		const constitutionPath = path.join(rootPath, ".novelweave", "memory", "constitution.md")
		const constitutionContent = `# ${name} - 创作宪法

## 版本
- 版本号：1.0.0
- 创建日期：${new Date().toISOString().split("T")[0]}
- 最后修订：${new Date().toISOString().split("T")[0]}

## 核心价值观

### 原则 1：[填写你的核心原则]
**声明**：
**理由**：
**执行**：

## 质量标准

### 标准 1：逻辑一致性
**要求**：
**验证方法**：
**违反后果**：

## 创作风格

### 风格原则 1：
**定义**：
**范例**：
**禁忌**：

## 内容规范

### 角色塑造规范
- 每个角色必须有完整的动机链
- 角色成长必须符合逻辑
- 对话必须符合角色身份

### 情节设计规范
- 冲突设计必须合理
- 转折必须有伏笔
- 伏笔必须得到回收

## 读者契约

### 对读者的承诺
- [承诺 1]
- [承诺 2]

### 底线保证
- [保证 1]
- [保证 2]
`

		await fs.writeFile(constitutionPath, constitutionContent, "utf-8")

		// 创建 personal-voice 模板
		const voicePath = path.join(rootPath, ".novelweave", "memory", "personal-voice.md")
		const voiceContent = `# 个人写作风格

## 语言特色
- 

## 常用表达
- 

## 避免使用
- 

## 节奏偏好
- 
`

		await fs.writeFile(voicePath, voiceContent, "utf-8")

		// 创建 README
		const readmePath = path.join(rootPath, "README.md")
		const readmeContent = `# ${name}

一个使用 NovelWeave 创建的小说项目。

## 项目结构

- \`.novelweave/\` - 项目配置和记忆文件
- \`spec/\` - 追踪数据和写作规范
- \`stories/\` - 小说章节内容

## 开始创作

1. 使用 \`/constitution\` 命令定义你的创作宪法
2. 使用 \`/specify\` 命令定义故事规格
3. 按照七步方法论逐步创作

## 七步方法论

1. \`/constitution\` - 创作宪法
2. \`/specify\` - 故事规格
3. \`/clarify\` - 澄清决策
4. \`/plan\` - 创作计划
5. \`/tasks\` - 任务分解
6. \`/write\` - 章节写作
7. \`/analyze\` - 质量验证
`

		await fs.writeFile(readmePath, readmeContent, "utf-8")
	}

	/**
	 * 创建追踪文件模板
	 */
	private static async createTrackingTemplates(rootPath: string): Promise<void> {
		// 角色追踪
		const charactersPath = path.join(rootPath, "spec", "tracking", "characters.json")
		const charactersTemplate = {
			version: "1.0.0",
			lastUpdated: new Date().toISOString(),
			characters: [],
		}
		await fs.writeFile(charactersPath, JSON.stringify(charactersTemplate, null, 2), "utf-8")

		// 情节追踪
		const plotPath = path.join(rootPath, "spec", "tracking", "plot-tracker.json")
		const plotTemplate = {
			version: "1.0.0",
			lastUpdated: new Date().toISOString(),
			plotLines: [],
			conflicts: [],
			foreshadowing: [],
		}
		await fs.writeFile(plotPath, JSON.stringify(plotTemplate, null, 2), "utf-8")

		// 时间线追踪
		const timelinePath = path.join(rootPath, "spec", "tracking", "timeline.json")
		const timelineTemplate = {
			version: "1.0.0",
			lastUpdated: new Date().toISOString(),
			events: [],
		}
		await fs.writeFile(timelinePath, JSON.stringify(timelineTemplate, null, 2), "utf-8")
	}

	/**
	 * 创建知识库模板
	 */
	private static async createKnowledgeBaseTemplates(rootPath: string): Promise<void> {
		// 这里将在后续步骤中从 novel-writer 复制规范库文件
		// 目前先创建空的占位文件

		const presetsPath = path.join(rootPath, "spec", "presets", ".gitkeep")
		await fs.writeFile(presetsPath, "", "utf-8")

		const knowledgePath = path.join(rootPath, "spec", "knowledge", ".gitkeep")
		await fs.writeFile(knowledgePath, "", "utf-8")
	}
}
