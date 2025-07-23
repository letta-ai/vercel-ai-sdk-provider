import {describe, it, expect} from 'vitest';
import {before} from "node:test";
import dotenv from 'dotenv';
import {generateText, streamText} from "ai";
import {newAgent, newAgentDescription, newAgentName, newAgentProjectId, testMessage} from "./src/e2e/const";

dotenv.config();

const {lettaLocal} = await import("../letta-provider");

describe('e2e Letta Local', () => {
    before(async () => {
        const list = await lettaLocal.client.agents.list({
            name: newAgentName,
            projectId: newAgentProjectId
        })

        if (list[0]) {
            await lettaLocal.client.agents.delete(list[0].id);
        }
    })

    it('[generate] it should create an agent, chat with it and delete it', {
        timeout: 100_000 // 100 seconds
    }, async () => {
        const agent = await lettaLocal.client.agents.create(newAgent);

        expect(agent.name).toBe(newAgentName);
        expect(agent.description).toBe(newAgentDescription);

        const message = await generateText({
            model: lettaLocal(agent.id),
            messages: testMessage
        })

        expect(message.text).to.exist

        await lettaLocal.client.agents.delete(agent.id);

        await expect(
            lettaLocal.client.agents.retrieve(agent.id)
        ).rejects.toHaveProperty('statusCode', 404)

    });

    it('[stream] it should create an agent, chat with it and delete it', {
        timeout: 100_000 // 100 seconds
    }, async () => {
        const agent = await lettaLocal.client.agents.create(newAgent);

        expect(agent.name).toBe(newAgentName);
        expect(agent.description).toBe(newAgentDescription);

        const {textStream} = streamText({
            model: lettaLocal(agent.id),
            messages: testMessage
        })

        let result = ''
        for await (const text of textStream) {
            result += text
        }

        expect(result).to.exist

        await lettaLocal.client.agents.delete(agent.id);

        await expect(
            lettaLocal.client.agents.retrieve(agent.id)
        ).rejects.toHaveProperty('statusCode', 404)

    });
})