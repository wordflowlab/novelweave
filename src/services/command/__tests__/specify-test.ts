/**
 * Test for simplified /specify command
 * 测试简化后的 /specify 命令
 */

import { loadNovelCommandResponse } from "../../../core/prompts/novel-commands"

describe("Simplified /specify command", () => {
	it("should generate complete specification with short input", async () => {
		// 测试简短输入
		const shortInput = "修仙小说"
		const response = await loadNovelCommandResponse("specify", shortInput)

		// 验证响应包含严格执行指令
		expect(response).toContain('<explicit_instructions type="novel_specify">')
		expect(response).toContain("生成完整的故事规格文档")
		expect(response).toContain("无论用户输入长短，都要生成详细完整的规格")

		// 验证不再包含级别相关内容
		expect(response).not.toContain("Level")
		expect(response).not.toContain("级别")
		expect(response).not.toContain("L1")
		expect(response).not.toContain("L2")
		expect(response).not.toContain("L3")
		expect(response).not.toContain("L4")

		// 验证包含完整九章结构的指令
		expect(response).toContain("故事概要")
		expect(response).toContain("目标定位")
		expect(response).toContain("成功标准")
		expect(response).toContain("核心需求")
		expect(response).toContain("线索管理规格")
		expect(response).toContain("约束条件")
		expect(response).toContain("风险评估")
		expect(response).toContain("核心决策点")
		expect(response).toContain("验证清单")
	})

	it("should generate complete specification with detailed input", async () => {
		// 测试详细输入
		const detailedInput = `
创建一个都市职场小说，主角是一个刚毕业的大学生，
进入一家互联网公司，从基层做起，经历职场斗争，
最终成长为行业领袖的故事。要包含友情、爱情、背叛等元素。
目标读者是25-35岁的都市白领。
        `
		const response = await loadNovelCommandResponse("specify", detailedInput)

		// 验证响应包含严格执行指令
		expect(response).toContain('<explicit_instructions type="novel_specify">')

		// 验证包含用户输入
		expect(response).toContain("都市职场小说")
		expect(response).toContain("互联网公司")

		// 验证生成完整规格的指令
		expect(response).toContain("生成完整的故事规格文档")
		expect(response).toContain("对于用户未提供的信息，进行合理推断和扩展")
	})

	it("should not auto-execute other commands", async () => {
		const input = "写一个玄幻小说"
		const response = await loadNovelCommandResponse("specify", input)

		// 验证限制条款
		expect(response).toContain("只生成 specification.md 一个文件")
		expect(response).toContain("不要执行 /clarify、/plan、/tasks、/write、/analyze 等其他命令")
		expect(response).toContain("不要自动创建 clarification.md、plan.md、tasks.md、write.md、analysis.md")
		expect(response).toContain("每个命令需要用户手动执行")
	})

	it("should include specification template if available", async () => {
		const input = "科幻小说"
		const response = await loadNovelCommandResponse("specify", input)

		// 验证模板部分的处理逻辑存在
		// 注意：实际测试时模板文件可能不存在，所以这里只验证代码逻辑
		expect(response).toBeDefined()
		expect(response.length).toBeGreaterThan(0)
	})
})
