import { SkillsManager } from "../../../services/skills/SkillsManager"
import type { SkillSummary } from "@roo-code/types"

/**
 * 生成 Skills section（用于 System Prompt）
 */
export async function generateSkillsSection(skillsManager: SkillsManager, mode?: string): Promise<string> {
	const config = skillsManager.getConfig()

	if (!config.enabled) {
		return ""
	}

	const skills = skillsManager.getSkillsSummary(mode)

	if (skills.length === 0) {
		return ""
	}

	// Generate skills list
	const skillsList = skills.map((skill) => `- **${skill.name}**: ${skill.description}`).join("\n")

	// Example skill name for demonstration
	const exampleSkillName = skills[0]?.name || "Skill Name"

	return `

## Available Agent Skills

You have access to specialized knowledge through Agent Skills. These are modular capabilities that you can use when relevant to the user's request.

**Available Skills:**

${skillsList}

**How to Use Skills:**

1. When a skill is relevant to the user's request, announce it:
   \`[USING SKILL: ${exampleSkillName}]\`

2. I will then provide you with the full skill content

3. Follow the skill's instructions carefully

4. You can use multiple skills in a single response if needed

5. Skills are discoverable - only use them when they add value

**Important:** Only announce skills that are directly relevant to the current task. Don't use skills just because they're available.
`
}

/**
 * 从 AI 响应中提取激活的 Skills
 */
export function extractActivatedSkills(response: string): string[] {
	const pattern = /\[USING SKILL:\s*([^\]]+)\]/gi
	const matches = Array.from(response.matchAll(pattern))
	return matches.map((m) => m[1].trim())
}

/**
 * 根据名称查找 Skill
 */
export function findSkillByName(skillsManager: SkillsManager, name: string): SkillSummary | undefined {
	const allSkills = skillsManager.getSkillsSummary()
	return allSkills.find(
		(skill) => skill.name.toLowerCase() === name.toLowerCase() || skill.id.toLowerCase() === name.toLowerCase(),
	)
}

/**
 * 生成中文版 Skills section
 */
export async function generateSkillsSectionZh(skillsManager: SkillsManager, mode?: string): Promise<string> {
	const config = skillsManager.getConfig()

	if (!config.enabled) {
		return ""
	}

	const skills = skillsManager.getSkillsSummary(mode)

	if (skills.length === 0) {
		return ""
	}

	const skillsList = skills.map((skill) => `- **${skill.name}**: ${skill.description}`).join("\n")
	const exampleSkillName = skills[0]?.name || "技能名称"

	return `

## 可用的 Agent Skills

您可以通过 Agent Skills 访问专业知识。这些是模块化的能力，您可以在与用户请求相关时使用它们。

**可用的 Skills:**

${skillsList}

**使用方法:**

1. 当某个 Skill 与用户请求相关时，声明它：
   \`[USING SKILL: ${exampleSkillName}]\`

2. 然后我会为您提供完整的 Skill 内容

3. 仔细遵循 Skill 的指令

4. 如果需要，您可以在一个响应中使用多个 Skills

5. Skills 是可发现的 - 仅在它们有价值时使用

**重要提示:** 只声明与当前任务直接相关的 Skills。不要仅仅因为它们可用就使用它们。
`
}
