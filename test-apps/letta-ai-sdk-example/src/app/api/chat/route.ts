import { streamText } from 'ai';
import { lettaCloud, lettaLocal } from '@letta-ai/vercel-ai-sdk-provider';
import {AGENT_ID, TEST_MODE} from '@/app/env-vars';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    if (!AGENT_ID) {
        throw new Error('Missing LETTA_AGENT_ID environment variable');
    }

    let result

    if (TEST_MODE === 'local') {
        console.log('Using local Letta agent:', AGENT_ID);
        result = streamText({
            model: lettaLocal(AGENT_ID),
            messages,
        });
    } else {
        console.log('Using Cloud Letta agent:', AGENT_ID);
        console.log('lettaCloud', lettaCloud(AGENT_ID));
        result = streamText({
            model: lettaCloud(AGENT_ID),
            messages,
        });
    }

    return result.toDataStreamResponse({ sendReasoning: true });
}