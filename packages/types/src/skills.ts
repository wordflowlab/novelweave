/**
 * Agent Skills 类型定义
 * 这些类型在 extension 和 webview 之间共享
 */

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
	allowedToolGroups?: string[]
	keywords?: string[]
	version?: string
	whenToUse?: string

	// Content loaded on demand
	content?: string
	supportFiles?: string[]

	// Integration fields
	mcpResources?: string[]
	requiredModes?: string[]
}

/**
 * Skills 配置
 */
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

/**
 * Skill 摘要（用于 System Prompt）
 */
export interface SkillSummary {
	id: string
	name: string
	description: string
}

/**
 * Skill 来源类型
 */
export type SkillSource = "personal" | "project" | "extension"
