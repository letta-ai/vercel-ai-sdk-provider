#!/usr/bin/env node
import 'dotenv/config';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function main() {
  const distPath = path.resolve(process.cwd(), 'dist', 'index.mjs');
  const providerMod = await import(pathToFileURL(distPath).toString());
  const { generateText, streamText } = await import('ai');

  // Decide provider based on environment
  const baseUrl = process.env.BASE_URL_OVERRIDE || process.env.LETTA_BASE_URL;
  const token = process.env.LETTA_API_KEY;

  let lettaProvider;
  if (baseUrl) {
    // Custom endpoint
    lettaProvider = providerMod.createLetta({ baseUrl, token });
  } else if (process.env.TEST_MODE === 'local') {
    // Local default
    lettaProvider = providerMod.lettaLocal;
  } else {
    // Cloud default
    lettaProvider = providerMod.lettaCloud;
  }

  const client = lettaProvider.client;

  // Use provided agent or create a temporary one
  let agentId = process.env.LETTA_AGENT_ID;
  let createdAgentId = null;

  if (!agentId) {
    const agent = await client.agents.create({
      name: `realworld-test-${Date.now()}`,
      description: 'Temporary agent for real-world provider test',
      model: 'openai/gpt-4o-mini',
      embedding: 'openai/text-embedding-3-small',
    });
    agentId = agent.id;
    createdAgentId = agent.id;
    console.log('Created test agent:', agentId);
  } else {
    console.log('Using existing agent:', agentId);
  }

  try {
    // Non-streaming test
    console.log('\n[generateText] Requesting response...');
    const gen = await generateText({
      model: lettaProvider(),
      providerOptions: { letta: { agent: { id: agentId } } },
      prompt: 'Say hello in one short sentence.',
    });
    console.log('[generateText] Text:', gen.text);

    // Streaming test
    console.log('\n[streamText] Requesting streaming response...');
    const stream = streamText({
      model: lettaProvider(),
      providerOptions: { letta: { agent: { id: agentId } } },
      prompt: 'Describe the weather in two short sentences.',
    });
    let streamed = '';
    for await (const chunk of stream.textStream) {
      streamed += chunk;
    }
    console.log('[streamText] Text:', streamed);
  } finally {
    if (createdAgentId) {
      try {
        await client.agents.delete(createdAgentId);
        console.log('Deleted test agent:', createdAgentId);
      } catch (err) {
        console.warn('Failed to delete test agent:', err?.message ?? err);
      }
    }
  }
}

main().catch((err) => {
  console.error('Real-world test failed:', err?.message ?? err);
  process.exit(1);
});
