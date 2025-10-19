import * as vscode from "vscode"
import delay from "delay"

import type { CommandId } from "@roo-code/types"
import { TelemetryService } from "@roo-code/telemetry"

import { getCommand } from "../utils/commands"
import { ClineProvider } from "../core/webview/ClineProvider"
import { exportSettings } from "../core/config/importExport" // novelweave_change
import { ContextProxy } from "../core/config/ContextProxy"
import { focusPanel } from "../utils/focusPanel"

import { registerHumanRelayCallback, unregisterHumanRelayCallback, handleHumanRelayResponse } from "./humanRelay"
import { handleNewTask } from "./handleTask"
import { CodeIndexManager } from "../services/code-index/manager"
import { importSettingsWithFeedback } from "../core/config/importExport"
import { MdmService } from "../services/mdm/MdmService"
import { t } from "../i18n"
import { generateTerminalCommand } from "../utils/terminalCommandGenerator" // novelweave_change

/**
 * Helper to get the visible ClineProvider instance or log if not found.
 */
export function getVisibleProviderOrLog(outputChannel: vscode.OutputChannel): ClineProvider | undefined {
	const visibleProvider = ClineProvider.getVisibleInstance()
	if (!visibleProvider) {
		outputChannel.appendLine("Cannot find any visible NovelWeave instances.")
		return undefined
	}
	return visibleProvider
}

// Store panel references in both modes
let sidebarPanel: vscode.WebviewView | undefined = undefined
let tabPanel: vscode.WebviewPanel | undefined = undefined

/**
 * Get the currently active panel
 * @returns WebviewPanel或WebviewView
 */
export function getPanel(): vscode.WebviewPanel | vscode.WebviewView | undefined {
	return tabPanel || sidebarPanel
}

/**
 * Set panel references
 */
export function setPanel(
	newPanel: vscode.WebviewPanel | vscode.WebviewView | undefined,
	type: "sidebar" | "tab",
): void {
	if (type === "sidebar") {
		sidebarPanel = newPanel as vscode.WebviewView
		tabPanel = undefined
	} else {
		tabPanel = newPanel as vscode.WebviewPanel
		sidebarPanel = undefined
	}
}

export type RegisterCommandOptions = {
	context: vscode.ExtensionContext
	outputChannel: vscode.OutputChannel
	provider: ClineProvider
}

export const registerCommands = (options: RegisterCommandOptions) => {
	const { context } = options

	for (const [id, callback] of Object.entries(getCommandsMap(options))) {
		const command = getCommand(id as CommandId)
		context.subscriptions.push(vscode.commands.registerCommand(command, callback))
	}
}

