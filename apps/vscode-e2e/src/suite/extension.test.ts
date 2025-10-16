import * as assert from "assert"
import * as vscode from "vscode"

import { setDefaultSuiteTimeout } from "./test-utils"

suite("NovelWeave Extension", function () {
	setDefaultSuiteTimeout(this)

	test("Commands should be registered", async () => {
		const expectedCommands = [
			"activationCompleted",
			"plusButtonClicked",
			"promptsButtonClicked",
			"historyButtonClicked",
			"popoutButtonClicked",
			"accountButtonClicked",
			"settingsButtonClicked",
			"openInNewTab",
			"showHumanRelayDialog",
			"registerHumanRelayCallback",
			"unregisterHumanRelayCallback",
			"handleHumanRelayResponse",
			"newTask",
			"setCustomStoragePath",
			"acceptInput",
			"explainCode",
			"fixCode",
			"improveCode",
			"addToContext",
			"terminalAddToContext",
			"terminalFixCommand",
			"terminalExplainCommand",
		]

		const commands = new Set(
			(await vscode.commands.getCommands(true)).filter((cmd) => cmd.startsWith("novelweave")),
		)

		for (const command of expectedCommands) {
			assert.ok(commands.has(`novelweave.${command}`), `Command ${command} should be registered`)
		}
	})
})
