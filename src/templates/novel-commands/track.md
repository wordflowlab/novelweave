---
description: 综合追踪小说创作进度和内容
argument-hint: [--brief | --plot | --stats | --check]
---

# 综合进度追踪

全面展示小说创作的各项进度和状态。

用户输入：$ARGUMENTS

## 项目结构检查

首先确保项目目录结构存在。使用 `execute_command` 工具执行：

```bash
mkdir -p memory stories spec/tracking
```

## 追踪维度

1. **写作进度** - 字数、章节、完成率
2. **情节发展** - 主线进度、支线状态
3. **时间线** - 故事时间推进
4. **角色状态** - 角色发展和位置
5. **伏笔管理** - 埋设和回收状态

## 使用方法

支持以下操作（从 $ARGUMENTS 中解析）：

- 无参数 - 显示完整追踪报告
- `--brief` - 显示简要信息
- `--plot` - 仅显示情节追踪
- `--stats` - 仅显示统计数据
- `--check` - 执行深度一致性检查

## 执行步骤

### 1. 加载追踪数据

使用 `read_file` 工具读取追踪文件：

- `spec/tracking/timeline.json` - 时间线数据
- `spec/tracking/relationships.json` - 关系网络
- `spec/tracking/plot-tracker.json` - 情节追踪（如果存在）
- `spec/tracking/character-state.json` - 角色状态（如果存在）

## 输出示例

```
📊 小说创作综合报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 《大明风华录》

✍️ 写作进度
  完成：60/240章 (25%)
  字数：162,000/800,000
  当前：第二卷《朝堂风云》

📍 情节状态
  主线：改革大业 [朝堂初入阶段]
  支线：感情线 [相互了解]

⏰ 时间线
  故事时间：万历三十年春
  时间跨度：5个月

👥 主要角色
  李中庸：翰林院编修 @北京
  沈玉卿：张居正义女 [活跃]

⚡ 待处理
  伏笔：3个未回收
  冲突：改革vs保守 [升级中]

✅ 一致性检查：通过
```

## 增强功能

### 数据一致性验证

基础检查（默认执行）：

- 文件完整性：`spec/tracking/*.json` 均存在且 JSON 有效；`progress.json`（如存在）格式有效
- 章节号同步：`progress.json.statistics.currentChapter`、`plot-tracker.json.currentState.chapter`、`character-state.json.protagonist.currentStatus.chapter` 一致
- plot-tracker.json 与 stories/\*/creative-plan.md 的一致性
- timeline.json 的时间逻辑（章节递增、当前时间设置）
- relationships.json 的关系冲突
- character-state.json 的位置合理性

### 深度验证模式 (--check)

当使用 `--check` 参数时，执行程序化的深度验证：

#### 内部任务流程（自动执行）

```markdown
# Phase 1: 基础验证 [并行执行]

- [x] T001 [P] 文件完整性检查（progress.json、plot-tracker.json、timeline.json、relationships.json、character-state.json）
- [x] T002 [P] 章节号同步检查（progress.json ↔ plot-tracker.json ↔ character-state.json）
- [x] T003 [P] 执行情节一致性检查 (plot-check逻辑)
- [x] T004 [P] 执行时间线验证 (timeline逻辑：章节升序、当前时间设置)
- [x] T005 [P] 执行关系验证 (relations逻辑)
- [x] T006 [P] 执行世界观验证 (world-check逻辑)

# Phase 2: 角色深度验证

- [x] T007 加载validation-rules.json验证规则
- [x] T008 扫描所有章节中的角色名称
- [x] T009 对比character-state.json验证名称一致性
- [x] T010 检查称呼是否符合relationships.json
- [x] T011 验证角色行为是否符合人设

# Phase 3: 生成综合报告

- [x] T012 汇总所有验证结果
- [x] T013 标记问题严重程度
- [x] T014 统计伏笔（总数、活跃数、超期未回收>50章）
- [x] T015 生成修复建议
- [x] T016 输出/更新 `spec/tracking/.last-check.json`（timestamp、total、passed、warnings、errors）
```

