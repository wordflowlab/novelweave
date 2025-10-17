/**
 * 小说项目类型定义
 */

export type ProjectType = "novel" | "coding" | "unknown"

export type ProjectFormat = "novelweave" | "novel-writer" | "compatible"

/**
 * 小说项目配置
 */
export interface NovelProjectConfig {
	name: string
	type: "novel"
	version: string
	created: string
	format: ProjectFormat
	aiModel?: string
	methods?: string[]
	features?: {
		tracking?: boolean
		knowledgeBase?: boolean
		slashCommands?: boolean
	}
}

/**
 * 项目检测结果
 */
export interface ProjectDetectionResult {
	projectType: ProjectType
	projectFormat?: ProjectFormat
	configPath?: string
	rootPath: string
	isNovelProject: boolean
	isNovelWriterProject: boolean
	needsMigration: boolean
}

/**
 * novel-writer 配置（兼容）
 */
export interface NovelWriterConfig {
	name: string
	type: string
	ai?: string
	method?: string
	created?: string
	version?: string
}
