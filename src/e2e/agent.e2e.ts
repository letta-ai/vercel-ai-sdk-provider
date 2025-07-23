import {describe, it, expect} from 'vitest';
import {before} from "node:test";
import dotenv from 'dotenv';
import {generateText, streamText} from "ai";
import {newAgent, newAgentDescription, newAgentName, newAgentProjectId, testMessage} from "./src/e2e/const";

dotenv.config();

const {lettaCloud} = await import("../letta-provider");

describe('e2e Letta Cloud', () => {
    before(async () => {
        const list = await lettaCloud.client.agents.list({
            name: newAgentName,
            projectId: newAgentProjectId
        })

        if (list[0]) {
            await lettaCloud.client.agents.delete(list[0].id);
        }
    })

    it('[generate] it should create an agent, chat with it and delete it', {
        timeout: 100_000 // 100 seconds
    }, async () => {
        const agent = await lettaCloud.client.agents.create(newAgent);

        expect(agent.name).toBe(newAgentName);
        expect(agent.description).toBe(newAgentDescription);

        const message = await generateText({
            model: lettaCloud(agent.id),
            messages: testMessage
        })

        expect(message.text).to.exist

        await lettaCloud.client.agents.delete(agent.id)

        await expect(
            lettaCloud.client.agents.retrieve(agent.id)
        ).rejects.toHaveProperty('statusCode', 404)
    });

    it('[stream] it should create an agent, chat with it and delete it', {
        timeout: 100_000 // 100 seconds
    }, async () => {
        const agent = await lettaCloud.client.agents.create(newAgent);

        expect(agent.name).toBe(newAgentName);
        expect(agent.description).toBe(newAgentDescription);

        const {textStream} = streamText({
            model: lettaCloud(agent.id),
            messages: testMessage
        })

        let result = ''
        for await (const text of textStream) {
            result += text
        }

        expect(result).to.exist

        await lettaCloud.client.agents.delete(agent.id);

        await expect(
            lettaCloud.client.agents.retrieve(agent.id)
        ).rejects.toHaveProperty('statusCode', 404)

    });
});