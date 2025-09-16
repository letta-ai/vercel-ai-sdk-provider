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
  LettaChatModel: vi.fn().mockImplementation((modelId, client, agentId) => ({
    specificationVersion: "v2",
    provider: "letta",
    modelId: modelId,
    supportedUrls: {},
    agentId: agentId || modelId,
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

      it("should return a language model when called with model ID", () => {
        const modelId = "openai-gpt-4o-mini";
        const model = lettaCloud(modelId);

        expect(model).toBeDefined();
        expect(LettaChatModel).toHaveBeenCalledWith(
          modelId,
          lettaCloud.client,
          undefined,
        );
      });

      it("should have provider properties", () => {
        expect(lettaCloud.client).toBeDefined();
      });
    });

    describe("lettaLocal", () => {
      it("should be a callable function", () => {
        expect(typeof lettaLocal).toBe("function");
      });

      it("should return a language model when called with model ID", () => {
        const modelId = "openai-gpt-4o-mini";
        const model = lettaLocal(modelId);

        expect(model).toBeDefined();
        expect(LettaChatModel).toHaveBeenCalledWith(
          modelId,
          lettaLocal.client,
          undefined,
        );
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
        new lettaCloud("openai-gpt-4o-mini");
      }).toThrow(
        "The Letta model function cannot be called with the new keyword.",
      );
    });
  });

  describe("Type consistency", () => {
    it("should maintain consistent interface", () => {
      const modelId = "openai-gpt-4o-mini";

      // Create a model using the callable provider
      const callableModel = lettaCloud(modelId);

      expect(callableModel).toBeDefined();
      expect(typeof callableModel).toBe("object");
    });

    it("should handle model ID correctly", () => {
      const modelId = "openai-gpt-4o-mini";

      // Direct callable should work with model ID
      lettaCloud(modelId);

      // Verify the LettaChatModel was created with the modelId
      expect(LettaChatModel).toHaveBeenCalledWith(
        modelId,
        expect.any(Object),
        undefined,
      );
    });
  });

  describe("Caching behavior", () => {
    it("should cache models with same model ID", () => {
      const modelId = "openai-gpt-4o-mini";

      const model1 = lettaCloud(modelId);
      const model2 = lettaCloud(modelId);

      // Should return the same cached instance
      expect(model1).toBe(model2);
    });

    it("should create different models for different model IDs", () => {
      const model1 = lettaCloud("openai-gpt-4o-mini");
      const model2 = lettaCloud("claude-3-sonnet");

      // Should be different instances
      expect(model1).not.toBe(model2);
    });
  });

  describe("Provider options handling", () => {
    it("should handle provider options with agent.id structure", () => {
      const modelId = "test-model";
      const agentId = "test-agent-123";

      const model = lettaCloud(modelId, { agent: { id: agentId } });

      expect(model).toBeDefined();
      expect(LettaChatModel).toHaveBeenCalledWith(
        modelId,
        lettaCloud.client,
        agentId,
      );
    });

    it("should create model without agent options for runtime resolution", () => {
      const modelId = "runtime-model";

      const model = lettaLocal(modelId);

      expect(model).toBeDefined();
      expect(LettaChatModel).toHaveBeenCalledWith(
        modelId,
        lettaLocal.client,
        undefined,
      );
    });
  });
});
