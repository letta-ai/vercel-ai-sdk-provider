import { ProviderV2, LanguageModelV2 } from "@ai-sdk/provider";
import { LettaClient } from "@letta-ai/letta-client";
import { LettaChatModel } from "./letta-chat";
import { tool } from "./letta-tools";

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
   * Creates a tool placeholder for Letta.
   * Since Letta handles tool execution on their backend, this creates a placeholder
   * that satisfies the Vercel AI SDK's type requirements.
   *
   * @param name - The name of the tool
   * @param options - Optional configuration options for the tool
   * @returns A tool placeholder compatible with Vercel AI SDK
   *
   * @example
   * ```typescript
   * // Basic tool
   * const webSearch = lettaLocal.tool("web_search");
   *
   * // Tool with description
   * const myTool = lettaLocal.tool("my_custom_tool", {
   *   description: "Does something useful"
   * });
   *
   * // Tool with description and schema
   * const analytics = lettaLocal.tool("analytics", {
   *   description: "Track analytics events",
   *   inputSchema: z.object({
   *     event: z.string(),
   *     properties: z.record(z.any()),
   *   }),
   * });
   * ```
   */
  tool: typeof tool;
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
  provider.tool = tool;

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
