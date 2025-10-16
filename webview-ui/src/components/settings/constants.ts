import {
	type ProviderName,
	type ModelInfo,
	anthropicModels,
	bedrockModels,
	cerebrasModels,
	claudeCodeModels,
	deepSeekModels,
	moonshotModels,
	// novelweave_change start
	// geminiModels,
	geminiCliModels,
	// novelweave_change end
	mistralModels,
	openAiNativeModels,
	qwenCodeModels,
	vertexModels,
	xaiModels,
	groqModels,
	// chutesModels, // novelweave_change
	sambaNovaModels,
	doubaoModels,
	internationalZAiModels,
	fireworksModels,
	syntheticModels, // novelweave_change
	rooModels,
	featherlessModels,
} from "@roo-code/types"

export const MODELS_BY_PROVIDER: Partial<Record<ProviderName, Record<string, ModelInfo>>> = {
	anthropic: anthropicModels,
	"claude-code": claudeCodeModels,
	bedrock: bedrockModels,
	cerebras: cerebrasModels,
	deepseek: deepSeekModels,
	doubao: doubaoModels,
	moonshot: moonshotModels,
	// novelweave_change start
	// gemini: geminiModels,
	"gemini-cli": geminiCliModels,
	// novelweave_change end
	mistral: mistralModels,
	"openai-native": openAiNativeModels,
	"qwen-code": qwenCodeModels,
	vertex: vertexModels,
	xai: xaiModels,
	groq: groqModels,
	// chutes: chutesModels, // novelweave_change
	sambanova: sambaNovaModels,
	zai: internationalZAiModels,
	fireworks: fireworksModels,
	synthetic: syntheticModels, // novelweave_change
	roo: rooModels,
	featherless: featherlessModels,
}

export const PROVIDERS = [
	{ value: "openrouter", label: "OpenRouter" },
	{ value: "deepinfra", label: "DeepInfra" },
	{ value: "anthropic", label: "Anthropic" },
	{ value: "claude-code", label: "Claude Code" },
	{ value: "cerebras", label: "Cerebras" },
	{ value: "gemini", label: "Google Gemini" },
	{ value: "doubao", label: "Doubao" },
	// novelweave_change start
	{ value: "gemini-cli", label: "Gemini CLI" },
	{ value: "virtual-quota-fallback", label: "Virtual Quota Fallback" },
	// novelweave_change end
	{ value: "deepseek", label: "DeepSeek" },
	{ value: "moonshot", label: "Moonshot" },
	{ value: "openai-native", label: "OpenAI" },
	{ value: "openai", label: "OpenAI Compatible" },
	{ value: "qwen-code", label: "Qwen Code" },
	{ value: "vertex", label: "GCP Vertex AI" },
	{ value: "bedrock", label: "Amazon Bedrock" },
	{ value: "glama", label: "Glama" },
	{ value: "vscode-lm", label: "VS Code LM API" },
	{ value: "mistral", label: "Mistral" },
	{ value: "lmstudio", label: "LM Studio" },
	{ value: "ollama", label: "Ollama" },
	{ value: "ovhcloud", label: "OVHcloud AI Endpoints" }, // novelweave_change
	{ value: "unbound", label: "Unbound" },
	{ value: "requesty", label: "Requesty" },
	{ value: "human-relay", label: "Human Relay" },
	{ value: "xai", label: "xAI (Grok)" },
	{ value: "groq", label: "Groq" },
	{ value: "huggingface", label: "Hugging Face" },
	{ value: "chutes", label: "Chutes AI" },
	{ value: "litellm", label: "LiteLLM" },
	{ value: "sambanova", label: "SambaNova" },
	{ value: "zai", label: "Z AI" },
	{ value: "fireworks", label: "Fireworks AI" },
	{ value: "synthetic", label: "Synthetic" }, // novelweave_change
	{ value: "featherless", label: "Featherless AI" },
	{ value: "io-intelligence", label: "IO Intelligence" },
	// novelweave_change start
	// { value: "roo", label: "Roo Code Cloud" },
	// novelweave_change end
	{ value: "vercel-ai-gateway", label: "Vercel AI Gateway" },
].sort((a, b) => a.label.localeCompare(b.label))

PROVIDERS.unshift({ value: "novelweave", label: "NovelWeave" }) // novelweave_change
