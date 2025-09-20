import {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2StreamPart,
  LanguageModelV2Usage,
} from "@ai-sdk/provider";
import { convertToLettaMessage } from "./convert-to-letta-message";
import { LettaClient } from "@letta-ai/letta-client";
import type { LettaMessageUnion } from "@letta-ai/letta-client/api";

interface ProviderOptions {
  agent: {
    id?: string;
    background?: boolean;
  };
}

interface MessageWithId {
  id?: string;
}

export class LettaChatModel implements LanguageModelV2 {
  readonly specificationVersion = "v2" as const;
  readonly provider = "letta";
  readonly modelId = "placeholder"; // required by ai sdk v5, but we're not using it
  readonly supportedUrls = {};

  private readonly client: LettaClient;

  constructor(client: LettaClient) {
    this.client = client;
  }

  private getArgs(options: LanguageModelV2CallOptions) {
    const warnings: LanguageModelV2CallWarning[] = [];

    // Extract agentId from providerOptions
    const providerOptions = (
      options as LanguageModelV2CallOptions & {
        providerOptions?: ProviderOptions;
      }
    ).providerOptions;
    const agentId = providerOptions?.agent?.id;
    const background = providerOptions?.agent?.background;

    if (!agentId) {
      throw new Error(
        "Letta provider requires an agentId in providerOptions. Usage: generateText({ model: lettaCloud(), providerOptions: { agent: { id: 'your-agent-id' } }, ... })",
      );
    }

    const baseArgs = {
      agentId,
      background,
      messages: convertToLettaMessage([
        options.prompt[options.prompt.length - 1], // backend SDK only supports one message at a time
      ]),
    };

    return {
      args: baseArgs,
      warnings,
    };
  }

  async doGenerate(options: LanguageModelV2CallOptions) {
    const { args, warnings } = this.getArgs(options);

    const { messages } = await this.client.agents.messages.create(
      args.agentId,
      {
        messages: args.messages,
      },
      {
        timeoutInSeconds: 1000,
      },
    );

    const content: LanguageModelV2Content[] = [];
    let finishReason: LanguageModelV2FinishReason = "stop";

    messages.forEach((message) => {
      if (message.messageType === "assistant_message") {
        const textContent =
          typeof message.content === "string"
            ? message.content
            : message.content
                .map((c) => (c.type === "text" ? c.text : ""))
                .join("");
        content.push({
          type: "text",
          text: textContent,
        });
      }

      if (message.messageType === "tool_call_message") {
        content.push({
          type: "tool-call",
          toolCallId: message.id,
          toolName: message.name || "",
          input: message.toolCall?.arguments || "",
        });
      }

      if (message.messageType === "reasoning_message") {
        content.push({
          type: "reasoning",
          text: message.reasoning,
          providerMetadata: {
            reasoning: { source: (message as any).source || "" },
          },
        });
      }
    });

    const usage: LanguageModelV2Usage = {
      inputTokens: -1,
      outputTokens: -1,
      totalTokens: -1,
    };

    return {
      content,
      finishReason,
      usage,
      warnings,
      request: {
        body: args,
      },
      response: {
        body: messages,
      },
    };
  }

