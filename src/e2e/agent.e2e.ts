import {describe, it, expect} from 'vitest';
import {before} from "node:test";
import dotenv from 'dotenv';
import {generateText} from "ai";

dotenv.config();

const {lettaCloud, lettaLocal} = await import("../letta-provider");

describe('e2e Letta Cloud', () => {
    before(async () => {
        const list = await lettaCloud.client.agents.list({
            name: 'e2e-test-agent-vercel-ai-sdk',
            projectId: '93e18d21-28e1-4694-82a5-7f7ea1002afe',
        })

        if (list[0]) {
            await lettaCloud.client.agents.delete(list[0].id);
        }
    })

    it('it should create an agent, chat with it and delete it', {
        timeout: 100_000 // 100 seconds
    }, async () => {
        const agent = await lettaCloud.client.agents.create({
            name: 'e2e-test-agent-vercel-ai-sdk',
            description: 'This is a test agent for e2e testing with vercel ai sdk',
            model: 'openai/gpt-4o-mini',
            projectId: '93e18d21-28e1-4694-82a5-7f7ea1002afe',
        });

        expect(agent.name).toBe('e2e-test-agent-vercel-ai-sdk');
        expect(agent.description).toBe('This is a test agent for e2e testing with vercel ai sdk');

        const message = await generateText({
            model: lettaCloud(agent.id),
            messages: [
                {
                    role: 'user',
                    content: 'Hello, who are you?'
                }
            ],
        })


        expect(message.text).to.exist

        await lettaCloud.client.agents.delete(agent.id);
    });
});

describe('e2e Letta Local', () => {
    before(async () => {
        const list = await lettaLocal.client.agents.list({
            name: 'e2e-test-agent-vercel-ai-sdk',
            projectId: '93e18d21-28e1-4694-82a5-7f7ea1002afe',
        })

        if (list[0]) {
            await lettaLocal.client.agents.delete(list[0].id);
        }
    })

    it('it should create an agent, chat with it and delete it', {
        timeout: 100_000 // 100 seconds
    }, async () => {
        const agent = await lettaLocal.client.agents.create({
            name: 'e2e-test-agent-vercel-ai-sdk',
            description: 'This is a test agent for e2e testing with vercel ai sdk',
            model: 'openai/gpt-4o-mini',
            projectId: '93e18d21-28e1-4694-82a5-7f7ea1002afe',
            embedding: 'openai/text-embedding-3-small',
        });

        expect(agent.name).toBe('e2e-test-agent-vercel-ai-sdk');
        expect(agent.description).toBe('This is a test agent for e2e testing with vercel ai sdk');

        const message = await generateText({
            model: lettaLocal(agent.id),
            messages: [
                {
                    role: 'user',
                    content: 'Hello, who are you?'
                }
            ],
        })


        expect(message.text).to.exist

        await lettaLocal.client.agents.delete(agent.id);
    });
})