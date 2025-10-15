import {
	type ProviderName,
	type ProviderSettings,
	anthropicDefaultModelId,
	anthropicModels,
	bedrockDefaultModelId,
	bedrockModels,
	deepSeekDefaultModelId,
	deepSeekModels,
	geminiDefaultModelId,
	geminiModels,
	mistralDefaultModelId,
	mistralModels,
	openAiNativeDefaultModelId,
	openAiNativeModels,
	vertexDefaultModelId,
	vertexModels,
	xaiDefaultModelId,
	xaiModels,
	groqModels,
	groqDefaultModelId,
	// chutesModels, // novelweave_change
	chutesDefaultModelId,
	vscodeLlmModels,
	vscodeLlmDefaultModelId,
	openRouterDefaultModelId,
	requestyDefaultModelId,
	glamaDefaultModelId,
	unboundDefaultModelId,
	litellmDefaultModelId,
	qwenCodeModels,
	qwenCodeDefaultModelId,
	geminiCliModels,
	claudeCodeModels,
	claudeCodeDefaultModelId,
	doubaoModels,
	doubaoDefaultModelId,
	fireworksModels,
	fireworksDefaultModelId,
	syntheticModels, // novelweave_change
	syntheticDefaultModelId, // novelweave_change
	ioIntelligenceDefaultModelId,
	moonshotModels,
	moonshotDefaultModelId,
	sambaNovaModels,
	sambaNovaDefaultModelId,
	featherlessModels,
	featherlessDefaultModelId,
	deepInfraDefaultModelId,
	cerebrasModels,
	cerebrasDefaultModelId,
	ovhCloudAiEndpointsDefaultModelId, // novelweave_change
} from "@roo-code/types"
import type { ModelRecord, RouterModels } from "@roo/api"
import { useRouterModels } from "../../ui/hooks/useRouterModels"
import { useExtensionState } from "@/context/ExtensionStateContext"

const FALLBACK_MODELS = {
	models: anthropicModels,
	defaultModel: anthropicDefaultModelId,
}