const getCommandsMap = ({ context, outputChannel }: RegisterCommandOptions): Record<CommandId, any> => ({
	activationCompleted: () => {},
	cloudButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("cloud")

		visibleProvider.postMessageToWebview({ type: "action", action: "cloudButtonClicked" })
	},
	plusButtonClicked: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("plus")

		await visibleProvider.removeClineFromStack()
		await visibleProvider.refreshWorkspace()
		await visibleProvider.postMessageToWebview({ type: "action", action: "chatButtonClicked" })
		// Send focusInput action immediately after chatButtonClicked
		// This ensures the focus happens after the view has switched
		await visibleProvider.postMessageToWebview({ type: "action", action: "focusInput" })
	},
	mcpButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("mcp")

		visibleProvider.postMessageToWebview({ type: "action", action: "mcpButtonClicked" })
	},
	promptsButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("prompts")

		visibleProvider.postMessageToWebview({ type: "action", action: "promptsButtonClicked" })
	},
	popoutButtonClicked: () => {
		TelemetryService.instance.captureTitleButtonClicked("popout")

		return openClineInNewTab({ context, outputChannel })
	},
	openInNewTab: () => openClineInNewTab({ context, outputChannel }),
	settingsButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("settings")

		visibleProvider.postMessageToWebview({ type: "action", action: "settingsButtonClicked" })
		// Also explicitly post the visibility message to trigger scroll reliably
		visibleProvider.postMessageToWebview({ type: "action", action: "didBecomeVisible" })
	},
	historyButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("history")

		visibleProvider.postMessageToWebview({ type: "action", action: "historyButtonClicked" })
	},
	skillsButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("skills")

		visibleProvider.postMessageToWebview({ type: "action", action: "skillsButtonClicked" })
	},
	// novelweave_change begin
	profileButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		visibleProvider.postMessageToWebview({ type: "action", action: "profileButtonClicked" })
	},
	helpButtonClicked: () => {
		vscode.env.openExternal(vscode.Uri.parse("https://novelweave.ai"))
	},
	// novelweave_change end
	marketplaceButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) return
		visibleProvider.postMessageToWebview({ type: "action", action: "marketplaceButtonClicked" })
	},
	showHumanRelayDialog: (params: { requestId: string; promptText: string }) => {
		const panel = getPanel()

		if (panel) {
			panel?.webview.postMessage({
				type: "showHumanRelayDialog",
				requestId: params.requestId,
				promptText: params.promptText,
			})
		}
	},
	registerHumanRelayCallback: registerHumanRelayCallback,
	unregisterHumanRelayCallback: unregisterHumanRelayCallback,
	handleHumanRelayResponse: handleHumanRelayResponse,
	newTask: handleNewTask,
	setCustomStoragePath: async () => {
		const { promptForCustomStoragePath } = await import("../utils/storage")
		await promptForCustomStoragePath()
	},
	importSettings: async (filePath?: string) => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}

		await importSettingsWithFeedback(
			{
				providerSettingsManager: visibleProvider.providerSettingsManager,
				contextProxy: visibleProvider.contextProxy,
				customModesManager: visibleProvider.customModesManager,
				provider: visibleProvider,
			},
			filePath,
		)
	},
	focusPanel: async () => {
		try {
			await focusPanel(tabPanel, sidebarPanel)
		} catch (error) {
			outputChannel.appendLine(`Error focusing panel: ${error}`)
		}
	},
	acceptInput: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		visibleProvider.postMessageToWebview({ type: "acceptInput" })
	}, // novelweave_change begin
	focusChatInput: async () => {
		try {
			await vscode.commands.executeCommand("novelweave.SidebarProvider.focus")
			await delay(100)

			let visibleProvider = getVisibleProviderOrLog(outputChannel)

			if (!visibleProvider) {
				// If still no visible provider, try opening in a new tab
				const tabProvider = await openClineInNewTab({ context, outputChannel })
				await delay(100)
				visibleProvider = tabProvider
			}

			visibleProvider?.postMessageToWebview({
				type: "action",
				action: "focusChatInput",
			})
		} catch (error) {
			outputChannel.appendLine(`Error in focusChatInput: ${error}`)
		}
	},
	generateTerminalCommand: async () => await generateTerminalCommand({ outputChannel, context }), // novelweave_change
	exportSettings: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) return

		await exportSettings({
			providerSettingsManager: visibleProvider.providerSettingsManager,
			contextProxy: visibleProvider.contextProxy,
		})
	},
	// Handle external URI - used by JetBrains plugin to forward auth tokens
	handleExternalUri: async (uriString: string) => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}

		try {
			// Parse the URI string and create a VSCode URI object
			const uri = vscode.Uri.parse(uriString)

			// Import and use the existing handleUri function
			const { handleUri } = await import("./handleUri")
			await handleUri(uri)

			outputChannel.appendLine(`Successfully handled external URI: ${uriString}`)
		} catch (error) {
			outputChannel.appendLine(`Error handling external URI: ${uriString}, error: ${error}`)
		}
	},
	// novelweave_change end
	toggleAutoApprove: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		visibleProvider.postMessageToWebview({
			type: "action",
			action: "toggleAutoApprove",
		})
	},
	// novelweave_change: Skills commands
	skillsRefresh: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}

		const skillsManager = visibleProvider.skillsManager
		if (skillsManager) {
			try {
				await skillsManager.scanSkills()
				vscode.window.showInformationMessage(
					`Skills refreshed: ${skillsManager.getAllSkills().length} skills found`,
				)
				// Notify webview
				visibleProvider.postMessageToWebview({ type: "refreshSkills" })
			} catch (error) {
				vscode.window.showErrorMessage(
					`Failed to refresh skills: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		} else {
			vscode.window.showWarningMessage("Skills Manager is not initialized")
		}
	},
	skillsCreate: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}

		const skillsManager = visibleProvider.skillsManager
		if (!skillsManager) {
			vscode.window.showWarningMessage("Skills Manager is not initialized")
			return
		}

		try {
			// Ask user where to create the skill
			const location = await vscode.window.showQuickPick(
				[
					{ label: "Personal Skill", value: "personal", description: "Save to your global storage" },
					{
						label: "Project Skill",
						value: "project",
						description: "Save to .agent/skills/ in current workspace",
					},
				],
				{ placeHolder: "Where would you like to create the skill?" },
			)

			if (!location) {
				return
			}

			// Ask for skill name
			const skillName = await vscode.window.showInputBox({
				prompt: "Enter skill name (kebab-case)",
				placeHolder: "my-skill-name",
				validateInput: (value) => {
					if (!value) {
						return "Skill name is required"
					}
					if (!/^[a-z0-9-]+$/.test(value)) {
						return "Skill name must be kebab-case (lowercase letters, numbers, and hyphens only)"
					}
					return null
				},
			})

			if (!skillName) {
				return
			}

			// Determine target directory
			let targetDir: string
			if (location.value === "personal") {
				targetDir = context.globalStorageUri.fsPath
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetDir))
				targetDir = `${targetDir}/skills/${skillName}`
			} else {
				const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
				if (!workspaceFolder) {
					vscode.window.showErrorMessage("No workspace folder found")
					return
				}
				targetDir = `${workspaceFolder.uri.fsPath}/.agent/skills/${skillName}`
			}

			// Create directory
			await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetDir))

			// Create SKILL.md template
			const skillPath = `${targetDir}/SKILL.md`
			const template = `---
name: ${skillName
				.split("-")
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(" ")}
description: Brief description of what this skill does and when to use it
version: 1.0.0
---

# ${skillName
				.split("-")
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(" ")}

## Instructions

Provide clear, step-by-step guidance on how to use this skill.

## Examples

Include practical examples demonstrating the skill's application.

## Best Practices

List recommended practices and common pitfalls to avoid.
`

			await vscode.workspace.fs.writeFile(vscode.Uri.file(skillPath), Buffer.from(template, "utf8"))

			// Open the file in editor
			const document = await vscode.workspace.openTextDocument(skillPath)
			await vscode.window.showTextDocument(document)

			// Refresh skills
			await skillsManager.scanSkills()
			visibleProvider.postMessageToWebview({ type: "refreshSkills" })

			vscode.window.showInformationMessage(`Skill "${skillName}" created successfully`)
		} catch (error) {
			vscode.window.showErrorMessage(
				`Failed to create skill: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	},
})