#### 验证报告示例

```
📊 深度验证报告
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 通过项目: 15/18

❌ 发现问题 (3):
1. [高] 第3章: 主角名"李明"应为"李中庸"
2. [中] 第7章: 沈玉卿称呼错误，用了"师兄"
3. [低] 第12章: 时间线跳跃未说明

🔧 可自动修复: 2个
📝 需人工确认: 1个

运行 /track --fix 自动修复简单问题
```

### 自动修复模式 (--fix)

当使用 `--fix` 参数时，基于验证报告自动修复：

#### 自动修复范围

1. **角色名称错误** - 根据validation-rules.json自动替换
2. **固定称呼错误** - 自动修正为正确称呼
3. **简单拼写错误** - 修正明显的typo

#### 修复流程

```markdown
# 内部修复任务（自动执行）

- [x] F001 读取验证报告中的问题列表
- [x] F002 [P] 修复第3章角色名称错误
- [x] F003 [P] 修复第7章称呼错误
- [x] F004 生成修复报告
- [x] F005 更新追踪文件
```

#### 修复报告示例

```
🔧 自动修复报告
━━━━━━━━━━━━━━━━━━━
✅ 已修复: 2个问题
- 第3章: "李明" → "李中庸"
- 第7章: "师兄" → "公子"

⚠️ 需人工处理: 1个问题
- 第12章: 时间线跳跃需要补充说明

修复完成！建议重新运行 /track --check 验证
```

### 智能分析与建议

1. **进度分析**
    - 对比计划进度和实际进度
    - 预测完成时间
    - 识别写作瓶颈

2. **内容分析**
    - 伏笔覆盖率（已埋设/已回收）
    - 角色出场频率
    - 冲突强度曲线

3. **行动建议**
   根据分析结果提供：
    - 下一步写作重点
    - 需要处理的伏笔
    - 建议加强的关系线
    - 时间线调整建议

### 情节一致性检查细则（对齐 check-plot 逻辑）

在生成或阅读报告时，补充以下“情节对齐”检查项：

- 主线进度：`plot-tracker.json.plotlines.main.currentNode` 与 `status`
- 完成节点数：`completedNodes.length`；展示最近3个
- 即将到来：`upcomingNodes[0:3]`
- 伏笔统计：总数、活跃数、已回收数；超期未回收阈值（建议30-50章，根据题材微调）
- 冲突统计：`conflicts.active.length` 及强度标签（intensity）
- 节奏建议：根据当前章节范围生成“钩子/小高潮/卷尾”提醒

若 `spec/tracking/plot-tracker.json` 缺失：先提示通过 `/track-init` 初始化（不阻断其他检查）。

### 可视化报告

生成结构化报告：

```
📊 综合追踪报告
━━━━━━━━━━━━━━━━━━━━━━━━━━
[进度条] ████████░░░░░░░ 25%

🎯 下一步建议：
1. 第65章前回收"青铜古镜"伏笔
2. 加强主角与反派的正面冲突
3. 补充第二卷的时间线细节

⚠️ 需要关注：
- 角色B已5章未出场
- 支线剧情进度滞后
- 第45章的时间跳跃需要说明
```

### 数据导出

支持导出追踪数据为：

- Markdown 格式的完整报告
- JSON 格式的原始数据
- 可视化图表（关系图、时间轴）

## 完成提示 + 下一步

在聊天中输出：

```
✅ 追踪报告已生成（--brief/--plot/--stats/--check）
```

建议：

- 若存在错误/警告 → 按报告中的“修复建议”优先处理
- 内容问题 → `/write` 修正文稿；框架/任务问题 → `/plan`、`/tasks`
- 通过修复后，可再次运行 `/track --check` 验证
