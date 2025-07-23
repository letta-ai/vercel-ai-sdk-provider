import { streamText } from 'ai';
import {lettaCloud, lettaLocal} from '@letta-ai/vercel-ai-sdk-provider';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    if (!process.env.LETTA_AGENT_ID) {
        throw new Error('Missing LETTA_AGENT_ID environment variable');
    }

    const result = streamText({
        model: lettaLocal('agent-19d912af-154b-4c20-a2f8-b49ac9ebe3f4'),
        messages,
    });

    return result.toDataStreamResponse();
}

