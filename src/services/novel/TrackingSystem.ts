/**
 * 小说追踪系统服务
 * 管理角色、情节、时间线等追踪数据
 */

import * as path from "path"
import * as fs from "fs/promises"

/**
 * 角色数据
 */
export interface Character {
	id: string
	name: string
	age?: number
	role?: string // 主角、配角、反派等
	description?: string
	motivation?: string
	relationships?: Record<string, string> // 与其他角色的关系
	firstAppearance?: string // 首次出现的章节
	arc?: string[] // 角色成长轨迹
}

/**
 * 情节线索
 */
export interface PlotLine {
	id: string
	name: string
	type?: string // 主线、支线
	status?: "planned" | "in-progress" | "resolved"
	chapters?: string[] // 相关章节
	foreshadowing?: string[] // 伏笔
	resolution?: string // 解决方式
}

/**
 * 时间线事件
 */
export interface TimelineEvent {
	id: string
	timestamp: string
	chapter?: string
	event: string
	characters?: string[]
	significance?: string
}

export class TrackingSystem {
	private projectRoot: string
	private trackingDir: string

	constructor(projectRoot: string) {
		this.projectRoot = projectRoot
		this.trackingDir = path.join(projectRoot, "spec", "tracking")
	}

	/**
	 * 加载角色数据
	 */
	async loadCharacters(): Promise<Character[]> {
		const filePath = path.join(this.trackingDir, "characters.json")
		try {
			const content = await fs.readFile(filePath, "utf-8")
			const data = JSON.parse(content)
			return data.characters || []
		} catch (error) {
			console.warn("Failed to load characters:", error)
			return []
		}
	}

	/**
	 * 保存角色数据
	 */
	async saveCharacters(characters: Character[]): Promise<void> {
		const filePath = path.join(this.trackingDir, "characters.json")
		const data = {
			version: "1.0.0",
			lastUpdated: new Date().toISOString(),
			characters,
		}
		await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
	}

	/**
	 * 添加角色
	 */
	async addCharacter(character: Character): Promise<void> {
		const characters = await this.loadCharacters()
		characters.push(character)
		await this.saveCharacters(characters)
	}

	/**
	 * 更新角色
	 */
	async updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
		const characters = await this.loadCharacters()
		const index = characters.findIndex((c) => c.id === id)
		if (index !== -1) {
			characters[index] = { ...characters[index], ...updates }
			await this.saveCharacters(characters)
		}
	}

	/**
	 * 删除角色
	 */
	async deleteCharacter(id: string): Promise<void> {
		const characters = await this.loadCharacters()
		const filtered = characters.filter((c) => c.id !== id)
		await this.saveCharacters(filtered)
	}

	/**
	 * 加载情节线索
	 */
	async loadPlotLines(): Promise<PlotLine[]> {
		const filePath = path.join(this.trackingDir, "plot-tracker.json")
		try {
			const content = await fs.readFile(filePath, "utf-8")
			const data = JSON.parse(content)
			return data.plotLines || []
		} catch (error) {
			console.warn("Failed to load plot lines:", error)
			return []
		}
	}

	/**
	 * 保存情节线索
	 */
	async savePlotLines(plotLines: PlotLine[]): Promise<void> {
		const filePath = path.join(this.trackingDir, "plot-tracker.json")
		const data = {
			version: "1.0.0",
			lastUpdated: new Date().toISOString(),
			plotLines,
			conflicts: [],
			foreshadowing: [],
		}
		await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
	}

	/**
	 * 加载时间线
	 */
	async loadTimeline(): Promise<TimelineEvent[]> {
		const filePath = path.join(this.trackingDir, "timeline.json")
		try {
			const content = await fs.readFile(filePath, "utf-8")
			const data = JSON.parse(content)
			return data.events || []
		} catch (error) {
			console.warn("Failed to load timeline:", error)
			return []
		}
	}

	/**
	 * 保存时间线
	 */
	async saveTimeline(events: TimelineEvent[]): Promise<void> {
		const filePath = path.join(this.trackingDir, "timeline.json")
		const data = {
			version: "1.0.0",
			lastUpdated: new Date().toISOString(),
			events,
		}
		await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
	}

	/**
	 * 添加时间线事件
	 */
	async addTimelineEvent(event: TimelineEvent): Promise<void> {
		const events = await this.loadTimeline()
		events.push(event)
		// 按时间戳排序
		events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
		await this.saveTimeline(events)
	}
}