export const getModelsByProvider = ({
	provider,
	routerModels,
	novelweaveDefaultModel,
}: {
	provider: ProviderName
	routerModels: RouterModels
	novelweaveDefaultModel: string
}): { models: ModelRecord; defaultModel: string } => {
	switch (provider) {
		case "openrouter": {
			return {
				models: routerModels.openrouter,
				defaultModel: openRouterDefaultModelId,
			}
		}
		case "requesty": {
			return {
				models: routerModels.requesty,
				defaultModel: requestyDefaultModelId,
			}
		}
		case "glama": {
			return {
				models: routerModels.glama,
				defaultModel: glamaDefaultModelId,
			}
		}
		case "unbound": {
			return {
				models: routerModels.unbound,
				defaultModel: unboundDefaultModelId,
			}
		}
		case "litellm": {
			return {
				models: routerModels.litellm,
				defaultModel: litellmDefaultModelId,
			}
		}
		case "xai": {
			return {
				models: xaiModels,
				defaultModel: xaiDefaultModelId,
			}
		}
		case "groq": {
			return {
				models: groqModels,
				defaultModel: groqDefaultModelId,
			}
		}
		case "chutes": {
			return {
				models: routerModels.chutes, // novelweave_change
				defaultModel: chutesDefaultModelId,
			}
		}
		case "cerebras": {
			return {
				models: cerebrasModels,
				defaultModel: cerebrasDefaultModelId,
			}
		}
		case "bedrock": {
			return {
				models: bedrockModels,
				defaultModel: bedrockDefaultModelId,
			}
		}
		case "vertex": {
			return {
				models: vertexModels,
				defaultModel: vertexDefaultModelId,
			}
		}
		case "gemini": {
			return {
				// novelweave_change start
				models:
					routerModels.gemini && Object.keys(routerModels.gemini).length > 0
						? routerModels.gemini
						: geminiModels,
				// novelweave_change end
				defaultModel: geminiDefaultModelId,
			}
		}
		case "deepseek": {
			return {
				models: deepSeekModels,
				defaultModel: deepSeekDefaultModelId,
			}
		}
		case "openai-native": {
			return {
				models: openAiNativeModels,
				defaultModel: openAiNativeDefaultModelId,
			}
		}
		case "mistral": {
			return {
				models: mistralModels,
				defaultModel: mistralDefaultModelId,
			}
		}
		case "openai": {
			// TODO(catrielmuller): Support the fetch here
			return {
				models: {},
				defaultModel: "",
			}
		}
		case "ollama": {
			return {
				models: routerModels.ollama,
				defaultModel: "",
			}
		}
		case "lmstudio": {
			return {
				models: routerModels.lmstudio,
				defaultModel: "",
			}
		}
		case "vscode-lm": {
			return {
				models: vscodeLlmModels,
				defaultModel: vscodeLlmDefaultModelId,
			}
		}
		case "novelweave": {
			return {
				models: routerModels["novelweave-openrouter"],
				defaultModel: novelweaveDefaultModel,
			}
		}
		// Temporary weird fix
		case "novelweave-openrouter": {
			return {
				models: routerModels["novelweave-openrouter"],
				defaultModel: novelweaveDefaultModel,
			}
		}
		case "claude-code": {
			return {
				models: claudeCodeModels,
				defaultModel: claudeCodeDefaultModelId,
			}
		}
		case "qwen-code": {
			return {
				models: qwenCodeModels,
				defaultModel: qwenCodeDefaultModelId,
			}
		}
		case "gemini-cli": {
			return {
				models: geminiCliModels,
				defaultModel: geminiDefaultModelId,
			}
		}
		case "anthropic": {
			return {
				models: anthropicModels,
				defaultModel: anthropicDefaultModelId,
			}
		}
		case "doubao": {
			return {
				models: doubaoModels,
				defaultModel: doubaoDefaultModelId,
			}
		}
		case "fireworks": {
			return {
				models: fireworksModels,
				defaultModel: fireworksDefaultModelId,
			}
		}
		// novelweave_change start
		case "synthetic": {
			return {
				models: syntheticModels,
				defaultModel: syntheticDefaultModelId,
			}
		}
		// novelweave_change end
		case "io-intelligence": {
			return {
				models: routerModels["io-intelligence"],
				defaultModel: ioIntelligenceDefaultModelId,
			}
		}
		case "moonshot": {
			return {
				models: moonshotModels,
				defaultModel: moonshotDefaultModelId,
			}
		}
		case "sambanova": {
			return {
				models: sambaNovaModels,
				defaultModel: sambaNovaDefaultModelId,
			}
		}
		case "featherless": {
			return {
				models: featherlessModels,
				defaultModel: featherlessDefaultModelId,
			}
		}
		case "deepinfra": {
			return {
				models: routerModels.deepinfra,
				defaultModel: deepInfraDefaultModelId,
			}
		}
		// novelweave_change start
		case "ovhcloud": {
			return {
				models: routerModels.ovhcloud,
				defaultModel: ovhCloudAiEndpointsDefaultModelId,
			}
		}
		// novelweave_change end
		default:
			return {
				models: {},
				defaultModel: "",
			}
	}
}

export const useProviderModels = (apiConfiguration?: ProviderSettings) => {
	const provider = apiConfiguration?.apiProvider || "anthropic"

	const { novelweaveDefaultModel } = useExtensionState()

	const routerModels = useRouterModels({
		openRouterBaseUrl: apiConfiguration?.openRouterBaseUrl,
		openRouterApiKey: apiConfiguration?.apiKey,
		novelweaveOrganizationId: apiConfiguration?.novelweaveOrganizationId ?? "personal",
		// novelweave_change start
		chutesApiKey: apiConfiguration?.chutesApiKey,
		geminiApiKey: apiConfiguration?.geminiApiKey,
		googleGeminiBaseUrl: apiConfiguration?.googleGeminiBaseUrl,
		// novelweave_change end
	})

	const { models, defaultModel } =
		apiConfiguration && typeof routerModels.data !== "undefined"
			? getModelsByProvider({
					provider,
					routerModels: routerModels.data,
					novelweaveDefaultModel,
				})
			: FALLBACK_MODELS

	return {
		provider,
		providerModels: models as ModelRecord,
		providerDefaultModel: defaultModel,
		isLoading: routerModels.isLoading,
		isError: routerModels.isError,
	}
}
