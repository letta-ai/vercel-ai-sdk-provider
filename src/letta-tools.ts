import { z } from "zod";
import { Tool, ToolSet } from "ai";

/**
 * Collection of tool placeholders keyed by tool name.
 * This type is compatible with AI SDK's ToolSet.
 */
export type LettaToolCollection = ToolSet;

/**
 * Common prebuilt Letta tools that are frequently used.
 */
export const PREBUILT_TOOLS = {
  // Core memory tools
  core_memory_replace: {
    description:
      "Replace the contents of core memory. To delete memories, use an empty string for new_content.",
  },
  core_memory_append: {
    description: "Append to the contents of core memory.",
  },

  // Memory editing tools
  memory: {
    description:
      "Memory management tool with various sub-commands for memory block operations (view, create, str_replace, insert, delete, rename).",
  },
  memory_finish_edits: {
    description:
      "Call the memory_finish_edits command when you are finished making edits (integrating all new information) into the memory blocks.",
  },
  memory_replace: {
    description:
      "The memory_replace command allows you to replace a specific string in a memory block with a new string. This is used for making precise edits.",
  },
  memory_insert: {
    description:
      "The memory_insert command allows you to insert text at a specific location in a memory block.",
  },
  memory_rethink: {
    description:
      "The memory_rethink command allows you to completely rewrite the contents of a memory block. Use this tool to make large sweeping changes (e.g. when you want to condense or reorganize the memory blocks), do NOT use this tool to make small precise edits.",
  },

  // Archival memory tools
  archival_memory_insert: {
    description:
      "Add to archival memory. Make sure to phrase the memory contents such that it can be easily queried later.",
  },
  archival_memory_search: {
    description:
      "Search archival memory using semantic (embedding-based) search with optional temporal filtering.",
  },

  // Search tools
  conversation_search: {
    description:
      "Search prior conversation history using hybrid search (text + semantic similarity).",
  },

  // Messaging tools
  send_message: {
    description: "Sends a message to the human user.",
  },
  send_message_to_agents_matching_tags: {
    description:
      "Sends a message to all agents within the same organization that match the specified tag criteria. Agents must possess all of the tags in match_all and at least one of the tags in match_some to receive the message.",
  },
  send_message_to_agent_and_wait_for_reply: {
    description:
      "Sends a message to a specific Letta agent within the same organization and waits for a response. The sender's identity is automatically included, so no explicit introduction is needed in the message. This function is designed for two-way communication where a reply is expected.",
  },
  send_message_to_agent_async: {
    description:
      "Sends a message to a specific Letta agent within the same organization. The sender's identity is automatically included, so no explicit introduction is required in the message. This function does not expect a response from the target agent, making it suitable for notifications or one-way communication.",
  },

  // Execution tools
  run_code: {
    description:
      "Run code in a sandbox. Supports Python, Javascript, Typescript, R, and Java.",
  },

  // Web tools
  web_search: {
    description:
      "Search the web using Exa's AI-powered search engine and retrieve relevant content.",
  },
  fetch_webpage: {
    description:
      "Fetch a webpage and convert it to markdown/text format using Jina AI reader.",
  },

  // File system tools
  open_file: {
    description: "Open and read a file from the agent's filesystem",
  },
  grep_file: {
    description: "Search for a pattern in files",
  },
  search_file: {
    description: "Search for files by name or pattern",
  },
} as const;

/**
 * Type for prebuilt tool names.
 */
export type PrebuiltToolName = keyof typeof PREBUILT_TOOLS;

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
 * const tools = {
 *   my_tool: letta.tools.custom("my_tool", {
 *     description: "Does something useful",
 *     inputSchema: z.object({
 *       param: z.string()
 *     }),
 *     execute: async () => "Handled by Letta"
 *   })
 * };
 * ```
 */
export function custom(
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

/**
 * Creates a tool placeholder for a prebuilt Letta tool.
 * Since Letta handles tool execution on their backend, this creates a placeholder
 * that satisfies the Vercel AI SDK's type requirements.
 *
 * @param toolName - Name of the prebuilt tool
 * @returns A tool placeholder
 *
 * @example
 * ```typescript
 * const tools = {
 *   web_search: letta.tools.prebuilt("web_search"),
 *   memory_insert: letta.tools.prebuilt("memory_insert")
 * };
 * ```
 */
export function prebuilt(toolName: PrebuiltToolName): Tool<any, any> {
  const config = PREBUILT_TOOLS[toolName];
  return {
    description: config.description,
    inputSchema: z.any(),
    execute: () => "Handled by Letta",
    onInputAvailable: undefined,
    onInputStart: undefined,
    onInputDelta: undefined,
  };
}

/**
 * Main tools API object.
 */
export const tools = {
  custom,
  prebuilt,
};
