import { ApiHandlerOptions, ModelRecord } from "../../shared/api"
import { CompletionUsage, OpenRouterHandler } from "./openrouter"
import { getModelParams } from "../transform/model-params"
import { getModels } from "./fetchers/modelCache"
import { DEEP_SEEK_DEFAULT_TEMPERATURE, openRouterDefaultModelId, openRouterDefaultModelInfo } from "@roo-code/types"
import { getNovelWeaveBaseUriFromToken } from "../../shared/novelweave/token"
import { ApiHandlerCreateMessageMetadata } from ".."
import { getModelEndpoints } from "./fetchers/modelEndpointCache"
import { getNovelweaveDefaultModel } from "./novelweave/getNovelweaveDefaultModel"
import { X_NOVELWEAVE_ORGANIZATIONID, X_NOVELWEAVE_TASKID, X_NOVELWEAVE_TESTER } from "../../shared/novelweave/headers"

/**
 * A custom OpenRouter handler that overrides the getModel function
 * to provide custom model information and fetches models from the NovelWeave OpenRouter endpoint.
 */
export class NovelweaveOpenrouterHandler extends OpenRouterHandler {
	protected override models: ModelRecord = {}
	defaultModel: string = openRouterDefaultModelId

	protected override get providerName() {
		return "NovelWeave" as const
	}

	constructor(options: ApiHandlerOptions) {
		const baseUri = getNovelWeaveBaseUriFromToken(options.novelweaveToken ?? "")
		options = {
			...options,
			openRouterBaseUrl: `${baseUri}/api/openrouter/`,
			openRouterApiKey: options.novelweaveToken,
		}

		super(options)
	}

	override customRequestOptions(metadata?: ApiHandlerCreateMessageMetadata) {
		const headers: Record<string, string> = {}

		if (metadata?.taskId) {
			headers[X_NOVELWEAVE_TASKID] = metadata.taskId
		}

		const novelweaveOptions = this.options

		if (novelweaveOptions.novelweaveOrganizationId) {
			headers[X_NOVELWEAVE_ORGANIZATIONID] = novelweaveOptions.novelweaveOrganizationId
		}

		// Add X-NOVELWEAVE-TESTER: SUPPRESS header if the setting is enabled
		if (
			novelweaveOptions.novelweaveTesterWarningsDisabledUntil &&
			novelweaveOptions.novelweaveTesterWarningsDisabledUntil > Date.now()
		) {
			headers[X_NOVELWEAVE_TESTER] = "SUPPRESS"
		}

		return Object.keys(headers).length > 0 ? { headers } : undefined
	}

	override getTotalCost(lastUsage: CompletionUsage): number {
		const model = this.getModel().info
		if (!model.inputPrice && !model.outputPrice) {
			return 0
		}
		// https://github.com/NovelWeave-Org/novelweave-backend/blob/eb3d382df1e933a089eea95b9c4387db0c676e35/src/lib/processUsage.ts#L281
		if (lastUsage.is_byok) {
			return lastUsage.cost_details?.upstream_inference_cost || 0
		}
		return lastUsage.cost || 0
	}

	override getModel() {
		let id = this.options.novelweaveModel ?? this.defaultModel
		let info = this.models[id] ?? openRouterDefaultModelInfo

		// If a specific provider is requested, use the endpoint for that provider.
		if (this.options.openRouterSpecificProvider && this.endpoints[this.options.openRouterSpecificProvider]) {
			info = this.endpoints[this.options.openRouterSpecificProvider]
		}

		const isDeepSeekR1 = id.startsWith("deepseek/deepseek-r1") || id === "perplexity/sonar-reasoning"

		const params = getModelParams({
			format: "openrouter",
			modelId: id,
			model: info,
			settings: this.options,
			defaultTemperature: isDeepSeekR1 ? DEEP_SEEK_DEFAULT_TEMPERATURE : 0,
		})

		return { id, info, topP: isDeepSeekR1 ? 0.95 : undefined, ...params }
	}

	public override async fetchModel() {
		if (!this.options.novelweaveToken || !this.options.openRouterBaseUrl) {
			throw new Error("NovelWeave token + baseUrl is required to fetch models")
		}

		const [models, endpoints, defaultModel] = await Promise.all([
			getModels({
				provider: "novelweave-openrouter",
				novelweaveToken: this.options.novelweaveToken,
				novelweaveOrganizationId: this.options.novelweaveOrganizationId,
			}),
			getModelEndpoints({
				router: "openrouter",
				modelId: this.options.novelweaveModel,
				endpoint: this.options.openRouterSpecificProvider,
			}),
			getNovelweaveDefaultModel(
				this.options.novelweaveToken,
				this.options.novelweaveOrganizationId,
				this.options,
			),
		])

		this.models = models
		this.endpoints = endpoints
		this.defaultModel = defaultModel
		return this.getModel()
	}
}
