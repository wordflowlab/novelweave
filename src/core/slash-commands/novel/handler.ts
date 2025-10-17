/**
 * 小说创作命令处理器
 * 处理 novel-writer 的七步方法论命令
 */

import * as path from "path"
import * as fs from "fs/promises"
import { NovelCommandType, NovelCommandContext, NovelCommandResult } from "./types"

export class NovelCommandHandler {
	private templatesDir: string

	constructor(extensionPath: string) {
		this.templatesDir = path.join(extensionPath, "templates", "novel-commands")
	}

	/**
	 * 执行小说创作命令
	 */
	async executeCommand(
		commandType: NovelCommandType,
		context: NovelCommandContext,
		args?: string,
	): Promise<NovelCommandResult> {
		console.log(`Executing novel command: ${commandType}`)

		// 加载命令模板
		const templateContent = await this.loadCommandTemplate(commandType)
		if (!templateContent) {
			return {
				success: false,
				message: `Command template not found: ${commandType}`,
			}
		}

		// 解析命令参数
		const processedContent = await this.processCommandTemplate(templateContent, context, args)

		return {
			success: true,
			message: `Command ${commandType} executed successfully`,
			data: { templateContent: processedContent },
		}
	}

	/**
	 * 加载命令模板
	 */
	private async loadCommandTemplate(commandType: NovelCommandType): Promise<string | null> {
		const templatePath = path.join(this.templatesDir, `${commandType}.md`)

		try {
			const content = await fs.readFile(templatePath, "utf-8")
			return content
		} catch (error) {
			console.error(`Failed to load command template ${commandType}:`, error)
			return null
		}
	}

	/**
	 * 处理命令模板
	 */
	private async processCommandTemplate(
		template: string,
		context: NovelCommandContext,
		args?: string,
	): Promise<string> {
		// 替换模板中的变量
		let processed = template

		// 替换 $ARGUMENTS
		if (args) {
			processed = processed.replace(/\$ARGUMENTS/g, args)
		}

		// 替换 {SCRIPT} 占位符（如果有脚本路径）
		const scriptPath = this.getScriptPath(context.projectRoot)
		if (scriptPath) {
			processed = processed.replace(/{SCRIPT}/g, scriptPath)
		}

		return processed
	}

	/**
	 * 获取脚本路径
	 */
	private getScriptPath(projectRoot: string): string {
		// 根据操作系统返回对应的脚本路径
		if (process.platform === "win32") {
			return path.join(projectRoot, ".novelweave", "scripts", "powershell")
		} else {
			return path.join(projectRoot, ".novelweave", "scripts", "bash")
		}
	}

	/**
	 * 检查命令是否可用
	 */
	async isCommandAvailable(commandType: NovelCommandType): Promise<boolean> {
		const templatePath = path.join(this.templatesDir, `${commandType}.md`)
		try {
			await fs.access(templatePath)
			return true
		} catch {
			return false
		}
	}

	/**
	 * 获取所有可用命令
	 */
	async getAvailableCommands(): Promise<NovelCommandType[]> {
		const commands: NovelCommandType[] = [
			"constitution",
			"specify",
			"clarify",
			"plan",
			"tasks",
			"write",
			"analyze",
			"timeline",
			"relations",
			"track",
			"track-init",
		]

		const available: NovelCommandType[] = []
		for (const cmd of commands) {
			if (await this.isCommandAvailable(cmd)) {
				available.push(cmd)
			}
		}

		return available
	}

	/**
	 * 解析命令的 frontmatter
	 */
	async parseCommandMetadata(commandType: NovelCommandType): Promise<Record<string, any> | null> {
		const templateContent = await this.loadCommandTemplate(commandType)
		if (!templateContent) {
			return null
		}

		// 解析 YAML frontmatter
		const frontmatterMatch = templateContent.match(/^---\n([\s\S]+?)\n---/)
		if (!frontmatterMatch) {
			return null
		}

		try {
			// 简单的 YAML 解析（可以用 js-yaml 库替代）
			const frontmatter = frontmatterMatch[1]
			const metadata: Record<string, any> = {}

			const lines = frontmatter.split("\n")
			for (const line of lines) {
				const match = line.match(/^(\w+):\s*(.+)$/)
				if (match) {
					const key = match[1]
					let value: any = match[2].trim()

					// 处理数组
					if (value.startsWith("[") && value.endsWith("]")) {
						value = value
							.slice(1, -1)
							.split(",")
							.map((v: string) => v.trim())
					}

					metadata[key] = value
				}
			}

			return metadata
		} catch (error) {
			console.error("Failed to parse command metadata:", error)
			return null
		}
	}
}
