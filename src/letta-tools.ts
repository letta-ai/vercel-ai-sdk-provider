import { z } from "zod";
import { Tool, ToolSet } from "ai";

/**
 * Collection of tool placeholders keyed by tool name.
 * This type is compatible with AI SDK's ToolSet.
 */
export type LettaToolCollection = ToolSet;

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
export function tool(
  name: string,
  options: Partial<Tool<any, any>> = {},
): Tool<any, any> {
  const {
    description = `${name} tool`,
    inputSchema = z.any(),
    execute = () => "Handled by Letta",
  } = options;

  return {
    description,
    inputSchema,
    execute,
    onInputAvailable: undefined,
    onInputStart: undefined,
    onInputDelta: undefined,
  };
}
