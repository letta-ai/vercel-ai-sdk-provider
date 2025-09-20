import { streamText, convertToModelMessages } from "ai";
import { lettaCloud, lettaLocal } from "@letta-ai/vercel-ai-sdk-provider";
import { AGENT_ID, TEST_MODE } from "@/app/env-vars";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages, agentId } = await req.json();

  // Use agentId from request body if provided, otherwise fall back to env var
  const activeAgentId = agentId || AGENT_ID;

  if (!activeAgentId) {
    throw new Error(
      "Missing agent ID - provide agentId in request or set LETTA_AGENT_ID environment variable",
    );
  }

  const modelMessages = convertToModelMessages(messages);

  let result;

  const commonConfig = {
    tools: {
      web_search: {
        description: "Search the web",
        inputSchema: z.any(),
        execute: async () => "Handled by Letta",
      },
      memory_replace: {
        description: "Replace memory content",
        inputSchema: z.any(),
        execute: async () => "Handled by Letta",
      },
    },
    providerOptions: {
      agent: { id: activeAgentId, background: true },
    },
    messages: modelMessages,
  };

  if (TEST_MODE === "local") {
    console.log("Using local Letta agent:", activeAgentId);
    result = streamText({
      model: lettaLocal(),
      ...commonConfig,
    });
  } else {
    console.log("Using cloud Letta agent:", activeAgentId);
    result = streamText({
      model: lettaCloud(),
      ...commonConfig,
    });
  }

  try {
    const response = result.toUIMessageStreamResponse({
      sendReasoning: true, // Include Letta agent reasoning
    });

    return response;
  } catch (error) {
    console.error("Error creating UI message stream response:", error);
    console.error(
      "Error details:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );

    // Fallback without extractReasoningMiddleware if there's an issue
    console.log("Falling back to basic reasoning...");
    try {
      const fallbackResult = streamText({
        model: TEST_MODE === "local" ? lettaLocal() : lettaCloud(),
        ...commonConfig,
      });

      return fallbackResult.toUIMessageStreamResponse({
        sendReasoning: true,
      });
    } catch (fallbackError) {
      return new Response(
        JSON.stringify({
          error: "Failed to create UI message stream",
          details: error instanceof Error ? error.message : String(error),
          fallbackError:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
          stack: error instanceof Error ? error.stack : undefined,
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
}
