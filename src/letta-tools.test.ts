import { describe, it, expect } from "vitest";
import { tool } from "./letta-tools";
import { z } from "zod";

describe("letta-tools", () => {
  describe("tool", () => {
    describe("custom tools", () => {
      it("should create a custom tool with default options", () => {
        const toolResult = tool("my_tool");

        expect(toolResult).toHaveProperty("description");
        expect(toolResult).toHaveProperty("inputSchema");
        expect(toolResult).toHaveProperty("execute");
        expect(toolResult.description).toBe("my_tool tool");
      });

      it("should create a custom tool with custom description", () => {
        const toolResult = tool("my_tool", {
          description: "Does something cool",
        });

        expect(toolResult.description).toBe("Does something cool");
      });

      it("should create a custom tool with custom input schema", () => {
        const schema = z.object({
          param1: z.string(),
          param2: z.number(),
        });

        const toolResult = tool("my_tool", {
          description: "Custom tool",
          inputSchema: schema,
        });

        expect(toolResult.inputSchema).toBe(schema);
      });

      it("should execute function returning Letta handling message", async () => {
        const toolResult = tool("my_tool");

        expect(toolResult.execute).toBeDefined();
        if (toolResult.execute) {
          const result = await toolResult.execute(
            {},
            { toolCallId: "test-id", messages: [] },
          );
          expect(result).toBe("Handled by Letta");
        }
      });
    });

    describe("prebuilt tools", () => {
      it("should create a tool with default description", () => {
        const toolResult = tool("web_search");

        expect(toolResult).toHaveProperty("description");
        expect(toolResult.description).toBe("web_search tool");
        expect(toolResult.inputSchema).toBeDefined();
      });

      it("should create multiple tools", () => {
        const webSearch = tool("web_search");
        const coreMemoryReplace = tool("core_memory_replace");
        const memoryInsert = tool("memory_insert");

        expect(webSearch).toHaveProperty("description");
        expect(webSearch.description).toBe("web_search tool");
        expect(coreMemoryReplace).toHaveProperty("description");
        expect(coreMemoryReplace.description).toBe("core_memory_replace tool");
        expect(memoryInsert).toHaveProperty("description");
        expect(memoryInsert.description).toBe("memory_insert tool");
      });

      it("should create tools with custom descriptions", () => {
        const coreMemoryAppend = tool("core_memory_append", {
          description: "Append to the contents of core memory.",
        });
        const sendMessage = tool("send_message", {
          description: "Sends a message to the human user.",
        });

        expect(coreMemoryAppend.description).toBe(
          "Append to the contents of core memory.",
        );
        expect(sendMessage.description).toBe(
          "Sends a message to the human user.",
        );
      });

      it("should have input schemas defined", () => {
        const coreMemoryReplace = tool("core_memory_replace");
        const coreMemoryAppend = tool("core_memory_append");

        expect(coreMemoryReplace.inputSchema).toBeDefined();
        expect(coreMemoryAppend.inputSchema).toBeDefined();
      });

      it("should have default descriptions based on tool name", () => {
        const webSearch = tool("web_search");
        const runCode = tool("run_code");

        expect(webSearch.description).toBe("web_search tool");
        expect(runCode.description).toBe("run_code tool");
      });

      it("should have execute function returning Letta handling message", async () => {
        const toolResult = tool("web_search");

        expect(toolResult.execute).toBeDefined();
        if (toolResult.execute) {
          const result = await toolResult.execute(
            {},
            { toolCallId: "test-id", messages: [] },
          );
          expect(result).toBe("Handled by Letta");
        }
      });

      it("should allow overriding default options", () => {
        const toolResult = tool("web_search", {
          description: "Custom description for web search",
        });

        expect(toolResult.description).toBe(
          "Custom description for web search",
        );
      });
    });
  });

  describe("integration", () => {
    it("should work in a realistic scenario with object literal", () => {
      // Combine tools with and without custom descriptions
      const toolSet = {
        web_search: tool("web_search"),
        core_memory_replace: tool("core_memory_replace"),
        archival_memory_search: tool("archival_memory_search"),
        analytics: tool("analytics", {
          description: "Track analytics events",
          inputSchema: z.object({
            event: z.string(),
            properties: z.record(z.any()),
          }),
        }),
        database_query: tool("database_query", {
          description: "Query the database",
          inputSchema: z.object({
            query: z.string(),
          }),
        }),
      };

      expect(toolSet).toHaveProperty("web_search");
      expect(toolSet).toHaveProperty("core_memory_replace");
      expect(toolSet).toHaveProperty("archival_memory_search");
      expect(toolSet).toHaveProperty("analytics");
      expect(toolSet).toHaveProperty("database_query");
      expect(Object.keys(toolSet).length).toBe(5);
    });
  });

  describe("custom descriptions", () => {
    it("should allow custom description for memory_rethink", () => {
      const toolResult = tool("memory_rethink", {
        description:
          "The memory_rethink command allows you to completely rewrite the contents of a memory block. Use this tool to make large sweeping changes (e.g. when you want to condense or reorganize the memory blocks), do NOT use this tool to make small precise edits.",
      });

      expect(toolResult.description).toContain("completely rewrite");
      expect(toolResult.description).toContain("large sweeping changes");
      expect(toolResult.description).toContain(
        "do NOT use this tool to make small precise edits",
      );
    });

    it("should allow custom description for archival_memory_search", () => {
      const toolResult = tool("archival_memory_search", {
        description:
          "Search archival memory using semantic (embedding-based) search with optional temporal filtering.",
      });

      expect(toolResult.description).toContain("semantic");
      expect(toolResult.description).toContain("embedding-based");
    });

    it("should allow custom description for conversation_search", () => {
      const toolResult = tool("conversation_search", {
        description:
          "Search prior conversation history using hybrid search (text + semantic similarity).",
      });

      expect(toolResult.description).toContain("hybrid search");
      expect(toolResult.description).toContain("text + semantic similarity");
    });

    it("should allow custom description for send_message_to_agent_and_wait_for_reply", () => {
      const toolResult = tool("send_message_to_agent_and_wait_for_reply", {
        description:
          "Sends a message to a specific Letta agent within the same organization and waits for a response. The sender's identity is automatically included, so no explicit introduction is needed in the message. This function is designed for two-way communication where a reply is expected.",
      });

      expect(toolResult.description).toContain("waits for a response");
      expect(toolResult.description).toContain("two-way communication");
    });

    it("should allow custom description for send_message_to_agent_async", () => {
      const toolResult = tool("send_message_to_agent_async", {
        description:
          "Sends a message to a specific Letta agent within the same organization. The sender's identity is automatically included, so no explicit introduction is required in the message. This function does not expect a response from the target agent, making it suitable for notifications or one-way communication.",
      });

      expect(toolResult.description).toContain("does not expect a response");
      expect(toolResult.description).toContain("one-way communication");
    });

    it("should allow custom description for fetch_webpage", () => {
      const toolResult = tool("fetch_webpage", {
        description:
          "Fetch a webpage and convert it to markdown/text format using Jina AI reader.",
      });

      expect(toolResult.description).toContain("Jina AI reader");
      expect(toolResult.description).toContain("markdown/text format");
    });
  });
});
