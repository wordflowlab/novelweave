/**
 * 小说项目管理服务
 */

import * as vscode from "vscode"
import {
	ProjectDetector,
	ProjectInitializer,
	ProjectMigrator,
	ProjectDetectionResult,
	NovelProjectConfig,
} from "../../core/novel-project"

export class NovelProjectManager {
	private static instance: NovelProjectManager
	private currentProject: ProjectDetectionResult | null = null
	private projectCache: Map<string, ProjectDetectionResult> = new Map()

	private constructor() {}

	static getInstance(): NovelProjectManager {
		if (!NovelProjectManager.instance) {
			NovelProjectManager.instance = new NovelProjectManager()
		}
		return NovelProjectManager.instance
	}

	/**
	 * 检测当前工作区的项目
	 */
	async detectCurrentProject(): Promise<ProjectDetectionResult | null> {
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return null
		}

		// 默认检测第一个工作区文件夹
		const projectPath = workspaceFolders[0].uri.fsPath
		const result = await ProjectDetector.detectProject(projectPath)
		this.currentProject = result
		this.projectCache.set(projectPath, result)

		return result
	}

	/**
	 * 检测所有工作区项目
	 */
	async detectAllProjects(): Promise<Map<string, ProjectDetectionResult>> {
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return new Map()
		}

		const paths = workspaceFolders.map((folder) => folder.uri.fsPath)
		const results = await ProjectDetector.detectWorkspaceProjects(paths)

		// 更新缓存
		results.forEach((result, path) => {
			this.projectCache.set(path, result)
		})

		return results
	}

	/**
	 * 创建新的小说项目
	 */
	async createNewProject(name: string, rootPath: string, aiModel?: string): Promise<void> {
		await ProjectInitializer.initializeProject({
			name,
			rootPath,
			aiModel,
			includeScripts: false,
		})

		// 刷新项目检测
		await this.detectCurrentProject()

		vscode.window.showInformationMessage(`小说项目 "${name}" 创建成功！`)
	}

	/**
	 * 迁移 novel-writer 项目
	 */
	async migrateNovelWriterProject(projectPath: string): Promise<void> {
		// 检查是否已迁移
		const isMigrated = await ProjectMigrator.isMigrated(projectPath)
		if (isMigrated) {
			vscode.window.showInformationMessage("该项目已经迁移过了")
			return
		}

		// 执行迁移
		await ProjectMigrator.migrateFromNovelWriter(projectPath)

		// 刷新项目检测
		await this.detectCurrentProject()

		vscode.window.showInformationMessage("novel-writer 项目迁移完成！")
	}

	/**
	 * 获取当前项目
	 */
	getCurrentProject(): ProjectDetectionResult | null {
		return this.currentProject
	}

	/**
	 * 检查是否为小说项目
	 */
	isNovelProject(): boolean {
		return this.currentProject?.isNovelProject || this.currentProject?.isNovelWriterProject || false
	}

	/**
	 * 获取项目配置路径
	 */
	getConfigPath(): string | null {
		return this.currentProject?.configPath || null
	}

	/**
	 * 清除缓存
	 */
	clearCache(): void {
		this.projectCache.clear()
		this.currentProject = null
	}
}
