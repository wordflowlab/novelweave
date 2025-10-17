---
description: 初始化追踪系统，基于故事大纲设置追踪数据
---

# 初始化追踪系统

基于已创建的故事规格和创作计划，初始化所有追踪数据文件。

用户输入：$ARGUMENTS

## 项目结构检查

首先确保项目目录结构存在。使用 `execute_command` 工具执行：

```bash
mkdir -p memory stories spec/tracking
```

## 使用时机

在完成 `/specify` 和 `/plan` 之后，开始写作之前执行此命令。

## 初始化流程

### 1. 读取基础数据

使用 `read_file` 工具读取必要文件：

- 读取规格文件 `stories/*/specification.md` 获取故事设定
- 读取创作计划 `stories/*/creative-plan.md` 获取章节规划
- 读取任务清单 `stories/*/tasks.md` 获取任务信息

### 2. 加载追踪模板

**重要**：首先加载扩展内置的追踪模板，作为结构参考。

使用 `read_file` 工具读取以下模板文件：

1. **情节追踪模板**：
    - 扩展路径：`templates/novel-tracking/plot-tracker.json`
2. **时间线模板**：
    - 扩展路径：`templates/novel-tracking/timeline.json`
3. **角色关系模板**：
    - 扩展路径：`templates/novel-tracking/relationships.json`
4. **角色状态模板**：
    - 扩展路径：`templates/novel-tracking/character-state.json`
5. **验证规则模板**：
    - 扩展路径：`templates/novel-tracking/validation-rules.json`

### 3. 初始化追踪文件

**重要**：基于加载的模板，结合 `specification.md` 第五章的线索管理规格，生成初始追踪数据。

创建或更新 `spec/tracking/plot-tracker.json`：

- 使用模板作为基础结构
- 从 `specification.md 5.1节` 读取所有线索定义并填充
- 从 `specification.md 5.3节` 读取所有交汇点
- 从 `specification.md 5.4节` 读取所有伏笔
- 从 `creative-plan.md` 读取章节段的线索分布
- 设置当前状态（假设尚未开始写作）

**生成的 plot-tracker.json 示例**：

```json
{
	"novel": "[从specification.md读取故事名称]",
	"lastUpdated": "[YYYY-MM-DD]",
	"currentState": {
		"chapter": 0,
		"volume": 1,
		"mainPlotStage": "[初始阶段]"
	},
	"plotlines": {
		"main": {
			"name": "[主线名称]",
			"status": "active",
			"currentNode": "[起点]",
			"completedNodes": [],
			"upcomingNodes": "[从交汇点和章节规划读取]"
		},
		"subplots": [
			{
				"id": "[从5.1读取，如PL-01]",
				"name": "[线索名称]",
				"type": "[主线/支线/主线支撑]",
				"priority": "[P0/P1/P2]",
				"status": "[active/dormant]",
				"plannedStart": "[起始章节]",
				"plannedEnd": "[结束章节]",
				"currentNode": "[当前节点]",
				"completedNodes": [],
				"upcomingNodes": "[从交汇点表读取]",
				"intersectionsWith": "[从5.3交汇点表读取相关线索]",
				"activeChapters": "[从5.2节奏规划读取]"
			}
		]
	},
	"foreshadowing": [
		{
			"id": "[从5.4读取，如F-001]",
			"content": "[伏笔内容]",
			"planted": { "chapter": null, "description": "[埋设说明]" },
			"hints": [],
			"plannedReveal": { "chapter": "[揭晓章节]", "description": "[揭晓方式]" },
			"status": "planned",
			"importance": "[high/medium/low]",
			"relatedPlotlines": "[涉及的线索ID列表]"
		}
	],
	"intersections": [
		{
			"id": "[从5.3读取，如X-001]",
			"chapter": "[交汇章节]",
			"plotlines": "[涉及的线索ID列表]",
			"content": "[交汇内容]",
			"status": "upcoming",
			"impact": "[预期效果]"
		}
	]
}
```

创建或更新 `spec/tracking/timeline.json`：

- 根据章节规划设置时间节点
- 标记重要时间事件

创建或更新 `spec/tracking/relationships.json`：

- 从角色设定提取初始关系
- 设置派系分组

创建或更新 `spec/tracking/character-state.json`：

- 初始化角色状态
- 设置起始位置

### 4. 创建 per‑story 追踪文件（如存在当前故事目录）

为当前故事目录（`stories/*`）创建/更新以下文件：

1. `stories/*/tracking/foreshadowing-tracker.md`（伏笔追踪表）

```markdown
# 伏笔追踪（Foreshadowing Tracker）

| ID    | 埋设章节 | 描述       | 计划揭晓章节 | 状态   | 实际揭晓章节 |
| ----- | -------- | ---------- | ------------ | ------ | ------------ |
| F-001 | 第01章   | [伏笔内容] | 第12章       | 埋设中 |              |
| F-002 | 第05章   | [伏笔内容] | 第20章       | 已揭晓 | 第21章       |

> 说明：状态=埋设中/已揭晓/取消；超过30章未回收将标为“超期”。
```

2. `stories/*/tracking/crosspoint-tracker.md`（交汇点追踪表）

```markdown
# 交汇点追踪（Crosspoint Tracker）

| 交汇点ID | 章节   | 涉及线索     | 描述                 | 影响/状态 |
| -------- | ------ | ------------ | -------------------- | --------- |
| X-001    | 第10章 | PL-01, PL-03 | [线索在此交汇的描述] | 待发生    |
| X-002    | 第18章 | PL-02, 主线  | [关键转折交汇点描述] | 已发生    |

> 说明：确保线索ID存在于 plot-tracker.json；章节号引用有效。
```

写入策略：

- 若文件不存在，创建文件并填充上述表头；若已存在，保持原有内容，仅在顶部保留标题与表头注释。

3. **生成追踪报告**
   显示初始化结果，确认追踪系统就绪

## 智能关联

- 根据写作方法自动设置检查点
- 英雄之旅：12个阶段的追踪点
- 三幕结构：三幕转折点
- 七点结构：7个关键节点

追踪系统初始化后，后续写作会自动更新这些数据。

## 完成提示 + 下一步

在聊天中输出：

```
✅ 追踪系统已初始化；已生成 spec/tracking/*.json；并创建/更新 stories/*/tracking/{foreshadowing-tracker.md,crosspoint-tracker.md}
```

建议：

- 运行 `/track --check` 查看综合追踪与一致性
- 开始 `/write` 并按任务推进
