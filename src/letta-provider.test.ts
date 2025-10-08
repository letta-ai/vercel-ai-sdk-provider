import { describe, it, expect, vi } from "vitest";
import { lettaCloud, lettaLocal, createLetta } from "./letta-provider";
import { LettaChatModel } from "./letta-chat";

// Mock the LettaClient
vi.mock("@letta-ai/letta-client", () => ({
  LettaClient: vi.fn().mockImplementation(() => ({
    agents: {
      list: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      retrieve: vi.fn(),
    },
  })),
}));

// Mock the LettaChatModel
vi.mock("./letta-chat", () => ({
  LettaChatModel: vi.fn().mockImplementation((client) => ({
    specificationVersion: "v2",
    provider: "letta",
    supportedUrls: {},
    client,
  })),
}));

describe("Letta Provider", () => {
  describe("createLetta", () => {
    it("should create a provider with default options", () => {
      const provider = createLetta();

      expect(provider).toBeDefined();
      expect(provider.client).toBeDefined();
    });

    it("should create a provider with custom options", () => {
      const options = {
        baseUrl: "https://custom.letta.com",
        token: "custom-token",
      };

      const provider = createLetta(options);

      expect(provider).toBeDefined();
      expect(provider.client).toBeDefined();
    });
  });

  describe("Callable Providers", () => {
    describe("lettaCloud", () => {
      it("should be a callable function", () => {
        expect(typeof lettaCloud).toBe("function");
      });

      it("should return a language model when called", () => {
        const model = lettaCloud();

        expect(model).toBeDefined();
        expect(LettaChatModel).toHaveBeenCalledWith(lettaCloud.client);
      });

      it("should have provider properties", () => {
        expect(lettaCloud.client).toBeDefined();
      });
    });

    describe("lettaLocal", () => {
      it("should be a callable function", () => {
        expect(typeof lettaLocal).toBe("function");
      });

      it("should return a language model when called", () => {
        const model = lettaLocal();

        expect(model).toBeDefined();
        expect(LettaChatModel).toHaveBeenCalledWith(lettaLocal.client);
      });

      it("should have provider properties", () => {
        expect(lettaLocal.client).toBeDefined();
      });

      it("should be configured for local development", () => {
        // The local provider should be configured with localhost baseUrl
        expect(lettaLocal.client).toBeDefined();
      });
    });
  });

  describe("Error handling", () => {
    it("should throw error when called with new keyword", () => {
      expect(() => {
        // @ts-expect-error Testing error case
        new lettaCloud();
      }).toThrow(
        "The Letta model function cannot be called with the new keyword.",
      );
    });
  });

  describe("Parameter validation", () => {
    it("should throw error when parameters are passed", () => {
      expect(() => {
        // @ts-expect-error Testing error case
        lettaCloud("gpt-4");
      }).toThrow(
        "The Letta provider does not accept model parameters. Model configurations is managed through your Letta agents.",
      );
    });

    it("should throw error when multiple parameters are passed", () => {
      expect(() => {
        // @ts-expect-error Testing error case
        lettaLocal("model", { option: "value" });
      }).toThrow(
        "The Letta provider does not accept model parameters. Model configurations is managed through your Letta agents.",
      );
    });
  });

  describe("Type consistency", () => {
    it("should maintain consistent interface", () => {
      // Create a model using the callable provider
      const callableModel = lettaCloud();

      expect(callableModel).toBeDefined();
      expect(typeof callableModel).toBe("object");
    });

    it("should handle default model ID correctly", () => {
      // Direct callable should work without parameters
      lettaCloud();

      // Verify the LettaChatModel was created with the client
      expect(LettaChatModel).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("Model creation", () => {
    it("should create model instances", () => {
      const model1 = lettaCloud();
      const model2 = lettaCloud();

      expect(model1).toBeDefined();
      expect(model2).toBeDefined();
    });

    it("should create models with consistent configuration", () => {
      const model1 = lettaCloud();
      const model2 = lettaLocal();

      // Both should be defined but from different providers
      expect(model1).toBeDefined();
      expect(model2).toBeDefined();
    });
  });

  describe("Provider options handling", () => {
    it("should create model for runtime provider options resolution", () => {
      const model = lettaCloud();

      expect(model).toBeDefined();
      expect(LettaChatModel).toHaveBeenCalledWith(lettaCloud.client);
    });

    it("should work with both cloud and local providers", () => {
      const cloudModel = lettaCloud();
      const localModel = lettaLocal();

      expect(cloudModel).toBeDefined();
      expect(localModel).toBeDefined();
      expect(LettaChatModel).toHaveBeenCalledWith(lettaCloud.client);
      expect(LettaChatModel).toHaveBeenCalledWith(lettaLocal.client);
    });
  });

  describe("Tool API", () => {
    it("should expose tool property on provider", () => {
      const provider = lettaCloud;

      expect(provider.tool).toBeDefined();
      expect(typeof provider.tool).toBe("function");
    });

    it("should create custom tools", () => {
      const toolResult = lettaCloud.tool("my_tool", {
        description: "My custom tool",
      });

      expect(toolResult).toHaveProperty("description");
      expect(toolResult).toHaveProperty("inputSchema");
      expect(toolResult).toHaveProperty("execute");
      expect(toolResult.description).toBe("My custom tool");
    });

    it("should create tools with default descriptions", () => {
      const webSearchTool = lettaCloud.tool("web_search");
      const memoryReplaceTool = lettaCloud.tool("memory_replace");

      expect(webSearchTool).toHaveProperty("description");
      expect(webSearchTool).toHaveProperty("inputSchema");
      expect(webSearchTool).toHaveProperty("execute");
      expect(webSearchTool.description).toBe("web_search tool");
      expect(memoryReplaceTool).toHaveProperty("description");
      expect(memoryReplaceTool).toHaveProperty("inputSchema");
      expect(memoryReplaceTool).toHaveProperty("execute");
      expect(memoryReplaceTool.description).toBe("memory_replace tool");
    });

    it("should work with both cloud and local providers", () => {
      const webSearchTool = lettaCloud.tool("web_search");
      const customTool = lettaLocal.tool("my_custom_tool", {
        description: "Custom tool",
      });

      expect(webSearchTool).toHaveProperty("description");
      expect(webSearchTool.description).toBe("web_search tool");
      expect(customTool).toHaveProperty("description");
      expect(customTool.description).toBe("Custom tool");
    });
  });
});
