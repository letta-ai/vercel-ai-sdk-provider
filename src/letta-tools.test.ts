import { describe, it, expect } from "vitest";
import { custom, prebuilt, PREBUILT_TOOLS } from "./letta-tools";
import { z } from "zod";

describe("letta-tools", () => {
  describe("custom", () => {
    it("should create a custom tool with default options", () => {
      const tool = custom("my_tool", {
        inputSchema: z.any(),
      });

      expect(tool).toHaveProperty("description");
      expect(tool).toHaveProperty("inputSchema");
      expect(tool).toHaveProperty("execute");
      expect(tool.description).toBe("my_tool tool");
    });

    it("should create a custom tool with custom description", () => {
      const tool = custom("my_tool", {
        inputSchema: z.any(),
        description: "Does something cool",
      });

      expect(tool.description).toBe("Does something cool");
    });

    it("should create a custom tool with custom input schema", () => {
      const schema = z.object({
        param1: z.string(),
        param2: z.number(),
      });

      const tool = custom("my_tool", {
        description: "Custom tool",
        inputSchema: schema,
      });

      expect(tool.inputSchema).toBe(schema);
    });

    it("should execute function returning Letta handling message", async () => {
      const tool = custom("my_tool", {
        inputSchema: z.any(),
      });

      expect(tool.execute).toBeDefined();
      if (tool.execute) {
        const result = await tool.execute(
          {},
          { toolCallId: "test-id", messages: [] },
        );
        expect(result).toBe("Handled by Letta");
      }
    });
  });

  describe("prebuilt", () => {
    it("should create a single prebuilt tool", () => {
      const tool = prebuilt("web_search");

      expect(tool).toHaveProperty("description");
      expect(tool.description).toBe(PREBUILT_TOOLS.web_search.description);
      expect(tool.inputSchema).toBeDefined();
    });

    it("should create multiple prebuilt tools", () => {
      const webSearch = prebuilt("web_search");
      const coreMemoryReplace = prebuilt("core_memory_replace");
      const memoryInsert = prebuilt("memory_insert");

      expect(webSearch).toHaveProperty("description");
      expect(coreMemoryReplace).toHaveProperty("description");
      expect(memoryInsert).toHaveProperty("description");
    });

    it("should create tools with correct descriptions from Letta source", () => {
      const coreMemoryAppend = prebuilt("core_memory_append");
      const sendMessage = prebuilt("send_message");

      expect(coreMemoryAppend.description).toBe(
        "Append to the contents of core memory.",
      );
      expect(sendMessage.description).toBe(
        "Sends a message to the human user.",
      );
    });

    it("should have input schemas defined", () => {
      const coreMemoryReplace = prebuilt("core_memory_replace");
      const coreMemoryAppend = prebuilt("core_memory_append");

      expect(coreMemoryReplace.inputSchema).toBeDefined();
      expect(coreMemoryAppend.inputSchema).toBeDefined();
    });

    it("should have correct descriptions for tools", () => {
      const webSearch = prebuilt("web_search");
      const runCode = prebuilt("run_code");

      expect(webSearch.description).toContain("Exa");
      expect(runCode.description).toContain("Python");
      expect(runCode.description).toContain("Javascript");
    });

    it("should have execute function returning Letta handling message", async () => {
      const tool = prebuilt("web_search");

      expect(tool.execute).toBeDefined();
      if (tool.execute) {
        const result = await tool.execute(
          {},
          { toolCallId: "test-id", messages: [] },
        );
        expect(result).toBe("Handled by Letta");
      }
    });
  });

  describe("PREBUILT_TOOLS", () => {
    it("should have correct structure for web_search", () => {
      expect(PREBUILT_TOOLS.web_search).toHaveProperty("description");
      expect(typeof PREBUILT_TOOLS.web_search.description).toBe("string");
    });

    it("should have correct structure for all tools", () => {
      Object.entries(PREBUILT_TOOLS).forEach(([name, config]) => {
        expect(config).toHaveProperty("description");
        expect(typeof config.description).toBe("string");
      });
    });
  });

  describe("integration", () => {
    it("should work in a realistic scenario with object literal", () => {
      // Combine prebuilt and custom tools
      const tools = {
        web_search: prebuilt("web_search"),
        core_memory_replace: prebuilt("core_memory_replace"),
        archival_memory_search: prebuilt("archival_memory_search"),
        analytics: custom("analytics", {
          description: "Track analytics events",
          inputSchema: z.object({
            event: z.string(),
            properties: z.record(z.any()),
          }),
        }),
        database_query: custom("database_query", {
          description: "Query the database",
          inputSchema: z.object({
            query: z.string(),
          }),
        }),
      };

      expect(tools).toHaveProperty("web_search");
      expect(tools).toHaveProperty("core_memory_replace");
      expect(tools).toHaveProperty("archival_memory_search");
      expect(tools).toHaveProperty("analytics");
      expect(tools).toHaveProperty("database_query");
      expect(Object.keys(tools).length).toBe(5);
    });
  });

  describe("accurate descriptions from Letta source", () => {
    it("should have accurate description for memory_rethink", () => {
      const tool = prebuilt("memory_rethink");

      expect(tool.description).toContain("completely rewrite");
      expect(tool.description).toContain("large sweeping changes");
      expect(tool.description).toContain(
        "do NOT use this tool to make small precise edits",
      );
    });

    it("should have accurate description for archival_memory_search", () => {
      const tool = prebuilt("archival_memory_search");

      expect(tool.description).toContain("semantic");
      expect(tool.description).toContain("embedding-based");
    });

    it("should have accurate description for conversation_search", () => {
      const tool = prebuilt("conversation_search");

      expect(tool.description).toContain("hybrid search");
      expect(tool.description).toContain("text + semantic similarity");
    });

    it("should have accurate description for send_message_to_agent_and_wait_for_reply", () => {
      const tool = prebuilt("send_message_to_agent_and_wait_for_reply");

      expect(tool.description).toContain("waits for a response");
      expect(tool.description).toContain("two-way communication");
    });

    it("should have accurate description for send_message_to_agent_async", () => {
      const tool = prebuilt("send_message_to_agent_async");

      expect(tool.description).toContain("does not expect a response");
      expect(tool.description).toContain("one-way communication");
    });

    it("should have accurate description for fetch_webpage", () => {
      const tool = prebuilt("fetch_webpage");

      expect(tool.description).toContain("Jina AI reader");
      expect(tool.description).toContain("markdown/text format");
    });
  });
});
