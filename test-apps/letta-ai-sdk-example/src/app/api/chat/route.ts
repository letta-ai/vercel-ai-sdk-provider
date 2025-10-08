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

  console.log("=== DEBUG: Messages being sent to Letta ===");
  console.log(JSON.stringify(modelMessages, null, 2));

  let result;

  if (TEST_MODE === "local") {
    console.log("Using local Letta agent:", activeAgentId);

    const localConfig = {
      tools: {
        memory_insert: lettaLocal.tool("memory_insert"),
        memory_replace: lettaLocal.tool("memory_replace", {
          inputSchema: z.any(), // this is a placeholder for the input schema
        }),
      },
      providerOptions: {
        letta: {
          agent: { id: activeAgentId, background: true },
        },
      },
      messages: modelMessages,
    };

    console.log("=== DEBUG: Tools configured ===");
    console.log(JSON.stringify(Object.keys(localConfig.tools), null, 2));

    result = streamText({
      model: lettaLocal(),
      ...localConfig,
    });

    // const codingAgent = new Agent({
    //   model: lettaLocal(),
    //   tools: {
    //     /* Your tools */
    //   },
    // });
    // result = codingAgent.stream({
    //   ...localConfig,
    // });
  } else {
    console.log("Using cloud Letta agent:", activeAgentId);

    const cloudConfig = {
      tools: {
        memory_insert: lettaCloud.tool("memory_insert"),
        memory_replace: lettaCloud.tool("memory_replace", {
          inputSchema: z.any(), // this is a placeholder for the input schema
        }),
      },
      providerOptions: {
        letta: {
          agent: { id: activeAgentId, background: true },
        },
      },
      messages: modelMessages,
    };

    console.log("=== DEBUG: Tools configured ===");
    console.log(JSON.stringify(Object.keys(cloudConfig.tools), null, 2));

    result = streamText({
      model: lettaCloud(),
      ...cloudConfig,
    });
  }

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
      if (TEST_MODE === "local") {
        const localConfig = {
          tools: {
            memory_insert: lettaLocal.tool("memory_insert"),
            memory_replace: lettaLocal.tool("memory_replace", {
              inputSchema: z.any(),
            }),
          },
          providerOptions: {
            letta: {
              agent: { id: activeAgentId, background: true },
            },
          },
          messages: modelMessages,
        };

        const fallbackResult = streamText({
          model: lettaLocal(),
          ...localConfig,
        });

        return fallbackResult.toUIMessageStreamResponse({
          sendReasoning: true,
        });
      } else {
        const cloudConfig = {
          tools: {
            memory_insert: lettaCloud.tool("memory_insert"),
            memory_replace: lettaCloud.tool("memory_replace", {
              inputSchema: z.any(),
            }),
          },
          providerOptions: {
            letta: {
              agent: { id: activeAgentId, background: true },
            },
          },
          messages: modelMessages,
        };

        const fallbackResult = streamText({
          model: lettaCloud(),
          ...cloudConfig,
        });

        return fallbackResult.toUIMessageStreamResponse({
          sendReasoning: true,
        });
      }
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
