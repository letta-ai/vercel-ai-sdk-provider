import { LettaMessageUnion } from "@letta-ai/letta-client/api";
import { UIMessage, TextUIPart, ToolUIPart, ReasoningUIPart, FileUIPart } from "ai";

type DynamicToolType = `tool-${string}`;

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

function transformMessageContent(content: string | any[]): (TextUIPart | FileUIPart)[] {
  if (Array.isArray(content)) {
    const parts: (TextUIPart | FileUIPart)[] = [];
    for (const val of content) {
      const partType = (val as any).type as string;
      if (partType === "text") {
        parts.push({ type: "text", text: (val as any).text });
      } else if (partType === "image_url") {
        const url = (val as any).imageUrl?.url ?? (val as any).imageUrl;
        if (typeof url === "string") {
          parts.push({ type: "file", url, mediaType: "image/*" });
        }
      } else if (partType === "input_audio") {
        const audio = (val as any).inputAudio;
        const url = audio?.url ?? undefined;
        if (typeof url === "string") {
          parts.push({ type: "file", url, mediaType: "audio/*" });
        }
      } else {
        throw new Error(`Content type ${String(partType)} not supported`);
      }
    }
    return parts;
  }
  // string content
  return [{ type: "text", text: content as string }];
}

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
      const parts = transformMessageContent(message.content as any);
      if (!sdkMessageObj[message.id].parts) {
        sdkMessageObj[message.id].parts = [];
      }
      sdkMessageObj[message.id].parts.push(...parts);
    }

    if (message.messageType === "assistant_message") {
      sdkMessageObj[message.id].role = "assistant";
      const parts = transformMessageContent(message.content as any);
      if (!sdkMessageObj[message.id].parts) {
        sdkMessageObj[message.id].parts = [];
      }
      sdkMessageObj[message.id].parts.push(...parts);
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
      const toolName = message.toolCall?.name || "";
      const toolInvocation: ToolUIPart = {
        // v5: typed tool name in part type
        type: (`tool-${toolName}` as DynamicToolType) as any,
        toolCallId: message.toolCall?.toolCallId || "",
        state: "output-available" as const,
        input: message.toolCall?.arguments || {},
        output: "",
      } as any;

      sdkMessageObj[message.id].parts.push(toolInvocation);
    }

    // Handle tool return messages with full Letta metadata
    if (message.messageType === "tool_return_message") {
      if (!sdkMessageObj[message.id].parts) {
        sdkMessageObj[message.id].parts = [];
      }

      sdkMessageObj[message.id].role = "assistant";

      const toolName = message.name || "";
      const state = message.status === "error" ? ("output-error" as const) : ("output-available" as const);
      const toolInvocation: ToolUIPart = {
        type: (`tool-${toolName}` as DynamicToolType) as any,
        toolCallId: message.toolCallId || "",
        state,
        input: {},
        output: message.toolReturn,
        errorText: message.status === "error" ? (typeof message.toolReturn === "string" ? message.toolReturn : JSON.stringify(message.toolReturn)) : undefined,
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
      } as any;

      sdkMessageObj[message.id].parts.push(toolInvocation);
    }
  });

  return Object.values(sdkMessageObj);
}
