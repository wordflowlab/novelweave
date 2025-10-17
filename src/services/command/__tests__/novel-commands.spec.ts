/**
 * Tests for novel commands
 */

import { describe, it, expect, beforeAll } from "vitest"
import {
	getBuiltInNovelCommands,
	getBuiltInNovelCommand,
	getBuiltInNovelCommandNames,
	isNovelCommand,
} from "../novel-commands"
import * as path from "path"
import * as url from "url"

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

describe("Novel Commands", () => {
	let extensionPath: string

	beforeAll(() => {
		// Get extension path (go up from tests to src to root)
		extensionPath = path.resolve(__dirname, "../../../..")
	})

	it("should load all built-in novel commands", async () => {
		const commands = await getBuiltInNovelCommands(extensionPath)

		expect(commands).toBeDefined()
		expect(commands.length).toBeGreaterThan(0)

		// Should have at least the 7 core commands
		const commandNames = commands.map((c) => c.name)
		expect(commandNames).toContain("constitution")
		expect(commandNames).toContain("specify")
		expect(commandNames).toContain("clarify")
		expect(commandNames).toContain("plan")
		expect(commandNames).toContain("tasks")
		expect(commandNames).toContain("write")
		expect(commandNames).toContain("analyze")
	})

	it("should load specific novel command", async () => {
		const command = await getBuiltInNovelCommand(extensionPath, "constitution")

		expect(command).toBeDefined()
		expect(command?.name).toBe("constitution")
		expect(command?.content).toBeDefined()
		expect(command?.content.length).toBeGreaterThan(0)
		expect(command?.description).toBeDefined()
		expect(command?.source).toBe("built-in")
	})

	it("should return undefined for non-existent command", async () => {
		const command = await getBuiltInNovelCommand(extensionPath, "nonexistent")
		expect(command).toBeUndefined()
	})

	it("should return all novel command names", () => {
		const names = getBuiltInNovelCommandNames()

		expect(names).toContain("constitution")
		expect(names).toContain("write")
		expect(names).toContain("analyze")
		expect(names.length).toBeGreaterThanOrEqual(7)
	})

	it("should identify novel commands correctly", () => {
		expect(isNovelCommand("constitution")).toBe(true)
		expect(isNovelCommand("write")).toBe(true)
		expect(isNovelCommand("init")).toBe(false)
		expect(isNovelCommand("nonexistent")).toBe(false)
	})

	it("should have frontmatter in command templates", async () => {
		const command = await getBuiltInNovelCommand(extensionPath, "write")

		expect(command).toBeDefined()
		// Command content should be the content after frontmatter
		expect(command?.content).toBeDefined()
		// Should have description from frontmatter
		expect(command?.description).toBeDefined()
	})
})
