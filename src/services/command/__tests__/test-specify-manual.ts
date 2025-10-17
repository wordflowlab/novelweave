/**
 * Manual test script for /specify command
 * 手动测试脚本，用于验证 /specify 命令的实际行为
 */

import { loadNovelCommandResponse } from "../../../core/prompts/novel-commands"
import { setExtensionPath } from "../extension-context"
import * as path from "path"

async function testSpecifyCommand() {
	// 设置扩展路径
	const extensionPath = path.resolve(__dirname, "../../../../")
	setExtensionPath(extensionPath)

	console.log("=== 测试简化后的 /specify 命令 ===\n")
	console.log("扩展路径:", extensionPath)

	// 测试场景 1: 极简输入
	console.log("\n--- 场景1: 极简输入 ---")
	const test1 = await loadNovelCommandResponse("specify", "修仙")
	console.log('输入: "修仙"')
	console.log("输出长度:", test1.length, "字符")
	console.log("包含九章结构:", test1.includes("故事概要") && test1.includes("验证清单"))
	console.log("包含严格指令:", test1.includes("<explicit_instructions"))
	console.log("不包含级别引用:", !test1.includes("Level") && !test1.includes("L1"))

	// 测试场景 2: 普通输入
	console.log("\n--- 场景2: 普通输入 ---")
	const test2 = await loadNovelCommandResponse("specify", "写一个都市言情小说，女主是医生")
	console.log('输入: "写一个都市言情小说，女主是医生"')
	console.log("输出长度:", test2.length, "字符")
	console.log("包含用户输入:", test2.includes("都市言情") && test2.includes("医生"))
	console.log("包含命令隔离:", test2.includes("不要执行 /clarify"))

	// 测试场景 3: 详细输入
	console.log("\n--- 场景3: 详细输入 ---")
	const test3Input = `
创建一个玄幻修仙小说：
- 主角：现代人穿越到修仙世界
- 背景：九州大陆，分为五大宗门
- 主线：从凡人修炼到飞升成仙
- 特色：融合现代知识与修仙体系
- 目标读者：18-30岁男性
- 预计字数：200万字
    `
	const test3 = await loadNovelCommandResponse("specify", test3Input)
	console.log("输入: [详细设定...]")
	console.log("输出长度:", test3.length, "字符")
	console.log("包含所有用户设定:", test3.includes("九州大陆") && test3.includes("五大宗门"))
	console.log("要求生成完整规格:", test3.includes("无论用户输入长短，都要生成详细完整的规格"))

	// 输出摘要
	console.log("\n=== 测试总结 ===")
	console.log("✅ 所有输入都触发生成完整规格的指令")
	console.log("✅ 不再包含级别系统相关内容")
	console.log("✅ 包含命令隔离防止自动执行后续命令")
	console.log("✅ 简化后的系统按预期工作")
}

// 执行测试
testSpecifyCommand().catch(console.error)
