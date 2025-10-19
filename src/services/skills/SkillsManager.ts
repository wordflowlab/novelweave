import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import matter from "gray-matter"
import type { Skill, SkillsConfig, SkillSummary, SkillSource } from "@roo-code/types"

/**
 * Skills Manager - 管理 Agent Skills 的核心服务
 */
export class SkillsManager {
	private static instance: SkillsManager

	private skills: Map<string, Skill> = new Map()
	private activeSkills: Set<string> = new Set()
	private contentCache: Map<string, string> = new Map()

	private constructor(private context: vscode.ExtensionContext) {}

	static getInstance(context: vscode.ExtensionContext): SkillsManager {
		if (!SkillsManager.instance) {
			SkillsManager.instance = new SkillsManager(context)
		}
		return SkillsManager.instance
	}

	/**
	 * 初始化 - 扫描所有 Skills
	 */
	async initialize(): Promise<void> {
		await this.scanSkills()
	}

	/**
	 * 扫描所有 Skills 目录
	 */
	async scanSkills(): Promise<void> {
		const startTime = performance.now()
		this.skills.clear()

		const paths = this.getSkillsPaths()

		for (const [source, basePath] of paths) {
			try {
				await this.scanDirectory(basePath, source)
			} catch (error) {
				console.warn(`Failed to scan skills from ${basePath}:`, error)
			}
		}

		const duration = performance.now() - startTime
		console.log(`[Skills] Scanned ${this.skills.size} skills in ${duration.toFixed(2)}ms`)

		if (duration > 50 && this.skills.size > 0) {
			console.warn(`[Skills] Scan time exceeded 50ms threshold: ${duration.toFixed(2)}ms`)
		}
	}

	/**
	 * 获取 Skills 搜索路径
	 */
	private getSkillsPaths(): Array<[SkillSource, string]> {
		const paths: Array<[SkillSource, string]> = []

		// 1. Built-in skills (扩展内置，最高优先级)
		const builtinPath = path.join(this.context.extensionPath, "dist", "templates", "skills")
		paths.push(["extension", builtinPath])

		// 2. Project skills (项目特定)
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (workspaceFolders && workspaceFolders.length > 0) {
			const projectPath = path.join(workspaceFolders[0].uri.fsPath, ".agent", "skills")
			paths.push(["project", projectPath])
		}

		// 3. Personal skills (全局用户配置)
		const personalPath = path.join(this.context.globalStorageUri.fsPath, "skills")
		paths.push(["personal", personalPath])

		return paths
	}

	/**
	 * 扫描目录中的 Skills
	 */
	private async scanDirectory(basePath: string, source: SkillSource): Promise<void> {
		try {
			const entries = await fs.readdir(basePath, { withFileTypes: true })

			for (const entry of entries) {
				if (entry.isDirectory()) {
					const skillPath = path.join(basePath, entry.name)
					const skillFile = path.join(skillPath, "SKILL.md")

					try {
						await fs.access(skillFile)
						const skill = await this.parseSkillFile(skillFile, source)
						this.skills.set(skill.id, skill)
					} catch {
						// No SKILL.md in this directory, skip
					}
				}
			}
		} catch (error) {
			// Directory doesn't exist, skip
		}
	}

	/**
	 * 解析 SKILL.md 文件
	 */
	private async parseSkillFile(filePath: string, source: SkillSource): Promise<Skill> {
		try {
			const content = await fs.readFile(filePath, "utf-8")
			const { data: frontmatter } = matter(content)

			// Validate required fields
			if (!frontmatter.name || !frontmatter.description) {
				throw new Error(`Invalid SKILL.md: missing name or description in ${filePath}`)
			}

			const skillDir = path.dirname(filePath)
			const skillId = this.generateSkillId(skillDir, source)

			// Find support files
			const supportFiles = await this.findSupportFiles(skillDir)

			return {
				id: skillId,
				name: frontmatter.name,
				description: frontmatter.description,
				path: skillDir,
				source,
				allowedToolGroups: this.parseArrayField(frontmatter["allowed_tool_groups"]),
				keywords: this.parseArrayField(frontmatter.keywords),
				version: frontmatter.version,
				whenToUse: frontmatter.when_to_use,
				supportFiles,
				mcpResources: this.parseArrayField(frontmatter.mcp_resources),
				requiredModes: this.parseArrayField(frontmatter.required_modes),
				// Don't load content yet - lazy loading
			}
		} catch (error) {
			console.warn(`[Skills] Failed to parse ${filePath}:`, error)
			throw error
		}
	}

	/**
	 * 生成 Skill ID
	 */
	private generateSkillId(skillPath: string, source: string): string {
		const dirName = path.basename(skillPath)
		return `${source}:${dirName}`
	}

