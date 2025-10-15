import { openRouterDefaultModelId, type ProviderSettings } from "@roo-code/types"
import { getKiloBaseUriFromToken } from "../../../shared/novelweave/token"
import { TelemetryService } from "@roo-code/telemetry"
import { z } from "zod"
import { fetchWithTimeout } from "./fetchWithTimeout"
import { DEFAULT_HEADERS } from "../constants"

type NovelweaveToken = string

type OrganizationId = string

const cache = new Map<string, Promise<string>>()

const defaultsSchema = z.object({
	defaultModel: z.string().nullish(),
})

const fetcher = fetchWithTimeout(5000)

async function fetchNovelweaveDefaultModel(
	novelweaveToken: NovelweaveToken,
	organizationId?: OrganizationId,
	providerSettings?: ProviderSettings,
): Promise<string> {
	try {
		const path = organizationId ? `/organizations/${organizationId}/defaults` : `/defaults`
		const url = `${getKiloBaseUriFromToken(novelweaveToken)}/api${path}`

		const headers: Record<string, string> = {
			...DEFAULT_HEADERS,
			Authorization: `Bearer ${novelweaveToken}`,
		}

		// Add X-NOVELWEAVE-TESTER: SUPPRESS header if the setting is enabled
		if (
			providerSettings?.novelweaveTesterWarningsDisabledUntil &&
			providerSettings.novelweaveTesterWarningsDisabledUntil > Date.now()
		) {
			headers["X-NOVELWEAVE-TESTER"] = "SUPPRESS"
		}

		const response = await fetcher(url, { headers })
		if (!response.ok) {
			throw new Error(`Fetching default model from ${url} failed: ${response.status}`)
		}
		const defaultModel = (await defaultsSchema.parseAsync(await response.json())).defaultModel
		if (!defaultModel) {
			throw new Error(`Default model from ${url} was empty`)
		}
		console.info(`Fetched default model from ${url}: ${defaultModel}`)
		return defaultModel
	} catch (err) {
		console.error("Failed to get default model", err)
		TelemetryService.instance.captureException(err, { context: "getNovelweaveDefaultModel" })
		return openRouterDefaultModelId
	}
}

export async function getNovelweaveDefaultModel(
	novelweaveToken?: NovelweaveToken,
	organizationId?: OrganizationId,
	providerSettings?: ProviderSettings,
): Promise<string> {
	if (!novelweaveToken) {
		return openRouterDefaultModelId
	}
	const key = JSON.stringify({
		novelweaveToken,
		organizationId,
		testerSuppressed: providerSettings?.novelweaveTesterWarningsDisabledUntil,
	})
	let defaultModelPromise = cache.get(key)
	if (!defaultModelPromise) {
		defaultModelPromise = fetchNovelweaveDefaultModel(novelweaveToken, organizationId, providerSettings)
		cache.set(key, defaultModelPromise)
	}
	return await defaultModelPromise
}
