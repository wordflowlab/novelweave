import type { ExtensionContext } from "vscode"

export function getUserAgent(context?: ExtensionContext): string {
	return `NovelWeave-Code ${context?.extension?.packageJSON?.version || "unknown"}`
}
