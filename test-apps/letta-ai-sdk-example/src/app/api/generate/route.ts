import {
  generateText,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { lettaCloud, lettaLocal } from "@letta-ai/vercel-ai-sdk-provider";
import { AGENT_ID, TEST_MODE } from "@/app/env-vars";

export async function POST(req: Request) {
  const { messages, agentId } = await req.json();

  console.log("messages received:", Array.isArray(messages) ? messages.length : 0);

  // Use agentId from request body if provided, otherwise fall back to env var
  const activeAgentId = agentId || AGENT_ID;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages array is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const extractText = (msg: any) =>
    typeof msg?.content === "string"
      ? msg.content
      : msg?.content?.map?.((part: any) => (part?.type === "text" ? part.text : "")).join(" ") || "";

  // Extract content from the last message for prompt
  const lastMessage = messages[messages.length - 1];
  const promptContent = extractText(lastMessage);

  if (!activeAgentId) {
    throw new Error(
      "Missing agent ID - provide agentId in request or set LETTA_AGENT_ID environment variable",
    );
  }

  // Select the appropriate provider based on TEST_MODE
  const provider = TEST_MODE === "local" ? lettaLocal : lettaCloud;
  console.log(`Using ${TEST_MODE === "local" ? "local" : "cloud"} Letta agent:`, activeAgentId);

  const baseModel = provider();
  const wrappedModel = wrapLanguageModel({
    model: baseModel,
    middleware: extractReasoningMiddleware({
      tagName: "thinking",
      separator: "\n",
      startWithReasoning: false,
    }),
  });

  const result = generateText({
    model: wrappedModel,
    tools: {
      web_search: provider.tool("web_search", {
        description: "Search the web",
      }),
      memory_replace: provider.tool("memory_replace", {
        description: "Replace memory content",
      }),
    },
    providerOptions: {
      letta: {
        agent: { id: activeAgentId },
      },
    },
    prompt: promptContent,
  });

  try {
    // Wait for the complete result and return it as a UI message response
    const finalResult = await result;

    // Create a UI message response similar to streaming but with complete data
    const message = {
      id: `msg-${Date.now()}`,
      role: "assistant" as const,
      content: finalResult.text,
      experimental_data: {
        text: finalResult.text,
        finishReason: finalResult.finishReason,
        usage: finalResult.usage,
        warnings: finalResult.warnings,
        toolCalls: finalResult.toolCalls,
        toolResults: finalResult.toolResults,
        reasoning: finalResult.reasoning,
        response: finalResult.response,
      },
    };

    return Response.json({
      messages: [message],
    });
  } catch (error) {
    console.error("Error generating text:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "unknown",
    });

    // Fallback without extractReasoningMiddleware if there's an issue
    console.log("Falling back to basic reasoning...");
    try {
      const fallbackProvider = TEST_MODE === "local" ? lettaLocal : lettaCloud;

      // Reuse previously computed prompt
      const fallbackPrompt = promptContent;

      const fallbackResult = await generateText({
        model: fallbackProvider(),
        tools: {
          web_search: fallbackProvider.tool("web_search"),
          memory_replace: fallbackProvider.tool("memory_replace"),
        },
        providerOptions: {
          letta: {
            agent: { id: activeAgentId },
          },
        },
        prompt: fallbackPrompt,
      });

      const message = {
        id: `msg-${Date.now()}`,
        role: "assistant" as const,
        content: fallbackResult.text,
        experimental_data: fallbackResult,
      };

      return Response.json({
        messages: [message],
      });
    } catch (fallbackError) {
      return new Response(
        JSON.stringify({
          error: "Failed to generate text",
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
