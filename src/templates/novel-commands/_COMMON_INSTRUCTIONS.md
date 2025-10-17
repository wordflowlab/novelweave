# 通用指令说明

这个文件记录了所有命令模板共用的指令模式，用于替代原 novel-writer 的脚本功能。

## 脚本功能映射

### 1. 查找故事目录

**原脚本功能**：

```bash
{SCRIPT} --json  # 返回故事路径
```

**AI 工具替代**：

```markdown
使用 `execute_command` 工具执行：
\`\`\`bash
find stories -type d -maxdepth 1 | sort | tail -1
\`\`\`

或使用 `list_files` 工具列出 `stories/` 目录，选择最新的（按字母序最大的，如 003-xxx）
```

### 2. 检查文件是否存在

**原脚本功能**：

```bash
{SCRIPT} check  # 检查文件是否存在
```

**AI 工具替代**：

```markdown
使用 `read_file` 工具尝试读取文件：

- 如果读取成功 → 文件存在，使用内容
- 如果读取失败 → 文件不存在，准备创建
```

### 3. 创建编号目录

**原脚本功能**：

```bash
create_numbered_dir stories story  # 返回 001, 002, 003...
```

**AI 工具替代**：

```markdown
1. 使用 `list_files` 或 `execute_command` 列出现有故事：
   \`\`\`bash
   ls -1 stories/ | grep -E '^[0-9]{3}-'
   \`\`\`

2. 找到最大编号（如 002），下一个编号是 003

3. 创建新目录路径：`stories/003-[story-name]/`
```

### 4. 获取路径信息（JSON）

**原脚本功能**：

```bash
{SCRIPT} --json --paths-only
# 返回：
# {
#   "STORY_PATH": "stories/001-xxx",
#   "STORY_NAME": "001-xxx",
#   "SPEC_PATH": "stories/001-xxx/specification.md"
# }
```

**AI 工具替代**：

```markdown
**不需要脚本返回 JSON**，直接在执行过程中：

1. 列出故事目录获取路径
2. 从路径中提取故事名称
3. 拼接需要的文件路径

示例：

- 执行 `find stories -type d -maxdepth 1`
- 得到路径：`stories/001-my-story`
- 故事名称：`001-my-story`
- 规格路径：`stories/001-my-story/specification.md`
```

## 常用模式

### 模式 1：查找并读取规格文件

```markdown
## 步骤 1：查找规格文件

使用 `execute_command` 工具查找：

\`\`\`bash
find stories -name "specification.md" -type f
\`\`\`

**处理结果**：

- 如果找到多个：让用户选择
- 如果找到一个：提取目录路径（如 `stories/001-my-story/`）
- 如果没有找到：提示用户先运行 `/specify`

**读取文件**：

使用 `read_file` 工具读取找到的规格文件。
```

### 模式 2：创建新故事目录

```markdown
## 步骤 1：确定故事编号和名称

1. **列出现有故事**：

    使用 `execute_command` 工具：
    \`\`\`bash
    ls -1 stories/ 2>/dev/null || echo "empty"
    \`\`\`

2. **计算下一个编号**：
    - 如果目录为空或输出 "empty"：使用 `001`
    - 如果有现有目录（如 `001-xxx`, `002-yyy`）：
        - 找到最大编号（如 002）
        - 下一个编号是 003

3. **询问故事名称**：
    - 从用户输入中提取，或
    - 询问用户："请输入故事名称"

4. **创建目录路径**：

    `stories/[编号]-[名称]/`（如 `stories/003-my-novel/`）
```

### 模式 3：检查前置条件

```markdown
## 步骤 1：检查前置文档

**检查宪法文件**：

使用 `read_file` 工具读取 `memory/constitution.md`：

- ✅ 如果成功：文件存在，继续
- ⚠️ 如果失败：提示用户"建议先运行 `/constitution` 创建宪法"，询问是否继续

**检查规格文件**：

使用 `execute_command` 查找规格：
\`\`\`bash
find stories -name "specification.md" -type f
\`\`\`

- ✅ 如果找到：读取内容
- ❌ 如果未找到：提示"必须先运行 `/specify` 创建规格"，停止执行
```

## 工具使用指南

### execute_command 工具

**用途**：执行 bash 命令

**示例**：

```markdown
使用 `execute_command` 工具执行：
\`\`\`bash
mkdir -p memory stories spec/tracking
\`\`\`
```

### read_file 工具

**用途**：读取文件内容，同时检测文件是否存在

**示例**：

```markdown
使用 `read_file` 工具读取 `memory/constitution.md`：

- 成功 → 文件存在，使用内容
- 失败 → 文件不存在
```

### write_to_file 工具

**用途**：创建或更新文件

**示例**：

```markdown
使用 `write_to_file` 工具将内容保存到 `memory/constitution.md`
```

### list_files 工具

**用途**：列出目录内容

**示例**：

```markdown
使用 `list_files` 工具列出 `stories/` 目录
```

## 完整示例：plan 命令的脚本替代

**原来的方式**（novel-writer）：

```markdown
### 1. 加载前置文档

运行 `{SCRIPT}` 检查并加载：

- 宪法文件
- 规格文件
```

**新的方式**（我们的系统）：

```markdown
### 1. 加载前置文档

**步骤 1.1：查找故事目录**

使用 `execute_command` 工具：
\`\`\`bash
find stories -type d -maxdepth 1 | sort | tail -1
\`\`\`

从输出中提取故事路径（如 `stories/001-my-story`）

**步骤 1.2：读取宪法文件**

使用 `read_file` 工具读取 `memory/constitution.md`：

- 如果成功：记录宪法原则
- 如果失败：警告用户但继续执行

**步骤 1.3：读取规格文件**

使用 `read_file` 工具读取 `[故事路径]/specification.md`：

- 如果成功：读取规格内容
- 如果失败：错误提示"必须先运行 `/specify`"，停止执行

**步骤 1.4：读取澄清记录**

检查规格文件中是否有"澄清记录"章节，如果有则参考
```

这样 AI 就能通过现有工具完成原来脚本的所有功能！