  async doStream(options: LanguageModelV2CallOptions) {
    const { args, warnings } = this.getArgs(options);

    const response = await this.client.agents.messages.createStream(
      args.agentId,
      {
        messages: args.messages,
        streamTokens: true,
        background: args.background,
      },
      {
        timeoutInSeconds: 1000,
      },
    );

    const readableStream = new ReadableStream<LanguageModelV2StreamPart>({
      async start(controller) {
        const toolCallBuffer = new Map<
          string,
          {
            toolName: string;
            toolCallId: string;
            accumulatedArguments: string;
          }
        >();

        try {
          // Start the stream with warnings (if any)
          controller.enqueue({
            type: "stream-start",
            warnings: [],
          });

          let currentTextId: string | null = null;
          let currentReasoningId: string | null = null;

          for await (const message of response) {
            if (
              message.messageType === "assistant_message" &&
              message.content
            ) {
              let textContent = "";

              if (typeof message.content === "string") {
                textContent = message.content;
              } else if (Array.isArray(message.content)) {
                textContent = message.content
                  .filter((part) => part && part.type === "text" && part.text)
                  .map((part) => part.text)
                  .join("");
              }

              if (textContent) {
                const messageId =
                  (message as MessageWithId).id || `msg-${Date.now()}`;

                // Start text block if new message
                if (currentTextId !== messageId) {
                  if (currentTextId) {
                    controller.enqueue({
                      type: "text-end",
                      id: currentTextId,
                    });
                  }

                  controller.enqueue({
                    type: "text-start",
                    id: messageId,
                  });
                  currentTextId = messageId;
                }

                // Send text delta
                controller.enqueue({
                  type: "text-delta",
                  id: messageId,
                  delta: textContent,
                });
              }
            }

            // Handle reasoning messages
            if (
              message.messageType === "reasoning_message" &&
              message.reasoning
            ) {
              let textContent = "";

              if (typeof message.reasoning === "string") {
                textContent = message.reasoning;
              }

              if (textContent) {
                const baseId =
                  (message as MessageWithId).id || Date.now().toString();
                const reasoningId = `reasoning-${baseId}`;

                // Start reasoning block if new message
                if (currentReasoningId !== reasoningId) {
                  if (currentReasoningId) {
                    controller.enqueue({
                      type: "reasoning-end",
                      id: currentReasoningId,
                    });
                  }

                  controller.enqueue({
                    type: "reasoning-start",
                    id: reasoningId,
                    providerMetadata: {
                      reasoning: { source: (message as any).source || "" },
                    },
                  });
                  currentReasoningId = reasoningId;
                }

                // Send reasoning delta
                controller.enqueue({
                  type: "reasoning-delta",
                  id: reasoningId,
                  delta: textContent,
                  providerMetadata: {
                    reasoning: { source: message.source || "" },
                  },
                });
              }
            }

            // Handle tool calls with accumulation since vercel does not accept streaming here
            if (
              message.messageType === "tool_call_message" &&
              message.toolCall
            ) {
              const toolCallId =
                message.toolCall.toolCallId || `call-${Date.now()}`;
              const toolName = message.toolCall.name || "unknown_tool";
              const argumentChunk = message.toolCall.arguments || "";

              if (!toolCallBuffer.has(toolCallId)) {
                // First chunk for this tool call
                toolCallBuffer.set(toolCallId, {
                  toolName,
                  toolCallId,
                  accumulatedArguments: argumentChunk,
                });
              } else {
                // Accumulate arguments
                const existing = toolCallBuffer.get(toolCallId)!;
                existing.accumulatedArguments += argumentChunk;
              }

              // Try to parse accumulated arguments as JSON
              const accumulated = toolCallBuffer.get(toolCallId)!;
              try {
                // Test if JSON is complete and valid
                JSON.parse(accumulated.accumulatedArguments);

                // JSON is valid - emit the complete tool call
                controller.enqueue({
                  type: "tool-call",
                  toolCallId: accumulated.toolCallId,
                  toolName: accumulated.toolName,
                  input: accumulated.accumulatedArguments,
                });

                // Remove from buffer since it's complete
                toolCallBuffer.delete(toolCallId);
              } catch {
                // JSON is still incomplete - continue accumulating
                // Don't emit anything yet
              }
            }
          }

          // End current text block if exists
          if (currentTextId) {
            controller.enqueue({
              type: "text-end",
              id: currentTextId,
            });
          }

          // End current reasoning block if exists
          if (currentReasoningId) {
            controller.enqueue({
              type: "reasoning-end",
              id: currentReasoningId,
            });
          }

          // Finish the stream
          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: {
              inputTokens: -1,
              outputTokens: -1,
              totalTokens: -1,
            },
          });
        } catch (error) {
          console.error("Stream processing error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return {
      stream: readableStream,
      warnings,
      request: {
        body: args,
      },
    };
  }
}
