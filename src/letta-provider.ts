import { ProviderV2, LanguageModelV2 } from "@ai-sdk/provider";
import { LettaClient } from "@letta-ai/letta-client";
import { LettaChatModel } from "./letta-chat";

export interface LettaProvider extends ProviderV2 {
  /**
   * Creates a language model.
   */
  (): LanguageModelV2;

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
      options.baseUrl || process.env.LETTA_BASE_URL || "https://api.letta.com",
  });

  const createLettaChatModel = (): LettaChatModel => {
    console.log(client);

    return new LettaChatModel(client);
  };

  const provider = function (): LanguageModelV2 {
    if (new.target) {
      throw new Error(
        "The Letta model function cannot be called with the new keyword.",
      );
    }

    if (arguments.length > 0) {
      throw new Error(
        "The Letta provider does not accept model parameters. Model configurations is managed through your Letta agents.",
      );
    }

    // Return a language model that will extract agentId from providerOptions at runtime
    return createLettaChatModel();
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
  baseUrl: "http://localhost:3006",
});
