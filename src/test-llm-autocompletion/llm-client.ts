import OpenAI from "openai"
import { config } from "dotenv"
import { DEFAULT_HEADERS } from "../api/providers/constants.js"

config()

export interface LLMResponse {
	content: string
	provider: string
	model: string
	tokensUsed?: number
}

function getKiloBaseUriFromToken(novelweaveToken?: string): string {
	if (novelweaveToken) {
		try {
			const payload_string = novelweaveToken.split(".")[1]
			const payload_json = Buffer.from(payload_string, "base64").toString()
			const payload = JSON.parse(payload_json)
			// Note: this is UNTRUSTED, so we need to make sure we're OK with this being manipulated by an attacker
			if (payload.env === "development") return "http://localhost:3000"
		} catch (_error) {
			console.warn("Failed to get base URL from Kilo Code token")
		}
	}
	return "https://api.novelweave.ai"
}

export class LLMClient {
	private provider: string
	private model: string
	private openai: OpenAI

	constructor() {
		this.provider = process.env.LLM_PROVIDER || "novelweave"
		this.model = process.env.LLM_MODEL || "mistralai/codestral-2508"

		if (this.provider !== "novelweave") {
			throw new Error(`Only novelweave provider is supported. Got: ${this.provider}`)
		}

		if (!process.env.NOVELWEAVE_API_KEY) {
			throw new Error("NOVELWEAVE_API_KEY is required for Novelweave provider")
		}

		const baseUrl = getKiloBaseUriFromToken(process.env.NOVELWEAVE_API_KEY)

		this.openai = new OpenAI({
			baseURL: `${baseUrl}/api/openrouter/`,
			apiKey: process.env.NOVELWEAVE_API_KEY,
			defaultHeaders: {
				...DEFAULT_HEADERS,
				"X-NOVELWEAVE-TESTER": "SUPPRESS",
			},
		})
	}

	async sendPrompt(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
		try {
			const response = await this.openai.chat.completions.create({
				model: this.model,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userPrompt },
				],
				max_tokens: 1024,
			})

			return {
				content: response.choices[0].message.content || "",
				provider: this.provider,
				model: this.model,
				tokensUsed: response.usage?.total_tokens,
			}
		} catch (error) {
			console.error("LLM API Error:", error)
			throw error
		}
	}
}
