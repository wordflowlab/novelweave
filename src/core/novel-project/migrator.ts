/**
 * novel-writer 项目迁移工具
 * 将 novel-writer 项目迁移到 NovelWeave 格式
 */

import * as path from "path"
import * as fs from "fs/promises"
import { NovelProjectConfig, NovelWriterConfig } from "./types"

export class ProjectMigrator {
	/**
	 * 迁移 novel-writer 项目到 NovelWeave 格式
	 */
	static async migrateFromNovelWriter(projectPath: string): Promise<void> {
		console.log(`Migrating novel-writer project at: ${projectPath}`)

		// 1. 读取 novel-writer 配置
		const specifyConfigPath = path.join(projectPath, ".specify", "config.json")
		const novelWriterConfig = await this.readNovelWriterConfig(specifyConfigPath)

		// 2. 创建 .novelweave 目录
		const novelweaveDir = path.join(projectPath, ".novelweave")
		await fs.mkdir(novelweaveDir, { recursive: true })

		// 3. 创建 NovelWeave 配置文件
		await this.createNovelweaveConfig(projectPath, novelWriterConfig)

		// 4. 复制 memory 文件
		await this.copyMemoryFiles(projectPath)

		// 5. 可选：复制 scripts 文件
		await this.copyScriptsIfExists(projectPath)

		// 6. 创建迁移标记文件
		await this.createMigrationMarker(projectPath)

		console.log("Migration completed successfully")
	}

	/**
	 * 读取 novel-writer 配置
	 */
	private static async readNovelWriterConfig(configPath: string): Promise<NovelWriterConfig> {
		try {
			const content = await fs.readFile(configPath, "utf-8")
			return JSON.parse(content) as NovelWriterConfig
		} catch (error) {
			throw new Error(`Failed to read novel-writer config: ${error}`)
		}
	}

	/**
	 * 创建 NovelWeave 配置文件
	 */
	private static async createNovelweaveConfig(
		projectPath: string,
		novelWriterConfig: NovelWriterConfig,
	): Promise<void> {
		const novelweaveConfig: NovelProjectConfig = {
			name: novelWriterConfig.name,
			type: "novel",
			version: novelWriterConfig.version || "1.0.0",
			created: novelWriterConfig.created || new Date().toISOString(),
			format: "novel-writer", // 标记为迁移自 novel-writer
			aiModel: novelWriterConfig.ai || "claude-sonnet-4",
			methods: novelWriterConfig.method ? [novelWriterConfig.method] : ["seven-step"],
			features: {
				tracking: true,
				knowledgeBase: true,
				slashCommands: true,
			},
		}

		const configPath = path.join(projectPath, ".novelweave", "config.json")
		await fs.writeFile(configPath, JSON.stringify(novelweaveConfig, null, 2), "utf-8")
	}

	/**
	 * 复制 memory 文件
	 */
	private static async copyMemoryFiles(projectPath: string): Promise<void> {
		const sourceMemoryDir = path.join(projectPath, ".specify", "memory")
		const targetMemoryDir = path.join(projectPath, ".novelweave", "memory")

		try {
			// 检查源目录是否存在
			await fs.access(sourceMemoryDir)

			// 创建目标目录
			await fs.mkdir(targetMemoryDir, { recursive: true })

			// 复制所有文件
			const files = await fs.readdir(sourceMemoryDir)
			for (const file of files) {
				const sourcePath = path.join(sourceMemoryDir, file)
				const targetPath = path.join(targetMemoryDir, file)

				const stat = await fs.stat(sourcePath)
				if (stat.isFile()) {
					await fs.copyFile(sourcePath, targetPath)
				}
			}
		} catch (error) {
			console.warn("Memory directory not found or could not be copied:", error)
		}
	}

	/**
	 * 复制 scripts 文件（如果存在）
	 */
	private static async copyScriptsIfExists(projectPath: string): Promise<void> {
		const sourceScriptsDir = path.join(projectPath, ".specify", "scripts")
		const targetScriptsDir = path.join(projectPath, ".novelweave", "scripts")

		try {
			await fs.access(sourceScriptsDir)
			await fs.mkdir(targetScriptsDir, { recursive: true })

			// 递归复制整个 scripts 目录
			await this.copyDirectory(sourceScriptsDir, targetScriptsDir)
		} catch (error) {
			// Scripts 目录不存在，跳过
			console.log("Scripts directory not found, skipping")
		}
	}

	/**
	 * 递归复制目录
	 */
	private static async copyDirectory(source: string, target: string): Promise<void> {
		await fs.mkdir(target, { recursive: true })

		const entries = await fs.readdir(source, { withFileTypes: true })

		for (const entry of entries) {
			const sourcePath = path.join(source, entry.name)
			const targetPath = path.join(target, entry.name)

			if (entry.isDirectory()) {
				await this.copyDirectory(sourcePath, targetPath)
			} else {
				await fs.copyFile(sourcePath, targetPath)
			}
		}
	}

	/**
	 * 创建迁移标记文件
	 */
	private static async createMigrationMarker(projectPath: string): Promise<void> {
		const markerPath = path.join(projectPath, ".novelweave", ".migrated-from-novel-writer")
		const markerContent = {
			migratedAt: new Date().toISOString(),
			originalFormat: "novel-writer",
			note: "This project was migrated from novel-writer. The .specify directory is preserved for compatibility.",
		}

		await fs.writeFile(markerPath, JSON.stringify(markerContent, null, 2), "utf-8")
	}

	/**
	 * 检查项目是否已迁移
	 */
	static async isMigrated(projectPath: string): Promise<boolean> {
		const markerPath = path.join(projectPath, ".novelweave", ".migrated-from-novel-writer")
		try {
			await fs.access(markerPath)
			return true
		} catch {
			return false
		}
	}
}
