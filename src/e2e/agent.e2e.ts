import { describe, it, expect } from "vitest";
import { before } from "node:test";
import dotenv from "dotenv";
import { generateText, streamText } from "ai";
import {
  newAgent,
  newAgentDescription,
  newAgentName,
  newAgentProjectId,
  testMessage,
  testMessageWithAssistantRole,
  testMessageWithSystemRole,
  testMessageWithToolRole,
} from "./src/e2e/const";

dotenv.config();

const { lettaCloud } = await import("../letta-provider");

describe("e2e Letta Cloud", () => {
  before(async () => {
    const list = await lettaCloud.client.agents.list({
      name: newAgentName,
      projectId: newAgentProjectId,
    });

    if (list[0]) {
      await lettaCloud.client.agents.delete(list[0].id);
    }
  });

  it(
    "[generate] it should create an agent, chat with it and delete it",
    {
      timeout: 100_000, // 100 seconds
    },
    async () => {
      const agent = await lettaCloud.client.agents.create(newAgent);

      expect(agent.name).toBe(newAgentName);
      expect(agent.description).toBe(newAgentDescription);

      let message;

      // Type: User
      message = await generateText({
        model: lettaCloud(agent.id),
        messages: testMessage,
      });
      expect(message.text).to.exist.and.not.contain('3:"An error occurred."');

      // Type: Assistant
      await expect(
        generateText({
          model: lettaCloud(agent.id),
          messages: testMessageWithAssistantRole,
        }),
      ).rejects.toThrowError(new Error("Assistant role is not supported"));

      // Type: System
      message = await generateText({
        model: lettaCloud(agent.id),
        messages: testMessageWithSystemRole,
      });
      expect(message.text).to.exist.and.not.contain('3:"An error occurred."');

      // Type: Tool
      await expect(
        generateText({
          model: lettaCloud(agent.id),
          messages: testMessageWithToolRole,
        }),
      ).rejects.toThrow();

      // Delete
      await lettaCloud.client.agents.delete(agent.id);

      await expect(
        lettaCloud.client.agents.retrieve(agent.id),
      ).rejects.toHaveProperty("statusCode", 404);
    },
  );

  it(
    "[stream] it should create an agent, chat with it and delete it",
    {
      timeout: 100_000, // 100 seconds
    },
    async () => {
      const agent = await lettaCloud.client.agents.create(newAgent);

      expect(agent.name).toBe(newAgentName);
      expect(agent.description).toBe(newAgentDescription);

      let result = "";

      // Type: User
      const { textStream: userTextStream } = streamText({
        model: lettaCloud(agent.id),
        messages: testMessage,
      });
      for await (const text of userTextStream) {
        result += text;
      }
      expect(result).to.exist.and.not.contain('3:"An error occurred."');

      // Type: Assistant
      const { textStream: assistantTextStream } = streamText({
        model: lettaCloud(agent.id),
        messages: testMessageWithAssistantRole,
      });
      for await (const text of assistantTextStream) {
        result += text;
      }
      expect(result).to.exist.and.not.contain('3:"An error occurred."');

      // Type: System
      const { textStream: systemTextStream } = streamText({
        model: lettaCloud(agent.id),
        messages: testMessageWithSystemRole,
      });
      for await (const text of systemTextStream) {
        result += text;
      }
      expect(result).to.exist.and.not.contain('3:"An error occurred."');

      // Type: Tool
      await expect(async () => {
        streamText({
          model: lettaCloud(agent.id),
          messages: testMessageWithToolRole,
        });
      }).rejects.toThrow();

      await lettaCloud.client.agents.delete(agent.id);

      await expect(
        lettaCloud.client.agents.retrieve(agent.id),
      ).rejects.toHaveProperty("statusCode", 404);
    },
  );
});
