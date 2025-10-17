/**
 * 小说创作命令类型定义
 */

export interface NovelCommandContext {
	projectRoot: string
	configPath: string
	currentStep?: number
	aiModel?: string
}

export interface NovelCommandResult {
	success: boolean
	message: string
	data?: any
	nextStep?: string
}

export type NovelCommandType =
	| "constitution"
	| "specify"
	| "clarify"
	| "plan"
	| "tasks"
	| "write"
	| "analyze"
	| "timeline"
	| "relations"
	| "track"
	| "track-init"
