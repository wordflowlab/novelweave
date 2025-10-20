import { z } from "zod"
import { kiloLanguages } from "./kiloLanguages.js"

/**
 * CodeAction
 */

export const codeActionIds = ["explainCode", "fixCode", "improveCode", "addToContext", "newTask"] as const

export type CodeActionId = (typeof codeActionIds)[number]

export type CodeActionName = "EXPLAIN" | "FIX" | "IMPROVE" | "ADD_TO_CONTEXT" | "NEW_TASK"

/**
 * TerminalAction
 */

export const terminalActionIds = ["terminalAddToContext", "terminalFixCommand", "terminalExplainCommand"] as const

export type TerminalActionId = (typeof terminalActionIds)[number]

export type TerminalActionName = "ADD_TO_CONTEXT" | "FIX" | "EXPLAIN"

export type TerminalActionPromptType = `TERMINAL_${TerminalActionName}`

/**
 * Command
 */

export const commandIds = [
	"activationCompleted",

	"plusButtonClicked",
	"promptsButtonClicked",
	"mcpButtonClicked",

	"historyButtonClicked",
	"marketplaceButtonClicked",
	"popoutButtonClicked",
	"cloudButtonClicked",
	"settingsButtonClicked",

	"openInNewTab",

	"showHumanRelayDialog",
	"registerHumanRelayCallback",
	"unregisterHumanRelayCallback",
	"handleHumanRelayResponse",

	"newTask",

	"setCustomStoragePath",
	"importSettings",

	// "focusInput", // novelweave_change
	"acceptInput",
	"profileButtonClicked", // novelweave_change
	"helpButtonClicked", // novelweave_change
	"focusChatInput", // novelweave_change
	"importSettings", // novelweave_change
	"exportSettings", // novelweave_change
	"generateTerminalCommand", // novelweave_change
	"handleExternalUri", // novelweave_change - for JetBrains plugin URL forwarding
	"skillsButtonClicked", // novelweave_change: Skills support
	"skillsRefresh", // novelweave_change: Skills support
	"skillsCreate", // novelweave_change: Skills support
	"skillsInitialize", // novelweave_change: Skills initialization
	"skillsCheckNew", // novelweave_change: Skills check for updates
	"focusPanel",
	"toggleAutoApprove",
] as const

export type CommandId = (typeof commandIds)[number]

/**
 * Language
 */

export const languages = [
	...kiloLanguages,
	"ca",
	"de",
	"en",
	"es",
	"fr",
	"hi",
	"id",
	"it",
	"ja",
	"ko",
	"nl",
	"pl",
	"pt-BR",
	"ru",
	"tr",
	"vi",
	"zh-CN",
	"zh-TW",
] as const

export const languagesSchema = z.enum(languages)

export type Language = z.infer<typeof languagesSchema>

export const isLanguage = (value: string): value is Language => languages.includes(value as Language)
