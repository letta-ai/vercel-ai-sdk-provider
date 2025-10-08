import { LettaMessageUnion } from "@letta-ai/letta-client/api";
import { UIMessage, TextUIPart, ToolUIPart, ReasoningUIPart } from "ai";

interface ConvertToAiSdkMessageOptions {
  allowMessageTypes?: LettaMessageUnion["messageType"][];
}

const baseOptions: ConvertToAiSdkMessageOptions = {
  allowMessageTypes: [
    "user_message",
    "assistant_message",
    "system_message",
    "tool_call_message",
    "tool_return_message",
    "reasoning_message",
  ],
};

export function convertToAiSdkMessage(
  messages: LettaMessageUnion[],
  options: ConvertToAiSdkMessageOptions = baseOptions,
): UIMessage[] {
  const sdkMessageObj: Record<string, UIMessage> = {};

  const allowMessageTypeSet = new Set(options.allowMessageTypes || []);

  messages.forEach((message) => {
    if (!allowMessageTypeSet.has(message.messageType)) {
      return;
    }

    if (!sdkMessageObj[message.id]) {
      sdkMessageObj[message.id] = {
        role: "assistant",
        id: message.id,
        parts: [],
      };
    }

    if (message.messageType === "system_message") {
      sdkMessageObj[message.id].role = "system";
      const textPart: TextUIPart = {
        type: "text",
        text: message.content,
      };

      if (!sdkMessageObj[message.id].parts) {
        sdkMessageObj[message.id].parts = [];
      }

      sdkMessageObj[message.id].parts.push(textPart);
    }

    if (message.messageType === "user_message") {
      sdkMessageObj[message.id].role = "user";
      let text = message.content;

      if (Array.isArray(text)) {
        text = text
          .map((val) => {
            switch (val.type) {
              case "text":
                return val.text;
              default:
                throw new Error(`File type ${val.type} not supported`);
            }
          })
          .join("");
      }

      const textPart: TextUIPart = {
        type: "text",
        text,
      };

      if (!sdkMessageObj[message.id].parts) {
        sdkMessageObj[message.id].parts = [];
      }

      sdkMessageObj[message.id].parts.push(textPart);
    }

    if (message.messageType === "assistant_message") {
      sdkMessageObj[message.id].role = "assistant";
      let text = message.content;

      if (Array.isArray(text)) {
        text = text
          .map((val) => {
            switch (val.type) {
              case "text":
                return val.text;
              default:
                throw new Error(`File type ${val.type} not supported`);
            }
          })
          .join("");
      }

      const textPart: TextUIPart = {
        type: "text",
        text,
      };

      if (!sdkMessageObj[message.id].parts) {
        sdkMessageObj[message.id].parts = [];
      }

      sdkMessageObj[message.id].parts.push(textPart);
    }

    if (message.messageType === "reasoning_message") {
      if (!sdkMessageObj[message.id].parts) {
        sdkMessageObj[message.id].parts = [];
      }

      sdkMessageObj[message.id].role = "assistant";

      const reasoningPart: ReasoningUIPart = {
        type: "reasoning",
        text: message.reasoning,
        providerMetadata: {
          letta: {
            id: message.id,
            date: message.date.toISOString(),
            name: message.name ?? null,
            messageType: message.messageType,
            otid: message.otid ?? null,
            senderId: message.senderId ?? null,
            stepId: message.stepId ?? null,
            isErr: message.isErr ?? null,
            seqId: message.seqId ?? null,
            runId: message.runId ?? null,
            reasoning: message.reasoning,
            source: message.source ?? null,
          },
        },
      };

      sdkMessageObj[message.id].parts.push(reasoningPart);
    }

    if (message.messageType === "tool_call_message") {
      if (!sdkMessageObj[message.id].parts) {
        sdkMessageObj[message.id].parts = [];
      }

      sdkMessageObj[message.id].role = "assistant";

      // Use AI SDK's ToolUIPart structure
      const toolInvocation: ToolUIPart = {
        type: "tool-invocation" as const,
        toolCallId: message.toolCall?.toolCallId || "",
        state: "output-available" as const,
        input: message.toolCall?.arguments || {},
        output: "",
      };

      sdkMessageObj[message.id].parts.push(toolInvocation);
    }

    // Handle tool return messages with full Letta metadata
    if (message.messageType === "tool_return_message") {
      if (!sdkMessageObj[message.id].parts) {
        sdkMessageObj[message.id].parts = [];
      }

      sdkMessageObj[message.id].role = "assistant";

      const toolInvocation: ToolUIPart = {
        type: "tool-invocation" as const,
        toolCallId: message.toolCallId || "",
        state: "output-available" as const,
        input: {},
        output: message.toolReturn,
        callProviderMetadata: {
          letta: {
            id: message.id,
            date: message.date.toISOString(),
            name: message.name ?? null,
            messageType: message.messageType,
            otid: message.otid ?? null,
            senderId: message.senderId ?? null,
            stepId: message.stepId ?? null,
            isErr: message.isErr ?? null,
            seqId: message.seqId ?? null,
            runId: message.runId ?? null,
            toolReturn: message.toolReturn,
            status: message.status,
            toolCallId: message.toolCallId,
            stdout: message.stdout ?? null,
            stderr: message.stderr ?? null,
          },
        },
      };

      sdkMessageObj[message.id].parts.push(toolInvocation);
    }
  });

  return Object.values(sdkMessageObj);
}
