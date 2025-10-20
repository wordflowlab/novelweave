import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"

/**
 * Skills 初始化器
 * 负责将内置 Skills 模板复制到项目中
 */
export class SkillsInitializer {
	constructor(private context: vscode.ExtensionContext) {}

	/**
	 * 检测项目是否已初始化 Skills
	 * 只有当目录存在且非空时才认为已初始化
	 */
	async isInitialized(): Promise<boolean> {
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return false
		}

		const skillsPath = path.join(workspaceFolders[0].uri.fsPath, ".agent", "skills")

		try {
			await fs.access(skillsPath)
			// 检查目录是否为空
			const entries = await fs.readdir(skillsPath)
			// 过滤掉隐藏文件和 README
			const skillFolders = entries.filter(
				(name) => !name.startsWith(".") && !name.toLowerCase().startsWith("readme"),
			)
			return skillFolders.length > 0 // 只有当有实际的 skill 目录时才认为已初始化
		} catch {
			return false
		}
	}

	/**
	 * 初始化 Skills 到项目
	 * @param force 是否强制覆盖已存在的 Skills
	 */
	async initializeSkills(force: boolean = false): Promise<void> {
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (!workspaceFolders || workspaceFolders.length === 0) {
			throw new Error("No workspace folder open")
		}

		const projectRoot = workspaceFolders[0].uri.fsPath
		const targetPath = path.join(projectRoot, ".agent", "skills")

		// 检查是否已存在
		if (!force && (await this.isInitialized())) {
			throw new Error("Skills already initialized. Use force=true to overwrite.")
		}

		// 获取模板路径
		const templatePath = path.join(this.context.extensionPath, "dist", "templates", "skills")

		// 检查模板是否存在
		try {
			await fs.access(templatePath)
		} catch {
			throw new Error("Skills templates not found. Please reinstall the extension.")
		}

		// 复制所有 Skills
		await this.copyDirectory(templatePath, targetPath)

		// 创建 README
		await this.createReadme(targetPath)

		console.log(`[SkillsInitializer] Initialized skills to ${targetPath}`)
	}

	/**
	 * 递归复制目录
	 */
	private async copyDirectory(src: string, dest: string): Promise<void> {
		await fs.mkdir(dest, { recursive: true })

		const entries = await fs.readdir(src, { withFileTypes: true })

		for (const entry of entries) {
			const srcPath = path.join(src, entry.name)
			const destPath = path.join(dest, entry.name)

			if (entry.isDirectory()) {
				await this.copyDirectory(srcPath, destPath)
			} else {
				await fs.copyFile(srcPath, destPath)
			}
		}
	}

	/**
	 * 创建 README 文件
	 */
	private async createReadme(skillsPath: string): Promise<void> {
		const packageJson = this.context.extension.packageJSON
		const version = packageJson.version || "unknown"

		const readme = `# NovelWeave Agent Skills

这个目录包含您的项目 Agent Skills。

## 说明

- ✅ 您可以自由修改、删除或添加 Skills
- ✅ Skills 文件会被 Git 跟踪，团队共享
- ✅ 每个 Skill 是一个目录，包含 SKILL.md 文件

## 目录结构

\`\`\`
.agent/skills/
├── genre-knowledge/       # 类型知识
│   ├── romance/
│   ├── mystery/
│   └── fantasy/
├── quality-assurance/     # 质量保证
│   ├── consistency-checker/
│   └── novelweave-workflow/
└── writing-techniques/    # 写作技巧
    ├── dialogue-techniques/
    └── scene-structure/
\`\`\`

## 如何使用

1. **查看 Skill**：打开任意 Skill 目录中的 SKILL.md 文件
2. **修改 Skill**：直接编辑 SKILL.md 或添加支持文件
3. **删除 Skill**：删除整个 Skill 目录
4. **添加新 Skill**：创建新目录，添加 SKILL.md 文件

## 团队协作

1. 修改 Skills 后提交到 Git
2. 团队成员 pull 后自动获得更新
3. 冲突时手动解决（像普通代码一样）

## 参考资料

- [Skills 编写指南](https://docs.novelweave.com/skills-guide)
- [SKILL.md 格式规范](https://docs.novelweave.com/skill-format)

---

_初始化时间：${new Date().toISOString()}_  
_NovelWeave 版本：${version}_
`

		await fs.writeFile(path.join(skillsPath, "README.md"), readme, "utf-8")
	}

	/**
	 * 检查是否有新的官方 Skills
	 * 对比模板和项目中的 Skills
	 */
	async checkForNewSkills(): Promise<string[]> {
		const templatePath = path.join(this.context.extensionPath, "dist", "templates", "skills")

		const workspaceFolders = vscode.workspace.workspaceFolders
		if (!workspaceFolders || workspaceFolders.length === 0) {
			// 如果没有工作区，返回所有模板 Skills
			return await this.listSkills(templatePath)
		}

		const projectPath = path.join(workspaceFolders[0].uri.fsPath, ".agent", "skills")

		const templateSkills = await this.listSkills(templatePath)
		const projectSkills = await this.listSkills(projectPath)

		// 找出模板中有但项目中没有的 Skills
		return templateSkills.filter((skill) => !projectSkills.includes(skill))
	}

	/**
	 * 列出目录中的所有 Skills
	 */
	private async listSkills(basePath: string): Promise<string[]> {
		const skills: string[] = []

		try {
			await this.scanSkillsRecursively(basePath, basePath, skills)
		} catch (error) {
			// Directory doesn't exist or can't be read
			return []
		}

		return skills
	}

	/**
	 * 递归扫描 Skills
	 */
	private async scanSkillsRecursively(basePath: string, currentPath: string, skills: string[]): Promise<void> {
		const entries = await fs.readdir(currentPath, { withFileTypes: true })

		for (const entry of entries) {
			if (entry.isDirectory() && !entry.name.startsWith(".")) {
				const fullPath = path.join(currentPath, entry.name)
				const skillFile = path.join(fullPath, "SKILL.md")

				try {
					await fs.access(skillFile)
					// This is a skill directory
					const relativePath = path.relative(basePath, fullPath)
					skills.push(relativePath)
				} catch {
					// Not a skill directory, scan deeper
					await this.scanSkillsRecursively(basePath, fullPath, skills)
				}
			}
		}
	}

	/**
	 * 添加缺失的 Skills
	 */
	async addMissingSkills(skillPaths: string[]): Promise<void> {
		const templateBasePath = path.join(this.context.extensionPath, "dist", "templates", "skills")

		const workspaceFolders = vscode.workspace.workspaceFolders
		if (!workspaceFolders || workspaceFolders.length === 0) {
			throw new Error("No workspace folder open")
		}

		const projectBasePath = path.join(workspaceFolders[0].uri.fsPath, ".agent", "skills")

		for (const skillPath of skillPaths) {
			const src = path.join(templateBasePath, skillPath)
			const dest = path.join(projectBasePath, skillPath)

			// Check if skill already exists
			try {
				await fs.access(dest)
				console.log(`[SkillsInitializer] Skipping existing skill: ${skillPath}`)
				continue
			} catch {
				// Skill doesn't exist, proceed with copy
			}

			try {
				await this.copyDirectory(src, dest)
				console.log(`[SkillsInitializer] Added skill: ${skillPath}`)
			} catch (error) {
				console.warn(`[SkillsInitializer] Failed to add skill ${skillPath}:`, error)
				// Continue with other skills
			}
		}
	}
}
