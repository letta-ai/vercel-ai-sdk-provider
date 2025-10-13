import { streamText, convertToModelMessages } from "ai";
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

  console.log('-> messages', messages)

  const modelMessages = convertToModelMessages(messages);

  console.log("=== DEBUG: Messages being sent to Letta ===");
  console.log(JSON.stringify(modelMessages, null, 2));

  // Select the appropriate provider based on TEST_MODE
  const provider = TEST_MODE === "local" ? lettaLocal : lettaCloud;
  console.log(`Using ${TEST_MODE === "local" ? "local" : "cloud"} Letta agent:`, activeAgentId);

  // Extract content from the last message for prompt
  const lastMessage = modelMessages[modelMessages.length - 1];
  const promptContent = typeof lastMessage.content === 'string'
    ? lastMessage.content
    : lastMessage.content.map(part => part.type === 'text' ? part.text : '').join('');

  console.log('-> promptContent:', promptContent)

  const config = {
    tools: {
      memory_insert: provider.tool("memory_insert"),
      memory_replace: provider.tool("memory_replace"),
    },
    providerOptions: {
      letta: {
        agent: { id: activeAgentId, background: true },
      },
    },
    prompt: promptContent,
  };

  console.log("=== DEBUG: Tools configured ===");
  console.log(JSON.stringify(Object.keys(config.tools), null, 2));

  const result = streamText({
    model: provider(),
    ...config,
  });

  try {
    console.log("=== Creating UI message stream ===");
    const response = result.toUIMessageStreamResponse({
      sendReasoning: true, // Include Letta agent reasoning
    });

    console.log("=== Stream created successfully ===");
    return response;
  } catch (error) {
    console.error("=== ERROR creating UI message stream ===");
    console.error("Error:", error);
    console.error(
      "Error details:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );

    // Check if this is a Letta API error
    if (error instanceof Error && error.message.includes("Status code:")) {
      console.error("=== This is a Letta API error ===");
      console.error("The error is coming from Letta's backend, not our SDK");
      console.error(
        "Common causes: tool misconfiguration, missing required arguments, agent setup issues",
      );
    }

    // Fallback without extractReasoningMiddleware if there's an issue
    console.log("Falling back to basic reasoning...");
    try {
      const fallbackProvider = TEST_MODE === "local" ? lettaLocal : lettaCloud;

      // Extract content from the last message for prompt
      const fallbackLastMessage = modelMessages[modelMessages.length - 1];
      const fallbackPrompt = typeof fallbackLastMessage.content === 'string'
        ? fallbackLastMessage.content
        : fallbackLastMessage.content.map(part => part.type === 'text' ? part.text : '').join('');

      const fallbackConfig = {
        tools: {
          memory_insert: fallbackProvider.tool("memory_insert"),
          memory_replace: fallbackProvider.tool("memory_replace"),
        },
        providerOptions: {
          letta: {
            agent: { id: activeAgentId, background: true },
          },
        },
        prompt: fallbackPrompt,
      };

      const fallbackResult = streamText({
        model: fallbackProvider(),
        ...fallbackConfig,
      });

      return fallbackResult.toUIMessageStreamResponse({
        sendReasoning: true,
      });
    } catch (fallbackError) {
      console.error("=== FALLBACK ALSO FAILED ===");
      console.error("Fallback error:", fallbackError);

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
          helpText:
            "If you see 'Function call send_message missing message argument', this is a Letta agent configuration issue. Check your agent's tools in the Letta UI.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
}
