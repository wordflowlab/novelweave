/**
 * 注册小说创作相关的 VSCode 命令
 */

import * as vscode from "vscode"
import { NovelProjectManager, CommandGenerator } from "../services/novel"
import * as path from "path"

export function registerNovelCommands(context: vscode.ExtensionContext) {
	// 1. 创建新的小说项目
	const createNovelProject = vscode.commands.registerCommand("novelweave.createNovelProject", async () => {
		const name = await vscode.window.showInputBox({
			prompt: "输入小说项目名称",
			placeHolder: "my-novel",
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return "项目名称不能为空"
				}
				if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
					return "项目名称只能包含字母、数字、下划线和横线"
				}
				return null
			},
		})

		if (!name) {
			return
		}

		// 选择项目位置
		const folderUri = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: "选择项目位置",
		})

		if (!folderUri || folderUri.length === 0) {
			return
		}

		const parentPath = folderUri[0].fsPath
		const projectPath = path.join(parentPath, name)

		// 检查目录是否已存在
		try {
			await vscode.workspace.fs.stat(vscode.Uri.file(projectPath))
			vscode.window.showErrorMessage(`目录 "${name}" 已存在`)
			return
		} catch {
			// 目录不存在，可以创建
		}

		// 创建项目
		const manager = NovelProjectManager.getInstance()
		try {
			await manager.createNewProject(name, projectPath)
			vscode.window.showInformationMessage(`小说项目 "${name}" 创建成功！`)

			// 提示是否打开项目
			const openProject = await vscode.window.showInformationMessage("是否打开新创建的项目？", "打开", "稍后")

			if (openProject === "打开") {
				const uri = vscode.Uri.file(projectPath)
				await vscode.commands.executeCommand("vscode.openFolder", uri, { forceNewWindow: false })
			}
		} catch (error) {
			vscode.window.showErrorMessage(`创建项目失败: ${error}`)
		}
	})

	// 2. 迁移 novel-writer 项目
	const migrateNovelWriterProject = vscode.commands.registerCommand(
		"novelweave.migrateNovelWriterProject",
		async () => {
			const folderUri = await vscode.window.showOpenDialog({
				canSelectFiles: false,
				canSelectFolders: true,
				canSelectMany: false,
				openLabel: "选择 novel-writer 项目",
			})

			if (!folderUri || folderUri.length === 0) {
				return
			}

			const projectPath = folderUri[0].fsPath

			const manager = NovelProjectManager.getInstance()
			try {
				await manager.migrateNovelWriterProject(projectPath)
				vscode.window.showInformationMessage("novel-writer 项目迁移完成！")
			} catch (error) {
				vscode.window.showErrorMessage(`迁移项目失败: ${error}`)
			}
		},
	)

	// 3. 导出命令到其他 AI 平台
	const exportCommands = vscode.commands.registerCommand("novelweave.exportNovelCommands", async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage("请先打开一个项目")
			return
		}

		// 让用户选择平台
		const platforms = [
			{ label: "Claude Code", value: "claude" as const },
			{ label: "Cursor", value: "cursor" as const },
			{ label: "Gemini CLI", value: "gemini" as const },
			{ label: "Windsurf", value: "windsurf" as const },
			{ label: "Roo Code", value: "roocode" as const },
			{ label: "Kilo Code", value: "kilocode" as const },
			{ label: "All Platforms", value: "all" as const },
		]

		const selected = await vscode.window.showQuickPick(platforms, {
			placeHolder: "选择导出目标 AI 平台",
		})

		if (!selected) {
			return
		}

		const projectPath = workspaceFolders[0].uri.fsPath
		const templatesDir = path.join(context.extensionPath, "templates", "novel-commands")
		const generator = new CommandGenerator(templatesDir, projectPath)

		try {
			if (selected.value === "all") {
				const results = await generator.generateForAllPlatforms()
				const total = Array.from(results.values()).reduce((sum, count) => sum + count, 0)
				vscode.window.showInformationMessage(`已为所有平台导出 ${total} 个命令`)
			} else {
				const count = await generator.generateForPlatform(selected.value)
				vscode.window.showInformationMessage(`已为 ${selected.label} 导出 ${count} 个命令`)
			}
		} catch (error) {
			vscode.window.showErrorMessage(`导出命令失败: ${error}`)
		}
	})

	// 4. 检测当前项目类型
	const detectProject = vscode.commands.registerCommand("novelweave.detectProjectType", async () => {
		const manager = NovelProjectManager.getInstance()
		const result = await manager.detectCurrentProject()

		if (!result) {
			vscode.window.showInformationMessage("未检测到项目")
			return
		}

		let message = `项目类型: ${result.projectType}`
		if (result.projectFormat) {
			message += ` (格式: ${result.projectFormat})`
		}
		if (result.needsMigration) {
			message += " - 需要迁移"
		}

		vscode.window.showInformationMessage(message)
	})

	context.subscriptions.push(createNovelProject, migrateNovelWriterProject, exportCommands, detectProject)
}
