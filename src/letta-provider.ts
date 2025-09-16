import { ProviderV2, LanguageModelV2 } from "@ai-sdk/provider";
import { LettaClient } from "@letta-ai/letta-client";
import { LettaChatModel } from "./letta-chat";

export interface LettaProviderOptions {
  agent: {
    id: string;
  };
}

export interface LettaProvider extends ProviderV2 {
  /**
   * Creates a language model for the specified model ID.
   */
  (modelId?: string, options?: LettaProviderOptions): LanguageModelV2;

  /**
   * The underlying Letta client for direct API access.
   */
  client: LettaClient;
}

/**
 * Create a Letta AI provider instance.
 */
export function createLetta(options: LettaClient.Options = {}): LettaProvider {
  const client = new LettaClient({
    ...options,
    token: options.token || process.env.LETTA_API_KEY,
    baseUrl:
      options.baseUrl ||
      process.env.BASE_URL_OVERRIDE ||
      "https://api.letta.com",
  });

  // Cache for chat models by agent ID
  const chatModelCache: Record<string, LettaChatModel> = {};

  const createLettaChatModel = (
    modelId: string,
    agentId?: string,
  ): LettaChatModel => {
    const cacheKey = agentId ? `${modelId}:${agentId}` : modelId;
    if (!chatModelCache[cacheKey]) {
      chatModelCache[cacheKey] = new LettaChatModel(modelId, client, agentId);
    }
    return chatModelCache[cacheKey];
  };

  const provider = function (
    modelId?: string,
    options?: LettaProviderOptions,
  ): LanguageModelV2 {
    if (new.target) {
      throw new Error(
        "The Letta model function cannot be called with the new keyword.",
      );
    }

    const finalModelId = modelId || "letta-model";

    // If options with agent.id are provided, use them directly
    if (options?.agent?.id) {
      return createLettaChatModel(finalModelId, options.agent.id);
    }

    // Otherwise, return a language model that will extract agentId from providerOptions at runtime
    return createLettaChatModel(finalModelId);
  } as LettaProvider;

  provider.client = client;

  return provider;
}

/**
 * Default Letta provider instance for cloud.
 */
export const lettaCloud = createLetta();

/**
 * Letta provider instance for local development.
 */
export const lettaLocal = createLetta({
  baseUrl: "http://localhost:8283",
});
