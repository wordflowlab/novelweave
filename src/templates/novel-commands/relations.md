---
description: 管理和追踪角色关系变化
argument-hint: [update | show | history | check]
---

# 角色关系管理

追踪和管理角色之间的关系动态，确保关系发展的合理性。

用户输入：$ARGUMENTS

## 项目结构检查

首先确保项目目录结构存在。使用 `execute_command` 工具执行：

```bash
mkdir -p memory stories spec/tracking
```

## 功能

1. **关系网络** - 维护角色之间的关系图谱
2. **关系变化** - 记录关系的演变历程
3. **派系管理** - 追踪各势力派系的对立与合作
4. **情感追踪** - 管理角色间的情感发展

## 使用方法

支持以下操作：

- `update` - 更新角色关系
- `show` - 显示关系网络
- `history` - 查看关系变化历史
- `check` - 验证关系逻辑

## 执行步骤

### 1. 加载关系数据

使用 `read_file` 工具读取 `spec/tracking/relationships.json`：

- 如果文件存在，加载现有关系数据
- 如果文件不存在，建议先运行 `/track-init` 初始化追踪系统

### 2. 检查逻辑 (--check)

执行检查时，按照以下规则输出 Checklist：

1. 文件与结构

- CHK001 relationships.json 存在，且 JSON 格式有效
- CHK002 角色字典 `characters` 存在；每个角色包含 `relationships` 或同等分类键
- CHK003 支持两种结构：
    - 内嵌 `relationships`：`{ characters: { name: { relationships: { allies:[], enemies:[], romantic:[], family:[], mentors:[], neutral:[] }}}}`
    - 直挂分类键：`{ characters: { name: { allies:[], enemies:[], ... }}}`

2. 角色引用有效性

- CHK004 所有引用到的角色姓名，均在 `characters` 有对应节点（无“未建档角色”）
- CHK005 关系两端均为字符串姓名，无空值

3. 变更历史（可选字段）

- CHK006 如存在 `history`，格式中包含 `chapter|date|changes`
- CHK007 否则如存在 `relationshipChanges`，记录结构合理

4. 基本输出

- 展示主角或第一个角色的主要关系分类（romantic/allies/mentors/enemies/family/neutral）
- 展示最近的关系列表（history 或 relationshipChanges）

若发现“未建档角色引用”，建议先补齐角色节点再继续写作。

## 数据存储

关系数据存储在 `spec/tracking/relationships.json`：

```json
{
	"characters": {
		"主角": {
			"盟友": ["角色A", "角色B"],
			"敌对": ["角色C"],
			"爱慕": ["角色D"],
			"未知": ["角色E"]
		}
	},
	"factions": {
		"改革派": ["主角", "角色A"],
		"保守派": ["角色C", "角色F"]
	}
}
```

## 输出示例

```
👥 角色关系网络
━━━━━━━━━━━━━━━━━━━━
主角：李中庸
├─ 💕 爱慕：沈玉卿
├─ 🤝 盟友：张居正（隐藏）
├─ 📚 导师：利玛窦
├─ ⚔️ 敌对：申时行派系
└─ 👁️ 监视：东厂

派系对立：
改革派 ←→ 保守派
东林党 ←→ 阉党

最近变化（第60章）：
- 沈玉卿：陌生人 → 相互吸引
- 张居正：未知 → 师承关系
```

## 完成提示 + 下一步

在聊天中输出：

```
✅ 关系操作完成（show/update/history/check）
```

建议：

- 运行 `/track --check` 做综合一致性检查（称谓/阵营/位置）
- 对应章节需体现关系变化 → 在 `/write` 中修正或补充
