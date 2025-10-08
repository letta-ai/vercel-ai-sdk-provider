import { ProviderV2, LanguageModelV2 } from "@ai-sdk/provider";
import { LettaClient } from "@letta-ai/letta-client";
import { LettaChatModel } from "./letta-chat";
import * as lettaTools from "./letta-tools";

export interface LettaTools {
  /**
   * Creates a custom tool placeholder for Letta.
   * Since Letta handles tool execution on their backend, this creates a placeholder
   * that satisfies the Vercel AI SDK's type requirements.
   *
   * @param name - The name of the tool
   * @param options - Configuration options for the tool
   * @returns A tool placeholder compatible with Vercel AI SDK
   *
   * @example
   * ```typescript
   * const myTool = letta.tools.custom("my_tool", {
   *   description: "Does something useful",
   *   inputSchema: z.object({ param: z.string() }),
   *   execute: async () => "Handled by Letta"
   * });
   * ```
   */
  custom: typeof lettaTools.custom;

  /**
   * Creates tool placeholders for one or more prebuilt Letta tools.
   * Since Letta handles tool execution on their backend, these are placeholders
   * that satisfy the Vercel AI SDK's type requirements.
   *
   * @param toolNames - Names of prebuilt tools to include
   * @returns A collection of tool placeholders
   *
   * @example
   * ```typescript
   * const tools = letta.tools.prebuilt("web_search", "core_memory_replace");
   * ```
   */
  prebuilt: typeof lettaTools.prebuilt;
}

export interface LettaProvider extends ProviderV2 {
  /**
   * Creates a language model.
   */
  (): LanguageModelV2;

  /**
   * The underlying Letta client for direct API access.
   */
  client: LettaClient;
  /**
   * Tools for the Letta agent.
   */
  tools: LettaTools;
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

  provider.tools = {
    custom: lettaTools.custom,
    prebuilt: lettaTools.prebuilt,
  };

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