export const openClineInNewTab = async ({ context, outputChannel }: Omit<RegisterCommandOptions, "provider">) => {
	// (This example uses webviewProvider activation event which is necessary to
	// deserialize cached webview, but since we use retainContextWhenHidden, we
	// don't need to use that event).
	// https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
	const contextProxy = await ContextProxy.getInstance(context)
	const codeIndexManager = CodeIndexManager.getInstance(context)

	// Get the existing MDM service instance to ensure consistent policy enforcement
	let mdmService: MdmService | undefined
	try {
		mdmService = MdmService.getInstance()
	} catch (error) {
		// MDM service not initialized, which is fine - extension can work without it
		mdmService = undefined
	}

	const tabProvider = new ClineProvider(context, outputChannel, "editor", contextProxy, mdmService)
	const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))

	// Check if there are any visible text editors, otherwise open a new group
	// to the right.
	const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0

	if (!hasVisibleEditors) {
		await vscode.commands.executeCommand("workbench.action.newGroupRight")
	}

	const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two

	const newPanel = vscode.window.createWebviewPanel(ClineProvider.tabPanelId, "NovelWeave", targetCol, {
		enableScripts: true,
		retainContextWhenHidden: true,
		localResourceRoots: [context.extensionUri],
	})

	// Save as tab type panel.
	setPanel(newPanel, "tab")

	newPanel.iconPath = {
		light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "kilo.png"),
		dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "kilo-dark.png"),
	}

	await tabProvider.resolveWebviewView(newPanel)

	// Add listener for visibility changes to notify webview
	newPanel.onDidChangeViewState(
		(e) => {
			const panel = e.webviewPanel
			if (panel.visible) {
				panel.webview.postMessage({ type: "action", action: "didBecomeVisible" }) // Use the same message type as in SettingsView.tsx
			}
		},
		null, // First null is for `thisArgs`
		context.subscriptions, // Register listener for disposal
	)

	// Handle panel closing events.
	newPanel.onDidDispose(
		() => {
			setPanel(undefined, "tab")
		},
		null,
		context.subscriptions, // Also register dispose listener
	)

	// Lock the editor group so clicking on files doesn't open them over the panel.
	await delay(100)
	await vscode.commands.executeCommand("workbench.action.lockEditorGroup")

	return tabProvider
}
