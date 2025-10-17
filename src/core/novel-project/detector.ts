/**
 * 项目类型检测器
 * 自动识别项目类型：小说项目（NovelWeave格式或novel-writer格式）或编程项目
 */

import * as path from "path"
import * as fs from "fs/promises"
import { ProjectDetectionResult, ProjectType, NovelProjectConfig, NovelWriterConfig } from "./types"

export class ProjectDetector {
	/**
	 * 检测项目类型
	 */
	static async detectProject(workspacePath: string): Promise<ProjectDetectionResult> {
		// 1. 检查是否存在 .novelweave/config.json
		const novelweaveConfigPath = path.join(workspacePath, ".novelweave", "config.json")
		const hasNovelweaveConfig = await this.fileExists(novelweaveConfigPath)

		if (hasNovelweaveConfig) {
			const config = await this.readNovelweaveConfig(novelweaveConfigPath)
			return {
				projectType: "novel",
				projectFormat: "novelweave",
				configPath: novelweaveConfigPath,
				rootPath: workspacePath,
				isNovelProject: true,
				isNovelWriterProject: false,
				needsMigration: false,
			}
		}

		// 2. 检查是否存在 .specify/config.json (novel-writer 格式)
		const specifyConfigPath = path.join(workspacePath, ".specify", "config.json")
		const hasSpecifyConfig = await this.fileExists(specifyConfigPath)

		if (hasSpecifyConfig) {
			const config = await this.readNovelWriterConfig(specifyConfigPath)
			return {
				projectType: "novel",
				projectFormat: "novel-writer",
				configPath: specifyConfigPath,
				rootPath: workspacePath,
				isNovelProject: false,
				isNovelWriterProject: true,
				needsMigration: true, // 需要迁移到 NovelWeave 格式
			}
		}

		// 3. 检查是否存在 spec/ 和 stories/ 目录（兼容模式）
		const hasSpecDir = await this.dirExists(path.join(workspacePath, "spec"))
		const hasStoriesDir = await this.dirExists(path.join(workspacePath, "stories"))

		if (hasSpecDir && hasStoriesDir) {
			return {
				projectType: "novel",
				projectFormat: "compatible",
				rootPath: workspacePath,
				isNovelProject: false,
				isNovelWriterProject: true,
				needsMigration: true,
			}
		}

		// 4. 默认为编程项目
		return {
			projectType: "coding",
			rootPath: workspacePath,
			isNovelProject: false,
			isNovelWriterProject: false,
			needsMigration: false,
		}
	}

	/**
	 * 检测工作区中的所有项目
	 */
	static async detectWorkspaceProjects(workspaceFolders: string[]): Promise<Map<string, ProjectDetectionResult>> {
		const results = new Map<string, ProjectDetectionResult>()

		for (const folder of workspaceFolders) {
			const result = await this.detectProject(folder)
			results.set(folder, result)
		}

		return results
	}

	/**
	 * 读取 NovelWeave 配置文件
	 */
	private static async readNovelweaveConfig(configPath: string): Promise<NovelProjectConfig | null> {
		try {
			const content = await fs.readFile(configPath, "utf-8")
			return JSON.parse(content) as NovelProjectConfig
		} catch (error) {
			console.error("Failed to read NovelWeave config:", error)
			return null
		}
	}

	/**
	 * 读取 novel-writer 配置文件
	 */
	private static async readNovelWriterConfig(configPath: string): Promise<NovelWriterConfig | null> {
		try {
			const content = await fs.readFile(configPath, "utf-8")
			return JSON.parse(content) as NovelWriterConfig
		} catch (error) {
			console.error("Failed to read novel-writer config:", error)
			return null
		}
	}

	/**
	 * 检查文件是否存在
	 */
	private static async fileExists(filePath: string): Promise<boolean> {
		try {
			const stat = await fs.stat(filePath)
			return stat.isFile()
		} catch {
			return false
		}
	}

	/**
	 * 检查目录是否存在
	 */
	private static async dirExists(dirPath: string): Promise<boolean> {
		try {
			const stat = await fs.stat(dirPath)
			return stat.isDirectory()
		} catch {
			return false
		}
	}
}
