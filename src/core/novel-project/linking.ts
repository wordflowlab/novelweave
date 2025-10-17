import * as vscode from "vscode"
import * as path from "path"

const enc = new TextEncoder()
const dec = new TextDecoder("utf-8")

async function readFile(uri: vscode.Uri): Promise<string> {
	const data = await vscode.workspace.fs.readFile(uri)
	return dec.decode(data)
}
async function writeFile(uri: vscode.Uri, text: string) {
	await vscode.workspace.fs.writeFile(uri, enc.encode(text))
}
async function exists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri)
		return true
	} catch {
		return false
	}
}

function getStoryDirFromChapterUri(uri: vscode.Uri): string | null {
	const parts = uri.fsPath.replace(/\\/g, "/").split("/")
	const i = parts.lastIndexOf("chapters")
	if (i > 0 && parts[i] === "chapters") {
		return parts.slice(0, i).join("/")
	}
	return null
}

function getChaptersDir(storyDir: string): vscode.Uri {
	return vscode.Uri.file(path.join(storyDir, "chapters"))
}
function getTasksFile(storyDir: string): vscode.Uri {
	return vscode.Uri.file(path.join(storyDir, "tasks.md"))
}

function extractNum3AndRel(chapterUri: vscode.Uri) {
	const bn = path.basename(chapterUri.fsPath)
	const m = bn.match(/^(\d{3})-/)
	if (!m) return null
	const num3 = m[1]
	return { num3, rel: `chapters/${bn}` }
}

async function updateTasksMd(storyDir: string, num3: string, rel: string) {
	const tasksUri = getTasksFile(storyDir)
	if (!(await exists(tasksUri))) return

	const raw = await readFile(tasksUri)
	if (raw.includes(`输出：${rel}`)) return

	const n = Number(num3)
	const lines = raw.split(/\r?\n/)
	const bulletRe = new RegExp(String.raw`^\s*- \[[ x~]\] \s*第${n}章`, "u")

	for (let i = 0; i < lines.length; i++) {
		if (bulletRe.test(lines[i])) {
			lines.splice(i + 1, 0, `  - 输出：${rel}`)
			await writeFile(tasksUri, lines.join("\n"))
			return
		}
	}
}

async function generateChaptersIndex(storyDir: string) {
	const chaptersDir = getChaptersDir(storyDir)
	if (!(await exists(chaptersDir))) return

	const entries = await vscode.workspace.fs.readDirectory(chaptersDir)
	const files = entries
		.filter(([name, type]) => type === vscode.FileType.File && /^\d{3}-.+\.md$/u.test(name))
		.map(([name]) => name)
		.sort((a, b) => Number(a.slice(0, 3)) - Number(b.slice(0, 3)))

	const rows = files.map((name) => {
		const num = name.slice(0, 3)
		const title = name.replace(/^\d{3}-/, "").replace(/\.md$/, "")
		const rel = `chapters/${name}`
		return `| ${num} | ${title} | [${rel}](${rel}) |`
	})

	const out = ["# 章节索引", "", "| 章节 | 标题 | 文件 |", "|------|------|------|", ...rows, ""].join("\n")

	const indexUri = vscode.Uri.file(path.join(chaptersDir.fsPath, "index.md"))
	await writeFile(indexUri, out)
}

export async function syncLinksForChapter(chapterUri: vscode.Uri) {
	const storyDir = getStoryDirFromChapterUri(chapterUri)
	if (!storyDir) return
	const info = extractNum3AndRel(chapterUri)
	if (!info) return
	await updateTasksMd(storyDir, info.num3, info.rel)
	await generateChaptersIndex(storyDir)
}

export async function syncLinksForWorkspace() {
	const storyDirs = await vscode.workspace
		.findFiles("stories/*/chapters", "**/node_modules/**", 50)
		.then((dirs) => dirs.map((d) => path.dirname(d.fsPath)))

	for (const storyDir of storyDirs) {
		const chaptersDir = getChaptersDir(storyDir)
		if (!(await exists(chaptersDir))) continue

		const entries = await vscode.workspace.fs.readDirectory(chaptersDir)
		const mdFiles = entries
			.filter(([n, t]) => t === vscode.FileType.File && /^\d{3}-.+\.md$/u.test(n))
			.map(([n]) => n)

		for (const name of mdFiles) {
			const num3 = name.slice(0, 3)
			await updateTasksMd(storyDir, num3, `chapters/${name}`)
		}
		await generateChaptersIndex(storyDir)
	}
}
