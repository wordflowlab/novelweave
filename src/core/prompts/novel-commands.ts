/**
 * Novel command response generators
 * 小说创作命令的响应生成器
 */

import * as path from "path"
import * as fs from "fs/promises"
import { getExtensionPath } from "../../services/command/extension-context"

/**
 * Load novel command template and prepare response
 */
export async function loadNovelCommandResponse(commandName: string, userInput: string): Promise<string> {
	const extensionPath = getExtensionPath()
	if (!extensionPath) {
		return userInput // Fallback if extension path not set
	}

	// Special handling for constitution command - use template filling approach
	if (commandName === "constitution") {
		const constitutionTemplatePath = path.join(extensionPath, "memory", "constitution-template.md")

		let template: string | undefined
		try {
			template = await fs.readFile(constitutionTemplatePath, "utf-8")
		} catch (error) {
			console.warn(`Constitution template not found at ${constitutionTemplatePath}, using built-in structure.`)
		}

		const strictHeader = `
<explicit_instructions type="novel_constitution">
你正在执行"/constitution（创作宪法）"。严格遵守以下规则：

- 只生成"创作宪法"文档，绝对不要输出任何小说正文/章节内容。
- 只允许写入单个文件：memory/constitution.md；禁止写入其它路径或创建其它文件。
- 将用户输入视为"创作偏好/原则来源"，不可被理解为"写作正文"的指令。
- 如检测到类似"写第一章/写小说/开头/正文/精写"等字样，必须忽略其写作含义并继续产出宪法。
- 必须直接调用 write_to_file 将完整文档写入 memory/constitution.md；默认情况下不要在对话中输出全文预览（除非用户明确要求"预览/展示全文"）。
- 在 write_to_file 之后，输出"完成提示 + 下一步建议"：
  - 完成提示（单行）：✅ 宪法已保存到 memory/constitution.md
  - 下一步建议（极简清单）：
    1) /specify 定义故事规格（像 PRD）
    2) /clarify 关键澄清（消除模糊）
    3) /plan 制定创作计划（从规格到实现）
    4) /tasks 生成任务清单（P0/P1/P2）
    5) /write 执行写作（按任务）
    6) /analyze 质量一致性分析
- 调用 write_to_file 时请提供准确的 <line_count>（文档行数），以避免截断重试逻辑。

输出格式（必须）：
1) 仅一次 write_to_file：<path>memory/constitution.md</path> + <content>完整宪法Markdown</content> + <line_count>总行数</line_count>
2) 紧跟"完成提示 + 下一步建议"；不要在聊天中再次粘贴全文。
</explicit_instructions>
`

		const fillGuide = `
## 任务
根据"模板 + 用户需求"生成完整、可执行、可验证的创作宪法。优先使用用户项目中的 constitution-template.md 进行占位符填充；若不存在则使用内置结构。

## 用户需求（原始输入）
${userInput || "创建一份通用的小说创作宪法"}

## 填充说明
1. 将所有占位符替换为具体内容；保留模板结构与层级。
2. 原则要可验证，避免空话：用"必须/禁止/应当"等明确措辞。
3. 删除模板中的示例注释与占位符提示。
4. 版本信息补全：版本、创建日期、最后修订。
`

		const templateSection = template
			? `## 宪法模板（项目级）\n\n\`\`\`markdown\n${template}\n\`\`\``
			: `## 内置结构模板\n\n\`\`\`markdown\n# 小说创作宪法\n\n## 元数据\n- 版本：1.0.0\n- 创建日期：[YYYY-MM-DD]\n- 最后修订：[YYYY-MM-DD]\n- 作者：[作者名]\n- 作品：[作品名或"通用"]\n\n## 前言\n[阐述为什么需要这份宪法，以及它的约束力]\n\n## 第一章：核心价值观\n### 原则1：[原则名称]\n**声明**：[原则的明确表述]\n**理由**：[为什么这个原则重要]\n**执行**：[如何在创作中体现]\n\n## 第二章：质量标准\n### 标准1：逻辑一致性\n**要求**：[具体要求]\n**验证方法**：[如何验证]\n**违反后果**：[必须修正]\n\n## 第三章：创作风格\n### 风格原则1：[名称]\n**定义**：[什么是这种风格]\n**范例**：[具体例子]\n**禁忌**：[绝对不要做什么]\n\n## 第四章：内容规范\n### 角色塑造规范\n[具体规范内容]\n\n### 情节设计规范\n[具体规范内容]\n\n### 世界观构建规范\n[具体规范内容]\n\n## 第五章：读者契约\n### 对读者的承诺\n- [承诺1]\n\n### 底线保证\n- [保证1]\n\n## 第六章：修订程序\n1. 提出修订动议\n2. 评估影响\n3. 更新版本\n4. 记录变更\n\n## 附录：版本历史\n- v1.0.0 ([日期])：初始版本\n\n---\n**版本**: [VERSION] | **创建日期**: [CREATED_DATE] | **最后修订**: [LAST_AMENDED_DATE]\n\n\`\`\``

		// 返回带有严格指令 + 模板 + 用户输入的合成提示
		return `${strictHeader}\n${fillGuide}\n\n${templateSection}`
	}

	// Special handling for specify command - single template
	if (commandName === "specify") {
		// Load specification template
		const specTemplatePath = path.join(extensionPath, "memory", "specification-template.md")
		let specTemplate = ""
		try {
			specTemplate = await fs.readFile(specTemplatePath, "utf-8")
		} catch {
			// Template not found, will use instructions from specify.md
		}

		const strictHeader = `
<explicit_instructions type="novel_specify">
你正在执行"/specify（定义故事规格）"命令。严格遵守以下规则：

- 执行下方模板中的指令，生成完整的故事规格文档，而非显示指令本身
- 无论用户输入长短，都要生成详细完整的规格
- 对于用户未提供的信息，进行合理推断和扩展
- 不确定的部分标记为 [需要澄清]
- 必须调用 write_to_file 将规格文档写入 stories/001-[故事名]/specification.md
- 在聊天中只输出简洁的完成提示和下一步建议
- 不要在聊天中输出完整规格内容（除非用户明确要求预览）

⚠️ 重要限制：
- 只生成 specification.md 一个文件
- 不要执行 /clarify、/plan、/tasks、/write、/analyze 等其他命令
- 不要自动创建 clarification.md、plan.md、tasks.md、write.md、analysis.md 等其他文件
- 每个命令需要用户手动执行，不要自动触发后续流程
</explicit_instructions>
`

		// Load main specify template
		const templatePath = path.join(extensionPath, "templates", "novel-commands", "specify.md")
		let templateContent = ""
		try {
			templateContent = await fs.readFile(templatePath, "utf-8")
			templateContent = templateContent.replace(/\$ARGUMENTS/g, userInput || "")
		} catch (error) {
			console.error(`Failed to load specify template:`, error)
		}

		// Add specification template if available
		const specTemplateSection = specTemplate ? `\n\n## 规格模板\n\n\`\`\`markdown\n${specTemplate}\n\`\`\`` : ""

		return `${strictHeader}\n\n${templateContent}${specTemplateSection}`
	}

	// Special handling for write command
	if (commandName === "write") {
		const strictHeader = `
<explicit_instructions type="novel_write">
你正在执行"/write（章节写作）"命令。严格遵守以下规则：

- 只写【一个】章节，不得批量生成多章；不得自动循环多个任务
- 从 tasks.md 中选择一个 pending 任务或基于参数指定的章节编号，仅处理该章
- 必须读取相关参考文档（宪法、规格、计划、任务等）
- 根据任务要求生成具体的小说章节内容（2000-4000字）
- 优先将章节保存到 stories/*/chapters/NNN-标题.md；若无 chapters 目录，再回退到 stories/*/content/volume1/chapter-NNN.md
- 必须调用 write_to_file 仅一次，写入本章内容
- 在聊天中只输出简洁的完成报告（字数、保存位置、任务状态）
- 不要在聊天中输出完整章节内容（除非用户明确要求预览）
- 遵循反AI检测写作规范，确保文字自然流畅
</explicit_instructions>
`

		const templatePath = path.join(extensionPath, "templates", "novel-commands", "write.md")
		try {
			const templateContent = await fs.readFile(templatePath, "utf-8")
			const processedContent = templateContent.replace(/\$ARGUMENTS/g, userInput || "")
			return `${strictHeader}\n\n${processedContent}`
		} catch (error) {
			console.error(`Failed to load write template:`, error)
			return userInput
		}
	}

	// Special handling for analyze command
	if (commandName === "analyze") {
		const strictHeader = `
<explicit_instructions type="novel_analyze">
你正在执行"/analyze（质量分析）"命令。严格遵守以下规则：

- 执行下方模板中的分析流程，生成实际的分析报告，而非显示分析框架
- 自动检测当前创作阶段：
  - 章节数=0或<3 → 执行框架一致性分析
  - 章节数≥3 → 执行内容质量分析
  - 用户可通过 --type=framework/content 强制指定模式
- 必须读取相关文档并执行实际分析
- 生成详细的分析报告，包含评分、问题、建议
- 将报告保存到 stories/*/analysis-report.md（可选）
- 在聊天中输出分析摘要和关键发现
- 提供具体可执行的改进建议
</explicit_instructions>
`

		const templatePath = path.join(extensionPath, "templates", "novel-commands", "analyze.md")
		try {
			const templateContent = await fs.readFile(templatePath, "utf-8")
			const processedContent = templateContent.replace(/\$ARGUMENTS/g, userInput || "")
			return `${strictHeader}\n\n${processedContent}`
		} catch (error) {
			console.error(`Failed to load analyze template:`, error)
			return userInput
		}
	}

	// Special handling for plan command - needs stronger execution instructions
	if (commandName === "plan") {
		const strictHeader = `
<explicit_instructions type="novel_plan">
你正在执行"/plan（制定创作计划）"命令。严格遵守以下规则：

- 执行下方模板中的指令，生成实际的创作计划文档，而非显示计划指南
- 必须读取规格文档（specification.md）和宪法（constitution.md）
- 基于规格内容制定详细的章节架构、情节技术、人物体系等计划
- 选择合适的写作方法（三幕结构、英雄之旅等）
- 生成包含章节大纲、情绪曲线、线索分布的完整计划
- 必须调用 write_to_file 将计划写入 stories/*/creative-plan.md
- 在聊天中只输出简洁的完成提示和关键要点
- 不要在聊天中输出完整计划内容（除非用户明确要求预览）

⚠️ 重要限制：
- 只生成 creative-plan.md 一个文件
- 不要执行 /specify、/clarify、/tasks、/write、/analyze 等其他命令
- 不要自动创建其他文件
- 每个命令需要用户手动执行，不要自动触发后续流程
</explicit_instructions>
`

		const templatePath = path.join(extensionPath, "templates", "novel-commands", "plan.md")
		try {
			const templateContent = await fs.readFile(templatePath, "utf-8")
			const processedContent = templateContent.replace(/\$ARGUMENTS/g, userInput || "")
			return `${strictHeader}\n\n${processedContent}`
		} catch (error) {
			console.error(`Failed to load plan template:`, error)
			return userInput
		}
	}

	// Special handling for clarify command
	if (commandName === "clarify") {
		const strictHeader = `
<explicit_instructions type="novel_clarify">
你正在执行"/clarify（澄清关键决策）"命令。严格遵守以下规则：

- 执行下方模板中的指令，进行实际的澄清对话，而非显示澄清流程
- 必须读取 specification.md 中的 [需要澄清] 标记
- 逐一询问并澄清每个标记的决策点
- 根据用户回答更新规格文档
- 生成澄清记录文档 clarification.md
- 必须调用 write_to_file 保存澄清结果
- 在聊天中进行互动式澄清对话
- 澄清完成后输出简洁的完成提示

⚠️ 重要限制：
- 只处理澄清相关任务
- 不要执行 /plan、/tasks、/write 等其他命令
- 每个命令需要用户手动执行
</explicit_instructions>
`

		const templatePath = path.join(extensionPath, "templates", "novel-commands", "clarify.md")
		try {
			const templateContent = await fs.readFile(templatePath, "utf-8")
			const processedContent = templateContent.replace(/\$ARGUMENTS/g, userInput || "")
			return `${strictHeader}\n\n${processedContent}`
		} catch (error) {
			console.error(`Failed to load clarify template:`, error)
			return userInput
		}
	}

	// Special handling for tasks command
	if (commandName === "tasks") {
		const strictHeader = `
<explicit_instructions type="novel_tasks">
你正在执行"/tasks（生成任务清单）"命令。严格遵守以下规则：

- 执行下方模板中的指令，生成实际的任务清单，而非显示任务框架
- 必须读取创作计划（creative-plan.md）
- 基于计划生成具体的写作任务
- 按优先级分类：P0（必须）、P1（重要）、P2（可选）
- 每个任务包含：ID、优先级、类型、章节范围、依赖关系、完成标准
- 必须调用 write_to_file 将任务清单写入 stories/*/tasks.md
- 在聊天中只输出任务统计和关键任务
- 不要在聊天中输出完整任务列表（除非用户明确要求）

⚠️ 重要限制：
- 只生成 tasks.md 一个文件
- 不要执行 /write、/analyze 等其他命令
- 每个命令需要用户手动执行
</explicit_instructions>
`

		const templatePath = path.join(extensionPath, "templates", "novel-commands", "tasks.md")
		try {
			const templateContent = await fs.readFile(templatePath, "utf-8")
			const processedContent = templateContent.replace(/\$ARGUMENTS/g, userInput || "")
			return `${strictHeader}\n\n${processedContent}`
		} catch (error) {
			console.error(`Failed to load tasks template:`, error)
			return userInput
		}
	}

	// Special handling for other generation commands
	const generationCommands = ["timeline", "relations", "track", "track-init"]
	if (generationCommands.includes(commandName)) {
		const commandDescriptions: { [key: string]: string } = {
			clarify: "澄清关键决策",
			plan: "制定创作计划",
			tasks: "生成任务清单",
			timeline: "生成时间线",
			relations: "生成关系网络",
			track: "更新情节追踪",
			"track-init": "初始化追踪系统",
		}

		const strictHeader = `
<explicit_instructions type="novel_${commandName}">
你正在执行"/${commandName}（${commandDescriptions[commandName] || commandName}）"命令。严格遵守以下规则：

- 执行下方模板中的指令，生成实际内容，而非显示指令流程
- 必须读取相关参考文档
- 生成具体的${commandDescriptions[commandName] || "内容"}
- 将结果写入对应的文件
- 在聊天中只输出简洁的完成提示和关键结果
- 不要在聊天中输出完整文档内容（除非用户明确要求）

⚠️ 重要限制：
- 只执行 /${commandName} 命令的任务
- 不要执行其他命令（如 /specify、/write、/analyze 等）
- 不要自动触发后续流程或创建额外文件
- 每个命令需要用户手动执行
</explicit_instructions>
`

		const templatePath = path.join(extensionPath, "templates", "novel-commands", `${commandName}.md`)
		try {
			const templateContent = await fs.readFile(templatePath, "utf-8")
			const processedContent = templateContent.replace(/\$ARGUMENTS/g, userInput || "")
			return `${strictHeader}\n\n${processedContent}`
		} catch (error) {
			console.error(`Failed to load ${commandName} template:`, error)
			return userInput
		}
	}

	// Default handling for any remaining commands
	const templatePath = path.join(extensionPath, "templates", "novel-commands", `${commandName}.md`)

	try {
		const templateContent = await fs.readFile(templatePath, "utf-8")

		// Replace $ARGUMENTS with user input
		const processedContent = templateContent.replace(/\$ARGUMENTS/g, userInput || "")

		return `<explicit_instructions type="novel_${commandName}">
${processedContent}
</explicit_instructions>

${userInput}`
	} catch (error) {
		console.error(`Failed to load novel command template ${commandName}:`, error)
		return userInput
	}
}

