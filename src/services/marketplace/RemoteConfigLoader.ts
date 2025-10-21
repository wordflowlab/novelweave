import axios from "axios"
import * as yaml from "yaml"
import { z } from "zod"
import { getNovelWeaveBaseUriFromToken } from "../../shared/novelweave/token" // novelweave_change
import {
	type MarketplaceItem,
	type MarketplaceItemType,
	modeMarketplaceItemSchema,
	mcpMarketplaceItemSchema,
	skillMarketplaceItemSchema,
} from "@roo-code/types"
//import { getRooCodeApiUrl } from "@roo-code/cloud" novelweave_change: use our own api

const modeMarketplaceResponse = z.object({
	items: z.array(modeMarketplaceItemSchema),
})

const mcpMarketplaceResponse = z.object({
	items: z.array(mcpMarketplaceItemSchema),
})

const skillMarketplaceResponse = z.object({
	version: z.string().optional(),
	lastUpdated: z.string().optional(),
	skills: z.array(skillMarketplaceItemSchema),
})

export class RemoteConfigLoader {
	private apiBaseUrl: string
	private cache: Map<string, { data: MarketplaceItem[]; timestamp: number }> = new Map()
	private cacheDuration = 5 * 60 * 1000 // 5 minutes

	constructor() {
		this.apiBaseUrl = getNovelWeaveBaseUriFromToken()
	}

	async loadAllItems(hideMarketplaceMcps = false): Promise<MarketplaceItem[]> {
		const items: MarketplaceItem[] = []

		// novelweave_change: 使用 Promise.allSettled 确保部分失败时其他数据仍可用
		const results = await Promise.allSettled([
			this.fetchModes(),
			hideMarketplaceMcps ? Promise.resolve([]) : this.fetchMcps(),
			this.fetchSkills(),
		])

		results.forEach((result) => {
			if (result.status === "fulfilled") {
				items.push(...result.value)
			} else {
				console.warn("Failed to fetch marketplace items:", result.reason)
			}
		})

		return items
	}

	private async fetchModes(): Promise<MarketplaceItem[]> {
		const cacheKey = "modes"
		const cached = this.getFromCache(cacheKey)

		if (cached) {
			return cached
		}

		try {
			const data = await this.fetchWithRetry<string>(`${this.apiBaseUrl}/api/marketplace/modes`)

			const yamlData = yaml.parse(data)
			const validated = modeMarketplaceResponse.parse(yamlData)

			const items: MarketplaceItem[] = validated.items.map((item) => ({
				type: "mode" as const,
				...item,
			}))

			this.setCache(cacheKey, items)
			return items
		} catch (error) {
			// novelweave_change: 失败时返回空数组，不阻止其他数据加载
			console.warn("Modes marketplace not available:", error)
			return []
		}
	}

	private async fetchMcps(): Promise<MarketplaceItem[]> {
		const cacheKey = "mcps"
		const cached = this.getFromCache(cacheKey)

		if (cached) {
			return cached
		}

		try {
			// API returns JSON array directly, not YAML
			const data = await this.fetchWithRetry<any>(`${this.apiBaseUrl}/v1/mcp/marketplace`)

			// Wrap array in expected format
			const validated = mcpMarketplaceResponse.parse({ items: data })

			const items: MarketplaceItem[] = validated.items.map((item) => ({
				type: "mcp" as const,
				...item,
			}))

			this.setCache(cacheKey, items)
			return items
		} catch (error) {
			// novelweave_change: 失败时返回空数组，不阻止其他数据加载
			console.warn("MCPs marketplace not available:", error)
			return []
		}
	}

	private async fetchSkills(): Promise<MarketplaceItem[]> {
		const cacheKey = "skills"
		const cached = this.getFromCache(cacheKey)

		if (cached) {
			return cached
		}

		try {
			// For now, use a placeholder GitHub URL until the actual registry is created
			// This will be updated in Phase 4
			const registryUrl =
				"https://raw.githubusercontent.com/wordflowlab/novelweave-skills-registry/main/registry.json"

			const data = await this.fetchWithRetry<any>(registryUrl)

			// registry.json uses JSON format with "skills" array
			const validated = skillMarketplaceResponse.parse(data)

			const items: MarketplaceItem[] = validated.skills.map((item) => ({
				type: "skill" as const,
				...item,
			}))

			this.setCache(cacheKey, items)
			return items
		} catch (error) {
			// If skills registry doesn't exist yet, return empty array
			console.warn("Skills registry not available yet:", error)
			return []
		}
	}

	private async fetchWithRetry<T>(url: string, maxRetries = 3): Promise<T> {
		let lastError: Error

		for (let i = 0; i < maxRetries; i++) {
			try {
				const response = await axios.get(url, {
					timeout: 10000, // 10 second timeout
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
				})
				return response.data as T
			} catch (error) {
				lastError = error as Error
				if (i < maxRetries - 1) {
					// Exponential backoff: 1s, 2s, 4s
					const delay = Math.pow(2, i) * 1000
					await new Promise((resolve) => setTimeout(resolve, delay))
				}
			}
		}

		throw lastError!
	}

	async getItem(id: string, type: MarketplaceItemType): Promise<MarketplaceItem | null> {
		const items = await this.loadAllItems()
		return items.find((item) => item.id === id && item.type === type) || null
	}

	private getFromCache(key: string): MarketplaceItem[] | null {
		const cached = this.cache.get(key)
		if (!cached) return null

		const now = Date.now()
		if (now - cached.timestamp > this.cacheDuration) {
			this.cache.delete(key)
			return null
		}

		return cached.data
	}

	private setCache(key: string, data: MarketplaceItem[]): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
		})
	}

	clearCache(): void {
		this.cache.clear()
	}
}
