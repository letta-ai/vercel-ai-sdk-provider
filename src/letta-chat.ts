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

export class LettaChatModel implements LanguageModelV2 {
  readonly specificationVersion = "v2" as const;
  readonly provider = "letta";
  readonly modelId: string;
  readonly supportedUrls = {};

  private readonly client: LettaClient;
  readonly agentId?: string;

  constructor(modelId: string, client: LettaClient, agentId?: string) {
    this.modelId = modelId;
    this.client = client;
    this.agentId = agentId;
  }

  private getArgs(options: LanguageModelV2CallOptions) {
    const warnings: LanguageModelV2CallWarning[] = [];

    // Use agentId from constructor if provided, otherwise extract from providerOptions
    let agentId = this.agentId;

    if (!agentId) {
      const providerOptions = (options as any).providerOptions;
      agentId = providerOptions?.agent?.id;
    }

    if (!agentId) {
      throw new Error(
        "Letta provider requires an agentId. Usage: lettaCloud('letta-model', { agent: { id: 'your-agent-id' } }) or generateText({ model: lettaCloud('letta-model'), providerOptions: { agent: { id: 'your-agent-id' } }, ... })",
      );
    }

    const baseArgs = {
      agentId,
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
        messages: args.messages, // getArgs now provides only the last message
        streamTokens: true,
      },
      {
        timeoutInSeconds: 1000,
      },
    );

    const readableStream = new ReadableStream<LanguageModelV2StreamPart>({
      async start(controller) {
        try {
          let lastToolName = "";
          let lastToolCallId = "";

          for await (const message of response) {
            if (message.messageType === "assistant_message") {
              let textDelta = "";
              if (typeof message.content === "string") {
                textDelta = message.content;
              } else {
                message.content.forEach((v) => {
                  if (v.type === "text") {
                    textDelta += v.text;
                  }
                });
              }

              if (textDelta) {
                controller.enqueue({
                  type: "text-delta",
                  id: message.id,
                  delta: textDelta,
                });
              }
            }

            if (message.messageType === "tool_call_message") {
              if (message.toolCall?.name) {
                lastToolName = message.toolCall.name;
              }

              if (message.toolCall?.toolCallId) {
                lastToolCallId = message.toolCall.toolCallId;
              }

              controller.enqueue({
                type: "tool-call",
                toolCallId: lastToolCallId,
                toolName: lastToolName,
                input: message.toolCall?.arguments || "",
              });
            }

            if (message.messageType === "reasoning_message") {
              controller.enqueue({
                type: "reasoning-delta",
                id: message.id,
                delta: message.reasoning,
              });
            }
          }

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
