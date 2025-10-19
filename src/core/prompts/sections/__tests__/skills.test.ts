import { SkillsManager } from "../../../../services/skills/SkillsManager"
import type { SkillSummary } from "@roo-code/types"
import { generateSkillsSection, extractActivatedSkills, findSkillByName } from "../skills"

// Mock SkillsManager
jest.mock("../../../../services/skills/SkillsManager")

describe("Skills System Prompt Integration", () => {
	let mockSkillsManager: jest.Mocked<SkillsManager>

	beforeEach(() => {
		mockSkillsManager = {
			getConfig: jest.fn(),
			getSkillsSummary: jest.fn(),
			getAllSkills: jest.fn(),
		} as any

		jest.clearAllMocks()
	})

	describe("generateSkillsSection", () => {
		it("should return empty string when skills are disabled", async () => {
			mockSkillsManager.getConfig.mockReturnValue({
				enabled: false,
				disabledSkills: [],
				perModeConfig: {},
			})

			const result = await generateSkillsSection(mockSkillsManager)
			expect(result).toBe("")
		})

		it("should return empty string when no skills available", async () => {
			mockSkillsManager.getConfig.mockReturnValue({
				enabled: true,
				disabledSkills: [],
				perModeConfig: {},
			})
			mockSkillsManager.getSkillsSummary.mockReturnValue([])

			const result = await generateSkillsSection(mockSkillsManager)
			expect(result).toBe("")
		})

		it("should generate skills section with available skills", async () => {
			const mockSkills: SkillSummary[] = [
				{
					id: "extension:fantasy-writing",
					name: "Fantasy World Building",
					description: "Guide for creating consistent fantasy worlds",
				},
				{
					id: "extension:romance-writing",
					name: "Romance Writing",
					description: "Best practices for writing romantic scenes",
				},
			]

			mockSkillsManager.getConfig.mockReturnValue({
				enabled: true,
				disabledSkills: [],
				perModeConfig: {},
			})
			mockSkillsManager.getSkillsSummary.mockReturnValue(mockSkills)

			const result = await generateSkillsSection(mockSkillsManager)

			expect(result).toContain("## Available Agent Skills")
			expect(result).toContain("**Fantasy World Building**")
			expect(result).toContain("Guide for creating consistent fantasy worlds")
			expect(result).toContain("**Romance Writing**")
			expect(result).toContain("Best practices for writing romantic scenes")
			expect(result).toContain("How to Use Skills:")
			expect(result).toContain("[USING SKILL: Fantasy World Building]")
		})

		it("should pass mode parameter to getSkillsSummary", async () => {
			mockSkillsManager.getConfig.mockReturnValue({
				enabled: true,
				disabledSkills: [],
				perModeConfig: {},
			})
			mockSkillsManager.getSkillsSummary.mockReturnValue([])

			await generateSkillsSection(mockSkillsManager, "code")

			expect(mockSkillsManager.getSkillsSummary).toHaveBeenCalledWith("code")
		})

		it("should include whenToUse in description if available", async () => {
			const mockSkills: SkillSummary[] = [
				{
					id: "extension:test",
					name: "Test Skill",
					description: "A test skill. Use when: Use when testing",
				},
			]

			mockSkillsManager.getConfig.mockReturnValue({
				enabled: true,
				disabledSkills: [],
				perModeConfig: {},
			})
			mockSkillsManager.getSkillsSummary.mockReturnValue(mockSkills)

			const result = await generateSkillsSection(mockSkillsManager)

			expect(result).toContain("A test skill. Use when: Use when testing")
		})

		it("should handle special characters in skill names and descriptions", async () => {
			const mockSkills: SkillSummary[] = [
				{
					id: "extension:special",
					name: 'Skill with "Quotes" & Symbols',
					description: "Description with <tags> and & symbols",
				},
			]

			mockSkillsManager.getConfig.mockReturnValue({
				enabled: true,
				disabledSkills: [],
				perModeConfig: {},
			})
			mockSkillsManager.getSkillsSummary.mockReturnValue(mockSkills)

			const result = await generateSkillsSection(mockSkillsManager)

			expect(result).toContain('Skill with "Quotes" & Symbols')
			expect(result).toContain("Description with <tags> and & symbols")
		})
	})

	describe("extractActivatedSkills", () => {
		it("should extract single skill activation", () => {
			const response = "Let me help you. [USING SKILL: Fantasy Writing] Here's what you need..."

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual(["Fantasy Writing"])
		})

		it("should extract multiple skill activations", () => {
			const response = `
[USING SKILL: Fantasy World Building]
Let me help with world building...

[USING SKILL: Consistency Checker]
I'll also check for consistency...
			`

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual(["Fantasy World Building", "Consistency Checker"])
		})

		it("should return empty array when no skills activated", () => {
			const response = "Here's a regular response without any skills."

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual([])
		})

		it("should trim whitespace from skill names", () => {
			const response = "[USING SKILL:   Fantasy Writing   ]"

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual(["Fantasy Writing"])
		})

		it("should handle skills with no space after colon", () => {
			const response = "[USING SKILL:Fantasy Writing]"

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual(["Fantasy Writing"])
		})

		it("should handle case-insensitive matching", () => {
			const response = "[using skill: Fantasy Writing]"

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual(["Fantasy Writing"])
		})

		it("should handle skills with special characters in names", () => {
			const response = "[USING SKILL: Code Review (Advanced)]"

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual(["Code Review (Advanced)"])
		})

		it("should handle multiple occurrences of same skill", () => {
			const response = `
[USING SKILL: Test Skill]
Some content...
[USING SKILL: Test Skill]
More content...
			`

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual(["Test Skill", "Test Skill"])
		})

		it("should not match incomplete patterns", () => {
			const response = `
[USING SKILL: Incomplete
[SKILL: Wrong Format]
USING SKILL: Not in brackets
			`

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual([])
		})

		it("should handle skills with hyphens and underscores", () => {
			const response = "[USING SKILL: fantasy-world_building]"

			const skills = extractActivatedSkills(response)

			expect(skills).toEqual(["fantasy-world_building"])
		})
	})

	describe("findSkillByName", () => {
		it("should find skill by exact name match", () => {
			const mockSkills = [
				{
					id: "extension:fantasy",
					name: "Fantasy Writing",
					description: "Fantasy guide",
					path: "/path",
					source: "extension" as const,
				},
				{
					id: "extension:romance",
					name: "Romance Writing",
					description: "Romance guide",
					path: "/path",
					source: "extension" as const,
				},
			]

			mockSkillsManager.getAllSkills.mockReturnValue(mockSkills)

			const skill = findSkillByName(mockSkillsManager, "Fantasy Writing")

			expect(skill).toBeDefined()
			expect(skill?.id).toBe("extension:fantasy")
		})

		it("should return undefined for non-existent skill", () => {
			mockSkillsManager.getAllSkills.mockReturnValue([])

			const skill = findSkillByName(mockSkillsManager, "Non-existent Skill")

			expect(skill).toBeUndefined()
		})

		it("should be case-sensitive", () => {
			const mockSkills = [
				{
					id: "extension:fantasy",
					name: "Fantasy Writing",
					description: "Fantasy guide",
					path: "/path",
					source: "extension" as const,
				},
			]

			mockSkillsManager.getAllSkills.mockReturnValue(mockSkills)

			const skill = findSkillByName(mockSkillsManager, "fantasy writing")

			expect(skill).toBeUndefined()
		})

		it("should return first match if multiple skills have same name", () => {
			const mockSkills = [
				{
					id: "extension:skill1",
					name: "Duplicate Name",
					description: "First",
					path: "/path1",
					source: "extension" as const,
				},
				{
					id: "project:skill2",
					name: "Duplicate Name",
					description: "Second",
					path: "/path2",
					source: "project" as const,
				},
			]

			mockSkillsManager.getAllSkills.mockReturnValue(mockSkills)

			const skill = findSkillByName(mockSkillsManager, "Duplicate Name")

			expect(skill?.id).toBe("extension:skill1")
		})

		it("should handle empty skills list", () => {
			mockSkillsManager.getAllSkills.mockReturnValue([])

			const skill = findSkillByName(mockSkillsManager, "Any Skill")

			expect(skill).toBeUndefined()
		})
	})

	describe("Integration scenarios", () => {
		it("should handle complete workflow: generate section -> extract activation -> find skill", async () => {
			// Setup
			const mockSkills = [
				{
					id: "extension:fantasy",
					name: "Fantasy Writing",
					description: "Fantasy guide",
					path: "/path",
					source: "extension" as const,
				},
			]

			const mockSkillsSummary: SkillSummary[] = [
				{
					id: "extension:fantasy",
					name: "Fantasy Writing",
					description: "Fantasy guide",
				},
			]

			mockSkillsManager.getConfig.mockReturnValue({
				enabled: true,
				disabledSkills: [],
				perModeConfig: {},
			})
			mockSkillsManager.getSkillsSummary.mockReturnValue(mockSkillsSummary)
			mockSkillsManager.getAllSkills.mockReturnValue(mockSkills)

			// Generate section
			const section = await generateSkillsSection(mockSkillsManager)
			expect(section).toContain("Fantasy Writing")

			// Extract activation from AI response
			const aiResponse = "[USING SKILL: Fantasy Writing] Let me help..."
			const activatedNames = extractActivatedSkills(aiResponse)
			expect(activatedNames).toEqual(["Fantasy Writing"])

			// Find skill by name
			const skill = findSkillByName(mockSkillsManager, activatedNames[0])
			expect(skill).toBeDefined()
			expect(skill?.id).toBe("extension:fantasy")
		})
	})

	describe("Performance", () => {
		it("should generate section quickly with many skills", async () => {
			const manySkills: SkillSummary[] = Array.from({ length: 100 }, (_, i) => ({
				id: `extension:skill${i}`,
				name: `Skill ${i}`,
				description: `Description ${i}`,
			}))

			mockSkillsManager.getConfig.mockReturnValue({
				enabled: true,
				disabledSkills: [],
				perModeConfig: {},
			})
			mockSkillsManager.getSkillsSummary.mockReturnValue(manySkills)

			const startTime = performance.now()
			await generateSkillsSection(mockSkillsManager)
			const endTime = performance.now()

			expect(endTime - startTime).toBeLessThan(10) // Should be < 10ms
		})

		it("should extract skills quickly from large response", () => {
			const largeResponse = "A".repeat(10000) + "[USING SKILL: Test]" + "B".repeat(10000)

			const startTime = performance.now()
			const skills = extractActivatedSkills(largeResponse)
			const endTime = performance.now()

			expect(skills).toEqual(["Test"])
			expect(endTime - startTime).toBeLessThan(5) // Should be < 5ms
		})
	})
})
