import { streamText } from 'ai';
import { lettaCloud, lettaLocal } from '@letta-ai/vercel-ai-sdk-provider';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    if (!process.env.LETTA_AGENT_ID) {
        throw new Error('Missing LETTA_AGENT_ID environment variable');
    }

    let result

    if (process.env.USE_THIS_LOCALLY) {
        result = streamText({
            model: lettaLocal(process.env.LETTA_AGENT_ID),
            messages,
        });
    } else {
        result = streamText({
            model: lettaCloud(process.env.LETTA_AGENT_ID),
            messages,
        });
    }

    return result.toDataStreamResponse();
}

