---
description: 管理和验证故事时间线
argument-hint: [add | check | show | sync]
---

# 时间线管理

维护故事的时间轴，确保时间逻辑的一致性。

用户输入：$ARGUMENTS

## 项目结构检查

首先确保项目目录结构存在。使用 `execute_command` 工具执行：

```bash
mkdir -p memory stories spec/tracking
```

## 功能

1. **时间记录** - 追踪每个章节的时间点
2. **并行事件** - 管理同时发生的多线剧情
3. **历史对照** - 与真实历史事件对比（历史小说）
4. **逻辑验证** - 检查时间跨度的合理性

## 使用方法

支持以下操作：

- `add` - 添加时间节点
- `check` - 验证时间连续性
- `show` - 显示时间线概览
- `sync` - 同步并行事件

## 执行步骤

### 1. 加载时间线数据

使用 `read_file` 工具读取 `spec/tracking/timeline.json`：

- 如果文件存在，加载现有时间线数据
- 如果文件不存在，建议先运行 `/track-init` 初始化追踪系统

### 2. 深度检查 (--check)

在 `--check` 模式下，执行与脚本等价的规则化检查，并输出 Checklist：

1. 文件完整性

- CHK001 timeline.json 存在且格式有效

2. 时间设定

- CHK002 已设置故事起始时间：storyTime.start
- CHK003 已设置当前故事时间：storyTime.current

3. 事件记录

- CHK004 已记录时间事件（events.length > 0）
- CHK005 时间事件按章节升序排列（按 chapter 递增，无乱序）

4. 并行事件

- CHK006 并行事件时间点记录合理（parallelEvents.timepoints 可为空）

5. 记录检查结果（可选）

- 将检查时间写入 `lastChecked`
- 将乱序数量写入 `anomalies.lastCheckIssues`

Checklist 输出参考：

```
# 时间线检查 Checklist
检查对象: spec/tracking/timeline.json
记录事件数: [N]

- [x] CHK001 timeline.json 存在且格式有效
- [x] CHK002 故事起始时间已设定（...）
- [x] CHK003 当前故事时间已更新（...）
- [x] CHK004 已记录时间事件（N 个）
- [x] CHK005 时间事件按章节有序排列
- [ ] CHK006 并行事件时间点已记录（K 个/无记录）

后续行动...
```

## 时间线数据

时间线信息存储在 `spec/tracking/timeline.json` 中：

- 故事内时间（年/月/日）
- 章节对应关系
- 重要事件标记
- 时间跨度计算

## 示例输出

```
📅 故事时间线
━━━━━━━━━━━━━━━━━━━━
当前时间：万历三十年春

第1章  | 万历二十九年冬月 | 穿越事件
第4章  | 万历三十年正月   | 北上赴考
第6章  | 万历三十年二月   | 会试
第8章  | 万历三十年三月   | 殿试
第61章 | 万历三十年四月   | [待写]

⏱️ 时间跨度：5个月
🔄 并行事件：日本入侵朝鲜
```

## 完成提示 + 下一步

在聊天中输出：

```
✅ 时间线处理完成（show/add/check/sync）
```

建议：

- 如发现乱序或时间节点缺失 → 在 `/plan` 或 `/tasks` 中补全相关章节与事件
- 运行 `/track --check` 做综合一致性检查
