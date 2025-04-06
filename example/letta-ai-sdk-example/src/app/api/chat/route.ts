import { streamText } from 'ai';
import { letta } from '@letta-ai/vercel-ai-sdk-provider';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    if (!process.env.LETTA_AGENT_ID) {
        throw new Error('Missing LETTA_AGENT_ID environment variable');
    }

    const result = streamText({
        model: letta(process.env.LETTA_AGENT_ID),
        messages,
    });

    return result.toDataStreamResponse();
}

