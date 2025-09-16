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
  modelTestMessage,
  modelTestMessageWithAssistantRole,
  modelTestMessageWithSystemRole,
  modelTestMessageWithToolRole,
} from "./const";

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
        model: lettaCloud("openai-gpt-4o-mini", { agent: { id: agent.id } }),
        messages: modelTestMessage,
      });
      expect(message.text).to.exist.and.not.contain('3:"An error occurred."');

      // Type: System
      message = await generateText({
        model: lettaCloud("openai-gpt-4o-mini", { agent: { id: agent.id } }),
        messages: modelTestMessageWithSystemRole,
      });
      expect(message.text).to.exist.and.not.contain('3:"An error occurred."');

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
        model: lettaCloud("openai-gpt-4o-mini", { agent: { id: agent.id } }),
        messages: modelTestMessage,
      });
      for await (const text of userTextStream) {
        result += text;
      }
      expect(result).to.exist.and.not.contain('3:"An error occurred."');

      // Type: System
      result = "";
      const { textStream: systemTextStream } = streamText({
        model: lettaCloud("openai-gpt-4o-mini", { agent: { id: agent.id } }),
        messages: modelTestMessageWithSystemRole,
      });
      for await (const text of systemTextStream) {
        result += text;
      }
      expect(result).to.exist.and.not.contain('3:"An error occurred."');

      await lettaCloud.client.agents.delete(agent.id);

      await expect(
        lettaCloud.client.agents.retrieve(agent.id),
      ).rejects.toHaveProperty("statusCode", 404);
    },
  );
});
