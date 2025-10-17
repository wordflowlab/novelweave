/**
 * Built-in novel creation commands
 * 内置小说创作命令
 */

import { Command } from "./commands"
import * as path from "path"
import * as fs from "fs/promises"

/**
 * Novel command definition
 */
interface NovelCommandDefinition {
	name: string
	description: string
	argumentHint?: string
	templatePath: string
}

/**
 * Novel commands configuration
 */
const NOVEL_COMMANDS: Record<string, NovelCommandDefinition> = {
	constitution: {
		name: "constitution",
		description: "创建或更新小说创作宪法，定义不可妥协的创作原则",
		argumentHint: "[创作原则描述]",
		templatePath: "constitution.md",
	},
	specify: {
		name: "specify",
		description: "定义故事规格，像 PRD 一样明确要创造什么",
		argumentHint: "[故事描述]",
		templatePath: "specify.md",
	},
	clarify: {
		name: "clarify",
		description: "通过 AI 提问澄清关键决策点，消除模糊性",
		templatePath: "clarify.md",
	},
	plan: {
		name: "plan",
		description: "制定创作计划，将规格转化为技术方案",
		templatePath: "plan.md",
	},
	tasks: {
		name: "tasks",
		description: "分解执行任务，生成可操作的任务清单",
		templatePath: "tasks.md",
	},
	write: {
		name: "write",
		description: "基于任务清单执行章节写作，自动加载上下文和验证规则",
		argumentHint: "[章节编号或任务ID]",
		templatePath: "write.md",
	},
	analyze: {
		name: "analyze",
		description: "综合验证作品质量和一致性",
		templatePath: "analyze.md",
	},
	timeline: {
		name: "timeline",
		description: "管理故事时间线，确保时序一致",
		argumentHint: "[时间线操作]",
		templatePath: "timeline.md",
	},
	relations: {
		name: "relations",
		description: "追踪角色关系变化和发展",
		argumentHint: "[关系描述]",
		templatePath: "relations.md",
	},
	track: {
		name: "track",
		description: "综合追踪与智能分析",
		templatePath: "track.md",
	},
	"track-init": {
		name: "track-init",
		description: "初始化追踪系统",
		templatePath: "track-init.md",
	},
}

/**
 * Get templates directory path
 */
function getTemplatesDirectory(extensionPath: string): string {
	return path.join(extensionPath, "templates", "novel-commands")
}

/**
 * Load novel command template content
 */
async function loadNovelCommandTemplate(extensionPath: string, templateFileName: string): Promise<string | null> {
	const templatesDir = getTemplatesDirectory(extensionPath)
	const templatePath = path.join(templatesDir, templateFileName)

	try {
		const content = await fs.readFile(templatePath, "utf-8")
		return content
	} catch (error) {
		console.error(`Failed to load novel command template ${templateFileName}:`, error)
		return null
	}
}

/**
 * Get all built-in novel commands as Command objects
 */
export async function getBuiltInNovelCommands(extensionPath: string): Promise<Command[]> {
	const commands: Command[] = []

	for (const cmdDef of Object.values(NOVEL_COMMANDS)) {
		const content = await loadNovelCommandTemplate(extensionPath, cmdDef.templatePath)
		if (content) {
			commands.push({
				name: cmdDef.name,
				content,
				source: "built-in" as const,
				filePath: `<built-in-novel:${cmdDef.name}>`,
				description: cmdDef.description,
				argumentHint: cmdDef.argumentHint,
			})
		}
	}

	return commands
}

/**
 * Get a specific built-in novel command by name
 */
export async function getBuiltInNovelCommand(extensionPath: string, name: string): Promise<Command | undefined> {
	const cmdDef = NOVEL_COMMANDS[name]
	if (!cmdDef) return undefined

	const content = await loadNovelCommandTemplate(extensionPath, cmdDef.templatePath)
	if (!content) return undefined

	return {
		name: cmdDef.name,
		content,
		source: "built-in" as const,
		filePath: `<built-in-novel:${name}>`,
		description: cmdDef.description,
		argumentHint: cmdDef.argumentHint,
	}
}

/**
 * Get names of all built-in novel commands
 */
export function getBuiltInNovelCommandNames(): string[] {
	return Object.keys(NOVEL_COMMANDS)
}

/**
 * Check if a command is a novel command
 */
export function isNovelCommand(commandName: string): boolean {
	return commandName in NOVEL_COMMANDS
}
