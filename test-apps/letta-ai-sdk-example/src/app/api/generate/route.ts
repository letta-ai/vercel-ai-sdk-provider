import {
  generateText,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { lettaCloud, lettaLocal } from "@letta-ai/vercel-ai-sdk-provider";
import { AGENT_ID, TEST_MODE } from "@/app/env-vars";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages, agentId } = await req.json();

  console.log("messages", messages);

  // Use agentId from request body if provided, otherwise fall back to env var
  const activeAgentId = agentId || AGENT_ID;

  if (!activeAgentId) {
    throw new Error(
      "Missing agent ID - provide agentId in request or set LETTA_AGENT_ID environment variable",
    );
  }

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
      agent: { id: activeAgentId },
    },
    messages: messages,
  };

  if (TEST_MODE === "local") {
    console.log("Using local Letta agent:", activeAgentId);
    const baseModel = lettaLocal();
    const wrappedModel = wrapLanguageModel({
      model: baseModel,
      middleware: extractReasoningMiddleware({
        tagName: "thinking",
        separator: "\n",
        startWithReasoning: false,
      }),
    });
    result = generateText({
      model: wrappedModel,
      tools: commonConfig.tools,
      providerOptions: commonConfig.providerOptions,
      messages: commonConfig.messages,
    });
  } else {
    console.log("Using cloud Letta agent:", activeAgentId);
    const baseModel = lettaCloud();
    const wrappedModel = wrapLanguageModel({
      model: baseModel,
      middleware: extractReasoningMiddleware({
        tagName: "thinking",
        separator: "\n",
        startWithReasoning: false,
      }),
    });
    result = generateText({
      model: wrappedModel,
      tools: commonConfig.tools,
      providerOptions: commonConfig.providerOptions,
      messages: commonConfig.messages,
    });
  }

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
    console.error("Error generating text:", error);
    console.error(
      "Error details:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );

    // Fallback without extractReasoningMiddleware if there's an issue
    console.log("Falling back to basic reasoning...");
    try {
      const fallbackResult = await generateText({
        model: TEST_MODE === "local" ? lettaLocal() : lettaCloud(),
        tools: commonConfig.tools,
        providerOptions: commonConfig.providerOptions,
        messages: messages,
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
