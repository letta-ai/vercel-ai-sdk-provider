import { streamText } from "ai";
import { lettaCloud, lettaLocal } from "@letta-ai/vercel-ai-sdk-provider";
import { AGENT_ID, TEST_MODE } from "@/app/env-vars";

export async function POST(req: Request) {
  const { messages, agentId } = await req.json();

  // Use agentId from request body if provided, otherwise fall back to env var
  const activeAgentId = agentId || AGENT_ID;

  if (!activeAgentId) {
    throw new Error(
      "Missing agent ID - provide agentId in request or set LETTA_AGENT_ID environment variable",
    );
  }

  let result;

  if (TEST_MODE === "local") {
    console.log("Using local Letta agent:", activeAgentId);
    result = streamText({
      model: lettaLocal("openai/gpt-4o-mini"),
      providerOptions: {
        agent: { id: activeAgentId },
      },
      messages,
    });
  } else {
    console.log("Using cloud Letta agent:", activeAgentId);
    result = streamText({
      model: lettaCloud("openai/gpt-4o-mini"),
      providerOptions: {
        agent: { id: activeAgentId },
      },
      messages,
    });
  }

  return result.toTextStreamResponse();
}