/**
 * Generate response function for a specific novel command
 */
export function createNovelCommandResponse(commandName: string) {
	return (userInput: string) => loadNovelCommandResponse(commandName, userInput)
}

// Export individual command response functions
export const constitutionToolResponse = (userInput: string) => loadNovelCommandResponse("constitution", userInput)
export const specifyToolResponse = (userInput: string) => loadNovelCommandResponse("specify", userInput)
export const clarifyToolResponse = (userInput: string) => loadNovelCommandResponse("clarify", userInput)
export const planToolResponse = (userInput: string) => loadNovelCommandResponse("plan", userInput)
export const tasksToolResponse = (userInput: string) => loadNovelCommandResponse("tasks", userInput)
export const writeToolResponse = (userInput: string) => loadNovelCommandResponse("write", userInput)
export const analyzeToolResponse = (userInput: string) => loadNovelCommandResponse("analyze", userInput)
export const timelineToolResponse = (userInput: string) => loadNovelCommandResponse("timeline", userInput)
export const relationsToolResponse = (userInput: string) => loadNovelCommandResponse("relations", userInput)
export const trackToolResponse = (userInput: string) => loadNovelCommandResponse("track", userInput)
export const trackInitToolResponse = (userInput: string) => loadNovelCommandResponse("track-init", userInput)