	/**
	 * 解析数组字段
	 */
	private parseArrayField(value: any): string[] | undefined {
		if (!value) return undefined
		if (typeof value === "string") {
			return value.split(",").map((s) => s.trim())
		}
		if (Array.isArray(value)) {
			return value.map((s) => String(s).trim())
		}
		return undefined
	}

	/**
	 * 查找支持文件
	 */
	private async findSupportFiles(skillDir: string): Promise<string[]> {
		const files: string[] = []

		try {
			const entries = await fs.readdir(skillDir, { withFileTypes: true, recursive: true })

			for (const entry of entries) {
				if (entry.isFile() && entry.name !== "SKILL.md") {
					const fullPath = path.join(entry.path || skillDir, entry.name)
					const relativePath = path.relative(skillDir, fullPath)
					files.push(relativePath)
				}
			}
		} catch (error) {
			// Ignore errors
		}

		return files
	}

	/**
	 * 获取 Skills 摘要（用于 System Prompt）
	 */
	getSkillsSummary(mode?: string): SkillSummary[] {
		const config = this.getConfig()
		const disabled = new Set(config?.disabledSkills || [])

		return Array.from(this.skills.values())
			.filter((skill) => {
				// Filter out disabled skills
				if (disabled.has(skill.id)) return false

				// Filter by mode if specified
				if (mode && skill.requiredModes && !skill.requiredModes.includes(mode)) {
					return false
				}

				// Check per-mode config
				if (mode && config?.perModeConfig?.[mode]?.enabledSkills) {
					return config.perModeConfig[mode].enabledSkills!.includes(skill.id)
				}

				return true
			})
			.map((skill) => ({
				id: skill.id,
				name: skill.name,
				description: skill.description + (skill.whenToUse ? `. Use when: ${skill.whenToUse}` : ""),
			}))
	}

	/**
	 * 加载 Skill 的完整内容
	 */
	async loadSkillContent(skillId: string): Promise<string> {
		// Check cache first
		if (this.contentCache.has(skillId)) {
			return this.contentCache.get(skillId)!
		}

		const skill = this.skills.get(skillId)
		if (!skill) {
			throw new Error(`Skill not found: ${skillId}`)
		}

		const startTime = performance.now()
		const skillFile = path.join(skill.path, "SKILL.md")
		const fileContent = await fs.readFile(skillFile, "utf-8")
		const { content: markdown } = matter(fileContent)

		// Cache the content
		this.contentCache.set(skillId, markdown)

		const duration = performance.now() - startTime
		if (duration > 20) {
			console.warn(`[Skills] Load time exceeded 20ms threshold: ${duration.toFixed(2)}ms for ${skillId}`)
		}

		return markdown
	}

	/**
	 * 激活 Skill
	 */
	async activateSkill(skillId: string): Promise<void> {
		this.activeSkills.add(skillId)
		console.log(`[Skills] Activated skill: ${skillId}`)

		// Load MCP resources if specified (future implementation)
		const skill = this.skills.get(skillId)
		if (skill?.mcpResources) {
			// TODO: Load MCP resources when MCP integration is implemented
			console.log(`[Skills] Skill ${skillId} has MCP resources:`, skill.mcpResources)
		}
	}

	/**
	 * 停用 Skill
	 */
	deactivateSkill(skillId: string): void {
		this.activeSkills.delete(skillId)
		console.log(`[Skills] Deactivated skill: ${skillId}`)
	}

	/**
	 * 获取激活的 Skills
	 */
	getActiveSkills(): Skill[] {
		return Array.from(this.activeSkills)
			.map((id) => this.skills.get(id))
			.filter((skill): skill is Skill => skill !== undefined)
	}

	/**
	 * 获取所有 Skills
	 */
	getAllSkills(): Skill[] {
		return Array.from(this.skills.values())
	}

	/**
	 * 按来源获取 Skills
	 */
	getSkillsBySource(source: SkillSource): Skill[] {
		return Array.from(this.skills.values()).filter((skill) => skill.source === source)
	}

	/**
	 * 获取配置
	 */
	getConfig(): SkillsConfig {
		return (
			this.context.globalState.get<SkillsConfig>("skillsConfig") || {
				enabled: true,
				disabledSkills: [],
				perModeConfig: {},
			}
		)
	}

	/**
	 * 更新配置
	 */
	async updateConfig(config: SkillsConfig): Promise<void> {
		await this.context.globalState.update("skillsConfig", config)
	}

	/**
	 * 清除缓存
	 */
	clearCache(): void {
		this.contentCache.clear()
		console.log("[Skills] Cache cleared")
	}

	/**
	 * 通过名称查找 Skill（用于 AI 激活）
	 */
	findSkillByName(name: string): Skill | undefined {
		return Array.from(this.skills.values()).find((skill) => skill.name === name)
	}
}
