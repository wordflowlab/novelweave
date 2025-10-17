/**
 * 命令生成器
 * 将命令模板生成为不同 AI 平台的格式
 */

import * as path from "path"
import * as fs from "fs/promises"

export type AIPlatform = "claude" | "cursor" | "gemini" | "windsurf" | "roocode" | "copilot" | "qwen" | "kilocode"

export interface PlatformConfig {
	name: string
	dir: string
	commandsDir: string
	displayName: string
	format: "markdown" | "toml" | "yaml"
}

export const PLATFORM_CONFIGS: Record<AIPlatform, PlatformConfig> = {
	claude: { name: "claude", dir: ".claude", commandsDir: "commands", displayName: "Claude Code", format: "markdown" },
	cursor: { name: "cursor", dir: ".cursor", commandsDir: "commands", displayName: "Cursor", format: "markdown" },
	gemini: { name: "gemini", dir: ".gemini", commandsDir: "commands", displayName: "Gemini CLI", format: "toml" },
	windsurf: {
		name: "windsurf",
		dir: ".windsurf",
		commandsDir: "workflows",
		displayName: "Windsurf",
		format: "markdown",
	},
	roocode: {
		name: "roocode",
		dir: ".roo",
		commandsDir: "commands",
		displayName: "Roo Code",
		format: "markdown",
	},
	copilot: {
		name: "copilot",
		dir: ".github",
		commandsDir: "prompts",
		displayName: "GitHub Copilot",
		format: "markdown",
	},
	qwen: { name: "qwen", dir: ".qwen", commandsDir: "commands", displayName: "Qwen Code", format: "markdown" },
	kilocode: {
		name: "kilocode",
		dir: ".kilocode",
		commandsDir: "workflows",
		displayName: "Kilo Code",
		format: "markdown",
	},
}

export class CommandGenerator {
	private templatesDir: string
	private projectRoot: string

	constructor(templatesDir: string, projectRoot: string) {
		this.templatesDir = templatesDir
		this.projectRoot = projectRoot
	}

	/**
	 * 为指定平台生成命令
	 */
	async generateForPlatform(platform: AIPlatform): Promise<number> {
		const config = PLATFORM_CONFIGS[platform]
		const targetDir = path.join(this.projectRoot, config.dir, config.commandsDir)

		// 创建目标目录
		await fs.mkdir(targetDir, { recursive: true })

		// 获取所有命令模板
		const templates = await fs.readdir(this.templatesDir)
		let count = 0

		for (const template of templates) {
			if (template.endsWith(".md")) {
				const templatePath = path.join(this.templatesDir, template)
				const content = await fs.readFile(templatePath, "utf-8")

				// 根据平台格式生成
				if (config.format === "markdown") {
					// Markdown 格式直接复制
					const targetPath = path.join(targetDir, template)
					await fs.writeFile(targetPath, content, "utf-8")
				} else if (config.format === "toml") {
					// TOML 格式需要转换
					const tomlContent = this.convertToToml(content)
					const fileName = template.replace(".md", ".toml")
					const targetPath = path.join(targetDir, fileName)
					await fs.writeFile(targetPath, tomlContent, "utf-8")
				}

				count++
			}
		}

		return count
	}

	/**
	 * 为所有平台生成命令
	 */
	async generateForAllPlatforms(): Promise<Map<AIPlatform, number>> {
		const results = new Map<AIPlatform, number>()

		const platforms: AIPlatform[] = ["claude", "cursor", "gemini", "windsurf", "roocode", "kilocode"]

		for (const platform of platforms) {
			try {
				const count = await this.generateForPlatform(platform)
				results.set(platform, count)
			} catch (error) {
				console.error(`Failed to generate commands for ${platform}:`, error)
				results.set(platform, 0)
			}
		}

		return results
	}

	/**
	 * 将 Markdown 格式转换为 TOML 格式（Gemini CLI）
	 */
	private convertToToml(markdownContent: string): string {
		// 提取 YAML frontmatter
		const frontmatterMatch = markdownContent.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)/)
		if (!frontmatterMatch) {
			return markdownContent
		}

		const frontmatter = frontmatterMatch[1]
		const content = frontmatterMatch[2]

		// 提取 description
		const descMatch = frontmatter.match(/description:\s*(.+)/)
		const description = descMatch ? descMatch[1].trim() : "命令说明"

		// 移除 YAML frontmatter，只保留内容
		const normalizedContent = content.replace(/\r\n/g, "\n")
		const promptValue = JSON.stringify(normalizedContent)
		const escapedDescription = description.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

		return `description = "${escapedDescription}"

prompt = ${promptValue}
`
	}

	/**
	 * 获取支持的平台列表
	 */
	static getSupportedPlatforms(): AIPlatform[] {
		return Object.keys(PLATFORM_CONFIGS) as AIPlatform[]
	}

	/**
	 * 获取平台配置
	 */
	static getPlatformConfig(platform: AIPlatform): PlatformConfig {
		return PLATFORM_CONFIGS[platform]
	}
}
