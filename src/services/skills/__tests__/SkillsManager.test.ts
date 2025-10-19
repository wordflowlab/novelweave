import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { SkillsManager } from "../SkillsManager"
import type { Skill } from "@roo-code/types"

// Mock vscode
jest.mock("vscode", () => ({
	ExtensionContext: jest.fn(),
	OutputChannel: jest.fn(),
}))

// Mock fs/promises
jest.mock("fs/promises")

describe("SkillsManager", () => {
	let context: vscode.ExtensionContext
	let skillsManager: SkillsManager
	let mockOutputChannel: any

	beforeEach(() => {
		// Reset singleton instance
		;(SkillsManager as any).instance = undefined

		// Create mock context
		mockOutputChannel = {
			appendLine: jest.fn(),
		}

		context = {
			extensionUri: { fsPath: "/mock/extension/path" },
			globalStorageUri: { fsPath: "/mock/global/storage" },
			globalState: {
				get: jest.fn().mockReturnValue(undefined),
				update: jest.fn().mockResolvedValue(undefined),
			},
		} as any

		// Clear all mocks
		jest.clearAllMocks()
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	describe("Singleton Pattern", () => {
		it("should create a single instance", () => {
			const instance1 = SkillsManager.getInstance(context)
			const instance2 = SkillsManager.getInstance(context)
			expect(instance1).toBe(instance2)
		})

		it("should return the same instance even with different context", () => {
			const instance1 = SkillsManager.getInstance(context)
			const anotherContext = { ...context } as any
			const instance2 = SkillsManager.getInstance(anotherContext)
			expect(instance1).toBe(instance2)
		})
	})

	describe("Skill Paths Generation", () => {
		it("should generate all three skill paths", () => {
			skillsManager = SkillsManager.getInstance(context)
			const paths = (skillsManager as any).getSkillsPaths()

			expect(paths).toHaveLength(3)
			expect(paths[0][0]).toBe("extension")
			expect(paths[1][0]).toBe("project")
			expect(paths[2][0]).toBe("personal")
		})

		it("should include extension skills path", () => {
			skillsManager = SkillsManager.getInstance(context)
			const paths = (skillsManager as any).getSkillsPaths()

			const extensionPath = paths.find((p: any) => p[0] === "extension")
			expect(extensionPath).toBeDefined()
			expect(extensionPath[1]).toContain("dist/templates/skills")
		})
	})

	describe("Skill File Parsing", () => {
		it("should parse valid SKILL.md with all fields", async () => {
			const content = `---
name: Test Skill
description: A test skill description
version: 1.0.0
keywords: [test, sample]
allowed_tool_groups: [read, edit]
when_to_use: When testing
required_modes: [code]
mcp_resources: [resource://test]
---

# Test Skill Content

This is the skill content.`

			const skill = await (skillsManager as any).parseSkillFile(
				"/path/to/test-skill/SKILL.md",
				"test-skill",
				"extension",
				content,
			)

			expect(skill).toBeDefined()
			expect(skill.name).toBe("Test Skill")
			expect(skill.description).toBe("A test skill description")
			expect(skill.version).toBe("1.0.0")
			expect(skill.keywords).toEqual(["test", "sample"])
			expect(skill.allowedToolGroups).toEqual(["read", "edit"])
			expect(skill.whenToUse).toBe("When testing")
			expect(skill.requiredModes).toEqual(["code"])
			expect(skill.mcpResources).toEqual(["resource://test"])
		})

		it("should parse SKILL.md with only required fields", async () => {
			const content = `---
name: Minimal Skill
description: Minimal description
---

# Content`

			const skill = await (skillsManager as any).parseSkillFile(
				"/path/to/minimal/SKILL.md",
				"minimal",
				"project",
				content,
			)

			expect(skill).toBeDefined()
			expect(skill.name).toBe("Minimal Skill")
			expect(skill.description).toBe("Minimal description")
			expect(skill.version).toBeUndefined()
			expect(skill.keywords).toBeUndefined()
		})

		it("should return null for SKILL.md missing required name field", async () => {
			const content = `---
description: Missing name
---

# Content`

			const skill = await (skillsManager as any).parseSkillFile(
				"/path/to/invalid/SKILL.md",
				"invalid",
				"extension",
				content,
			)

			expect(skill).toBeNull()
		})

		it("should return null for SKILL.md missing required description field", async () => {
			const content = `---
name: Missing Description
---

# Content`

			const skill = await (skillsManager as any).parseSkillFile(
				"/path/to/invalid/SKILL.md",
				"invalid",
				"extension",
				content,
			)

			expect(skill).toBeNull()
		})

		it("should return null for invalid YAML", async () => {
			const content = `---
name: Invalid YAML
description: { broken yaml
---

# Content`

			const skill = await (skillsManager as any).parseSkillFile(
				"/path/to/invalid/SKILL.md",
				"invalid",
				"extension",
				content,
			)

			expect(skill).toBeNull()
		})
	})

	describe("Skill ID Generation", () => {
		it("should generate ID with source and directory name", () => {
			const id = (skillsManager as any).generateSkillId("extension", "fantasy-writing")
			expect(id).toBe("extension:fantasy-writing")
		})

		it("should handle different sources", () => {
			expect((skillsManager as any).generateSkillId("personal", "my-skill")).toBe("personal:my-skill")
			expect((skillsManager as any).generateSkillId("project", "team-skill")).toBe("project:team-skill")
		})
	})

	describe("Support Files Discovery", () => {
		beforeEach(() => {
			;(fs.readdir as jest.Mock).mockResolvedValue([])
		})

		it("should find support files in skill directory", async () => {
			;(fs.readdir as jest.Mock).mockResolvedValue([
				{ name: "SKILL.md", isDirectory: () => false },
				{ name: "examples.md", isDirectory: () => false },
				{ name: "templates", isDirectory: () => true },
			])

			const supportFiles = await (skillsManager as any).findSupportFiles("/path/to/skill")

			expect(supportFiles).toContain("examples.md")
			expect(supportFiles).not.toContain("SKILL.md")
		})

		it("should handle empty directory", async () => {
			;(fs.readdir as jest.Mock).mockResolvedValue([{ name: "SKILL.md", isDirectory: () => false }])

			const supportFiles = await (skillsManager as any).findSupportFiles("/path/to/skill")

			expect(supportFiles).toEqual([])
		})

		it("should handle directory without SKILL.md", async () => {
			;(fs.readdir as jest.Mock).mockResolvedValue([{ name: "other.md", isDirectory: () => false }])

			const supportFiles = await (skillsManager as any).findSupportFiles("/path/to/skill")

			expect(supportFiles).toContain("other.md")
		})
	})

	describe("Configuration Management", () => {
		it("should return default config when not set", () => {
			;(context.globalState.get as jest.Mock).mockReturnValue(undefined)

			skillsManager = SkillsManager.getInstance(context)
			const config = skillsManager.getConfig()

			expect(config).toEqual({
				enabled: true,
				disabledSkills: [],
				perModeConfig: {},
			})
		})

		it("should return stored config", () => {
			const storedConfig = {
				enabled: false,
				disabledSkills: ["skill1"],
				perModeConfig: { code: { enabledSkills: ["skill2"] } },
			}
			;(context.globalState.get as jest.Mock).mockReturnValue(storedConfig)

			skillsManager = SkillsManager.getInstance(context)
			const config = skillsManager.getConfig()

			expect(config).toEqual(storedConfig)
		})

		it("should update config", async () => {
			skillsManager = SkillsManager.getInstance(context)
			await skillsManager.initialize()

			const newConfig = {
				enabled: false,
				disabledSkills: ["test-skill"],
				perModeConfig: {},
			}

			await skillsManager.updateConfig(newConfig)

			expect(context.globalState.update).toHaveBeenCalledWith("skillsConfig", newConfig)
		})
	})

	describe("Skills Activation", () => {
		beforeEach(async () => {
			skillsManager = SkillsManager.getInstance(context)
			await skillsManager.initialize()

			// Add a mock skill
			;(skillsManager as any).skills.set("extension:test-skill", {
				id: "extension:test-skill",
				name: "Test Skill",
				description: "Test",
				path: "/path/to/test",
				source: "extension",
			})
		})

		it("should activate a skill", async () => {
			await skillsManager.activateSkill("extension:test-skill")

			const activeSkills = skillsManager.getActiveSkills()
			expect(activeSkills).toHaveLength(1)
			expect(activeSkills[0].id).toBe("extension:test-skill")
		})

		it("should not activate the same skill twice", async () => {
			await skillsManager.activateSkill("extension:test-skill")
			await skillsManager.activateSkill("extension:test-skill")

			const activeSkills = skillsManager.getActiveSkills()
			expect(activeSkills).toHaveLength(1)
		})

		it("should deactivate a skill", async () => {
			await skillsManager.activateSkill("extension:test-skill")
			skillsManager.deactivateSkill("extension:test-skill")

			const activeSkills = skillsManager.getActiveSkills()
			expect(activeSkills).toHaveLength(0)
		})

		it("should throw error when activating non-existent skill", async () => {
			await expect(skillsManager.activateSkill("nonexistent")).rejects.toThrow()
		})
	})

	describe("Skills Query", () => {
		beforeEach(async () => {
			skillsManager = SkillsManager.getInstance(context)
			await skillsManager.initialize()

			// Add mock skills
			;(skillsManager as any).skills.set("extension:skill1", {
				id: "extension:skill1",
				name: "Skill 1",
				description: "Test 1",
				path: "/path/1",
				source: "extension",
			})
			;(skillsManager as any).skills.set("project:skill2", {
				id: "project:skill2",
				name: "Skill 2",
				description: "Test 2",
				path: "/path/2",
				source: "project",
			})
		})

		it("should return all skills", () => {
			const skills = skillsManager.getAllSkills()
			expect(skills).toHaveLength(2)
		})

		it("should get skills summary without mode filter", () => {
			const summary = skillsManager.getSkillsSummary()
			expect(summary).toHaveLength(2)
			expect(summary[0]).toHaveProperty("id")
			expect(summary[0]).toHaveProperty("name")
			expect(summary[0]).toHaveProperty("description")
		})

		it("should filter disabled skills from summary", () => {
			;(context.globalState.get as jest.Mock).mockReturnValue({
				enabled: true,
				disabledSkills: ["extension:skill1"],
				perModeConfig: {},
			})

			skillsManager = SkillsManager.getInstance(context)
			;(skillsManager as any).skills.set("extension:skill1", {
				id: "extension:skill1",
				name: "Skill 1",
				description: "Test 1",
				path: "/path/1",
				source: "extension",
			})

			const summary = skillsManager.getSkillsSummary()
			expect(summary).toHaveLength(0)
		})

		it("should filter skills by required modes", () => {
			;(skillsManager as any).skills.set("extension:code-skill", {
				id: "extension:code-skill",
				name: "Code Skill",
				description: "For code mode",
				path: "/path/code",
				source: "extension",
				requiredModes: ["code"],
			})

			const codeSummary = skillsManager.getSkillsSummary("code")
			const askSummary = skillsManager.getSkillsSummary("ask")

			expect(codeSummary.some((s) => s.id === "extension:code-skill")).toBe(true)
			expect(askSummary.some((s) => s.id === "extension:code-skill")).toBe(false)
		})
	})

	describe("Content Loading", () => {
		beforeEach(async () => {
			skillsManager = SkillsManager.getInstance(context)
			await skillsManager.initialize()

			const mockSkill = {
				id: "extension:test",
				name: "Test",
				description: "Test",
				path: "/path/to/test/SKILL.md",
				source: "extension" as const,
			}
			;(skillsManager as any).skills.set("extension:test", mockSkill)
		})

		it("should load skill content and cache it", async () => {
			const mockContent = `---
name: Test
description: Test
---

# Skill Content`

			;(fs.readFile as jest.Mock).mockResolvedValue(mockContent)

			const content1 = await skillsManager.loadSkillContent("extension:test")
			const content2 = await skillsManager.loadSkillContent("extension:test")

			expect(content1).toContain("# Skill Content")
			expect(content2).toBe(content1)
			expect(fs.readFile).toHaveBeenCalledTimes(1) // Cached
		})

		it("should throw error for non-existent skill", async () => {
			await expect(skillsManager.loadSkillContent("nonexistent")).rejects.toThrow("Skill not found")
		})
	})

	describe("Performance", () => {
		it("should scan skills in reasonable time", async () => {
			;(fs.access as jest.Mock).mockResolvedValue(undefined)
			;(fs.readdir as jest.Mock).mockResolvedValue([])

			skillsManager = SkillsManager.getInstance(context)

			const startTime = performance.now()
			await skillsManager.initialize()
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(100) // Should complete in < 100ms for empty dirs
		})
	})
})
