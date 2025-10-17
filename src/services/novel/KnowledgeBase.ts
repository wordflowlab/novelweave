/**
 * 知识库服务
 * 加载和管理写作规范、最佳实践等
 */

import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"

export interface KnowledgeItem {
	id: string
	title: string
	content: string
	category: "preset" | "knowledge"
	path: string
	tags?: string[]
}

export class KnowledgeBase {
	private projectRoot: string
	private extensionPath: string
	private cache: Map<string, KnowledgeItem[]> = new Map()

	constructor(projectRoot: string, extensionPath: string) {
		this.projectRoot = projectRoot
		this.extensionPath = extensionPath
	}

	/**
	 * 加载所有知识库项目
	 */
	async loadAllKnowledge(): Promise<KnowledgeItem[]> {
		const items: KnowledgeItem[] = []

		// 加载项目中的知识库
		const projectItems = await this.loadProjectKnowledge()
		items.push(...projectItems)

		// 加载扩展中的知识库模板
		const templateItems = await this.loadTemplateKnowledge()
		items.push(...templateItems)

		return items
	}

	/**
	 * 加载项目中的知识库
	 */
	private async loadProjectKnowledge(): Promise<KnowledgeItem[]> {
		const items: KnowledgeItem[] = []
		const specDir = path.join(this.projectRoot, "spec")

		try {
			// 加载 presets
			const presetsDir = path.join(specDir, "presets")
			const presetItems = await this.loadMarkdownFiles(presetsDir, "preset")
			items.push(...presetItems)

			// 加载 knowledge
			const knowledgeDir = path.join(specDir, "knowledge")
			const knowledgeItems = await this.loadMarkdownFiles(knowledgeDir, "knowledge")
			items.push(...knowledgeItems)
		} catch (error) {
			console.warn("Failed to load project knowledge:", error)
		}

		return items
	}

	/**
	 * 加载扩展中的知识库模板
	 */
	private async loadTemplateKnowledge(): Promise<KnowledgeItem[]> {
		const items: KnowledgeItem[] = []
		const templateDir = path.join(this.extensionPath, "templates", "novel-knowledge")

		try {
			// 加载 presets
			const presetsDir = path.join(templateDir, "presets")
			const presetItems = await this.loadMarkdownFiles(presetsDir, "preset")
			items.push(...presetItems)

			// 加载 knowledge
			const knowledgeDir = path.join(templateDir, "knowledge")
			const knowledgeItems = await this.loadMarkdownFiles(knowledgeDir, "knowledge")
			items.push(...knowledgeItems)
		} catch (error) {
			console.warn("Failed to load template knowledge:", error)
		}

		return items
	}

	/**
	 * 加载目录中的 Markdown 文件
	 */
	private async loadMarkdownFiles(dirPath: string, category: "preset" | "knowledge"): Promise<KnowledgeItem[]> {
		const items: KnowledgeItem[] = []

		try {
			const files = await fs.readdir(dirPath)
			for (const file of files) {
				if (file.endsWith(".md")) {
					const filePath = path.join(dirPath, file)
					const content = await fs.readFile(filePath, "utf-8")
					const title = this.extractTitle(content) || file.replace(".md", "")

					items.push({
						id: `${category}-${file}`,
						title,
						content,
						category,
						path: filePath,
					})
				}
			}
		} catch (error) {
			// 目录不存在或无法访问
		}

		return items
	}

	/**
	 * 从 Markdown 内容中提取标题
	 */
	private extractTitle(content: string): string | null {
		const match = content.match(/^#\s+(.+)$/m)
		return match ? match[1].trim() : null
	}

	/**
	 * 搜索知识库
	 */
	async searchKnowledge(query: string): Promise<KnowledgeItem[]> {
		const allItems = await this.loadAllKnowledge()
		const lowerQuery = query.toLowerCase()

		return allItems.filter(
			(item) => item.title.toLowerCase().includes(lowerQuery) || item.content.toLowerCase().includes(lowerQuery),
		)
	}

	/**
	 * 获取指定 ID 的知识项
	 */
	async getKnowledgeById(id: string): Promise<KnowledgeItem | null> {
		const allItems = await this.loadAllKnowledge()
		return allItems.find((item) => item.id === id) || null
	}

	/**
	 * 安装知识库模板到项目
	 */
	async installTemplate(templateId: string): Promise<void> {
		const template = await this.getKnowledgeById(templateId)
		if (!template) {
			throw new Error(`Template not found: ${templateId}`)
		}

		const targetDir = path.join(this.projectRoot, "spec", template.category === "preset" ? "presets" : "knowledge")
		await fs.mkdir(targetDir, { recursive: true })

		const fileName = path.basename(template.path)
		const targetPath = path.join(targetDir, fileName)
		await fs.writeFile(targetPath, template.content, "utf-8")

		vscode.window.showInformationMessage(`已安装知识库模板：${template.title}`)
	}

	/**
	 * 清除缓存
	 */
	clearCache(): void {
		this.cache.clear()
	}
}
