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

      const reasoningPart: ReasoningUIPart & { source?: string } = {
        type: "reasoning",
        text: message.reasoning,
        source: message.source, // Include the source field from Letta
      };

      sdkMessageObj[message.id].parts.push(reasoningPart);
    }

    // Letta handles the tool call message, so the tool *return* message is not used
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
  });

  return Object.values(sdkMessageObj);
}
