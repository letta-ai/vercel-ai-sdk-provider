import { describe, it, expect } from "vitest";
import { convertToAiSdkMessage } from "./convert-to-ai-sdk-message";
import { LettaMessageUnion } from "@letta-ai/letta-client/api";
import { UIMessage } from "ai";

// Extended types to match what the conversion function actually produces
interface ExtendedReasoningUIPart {
  type: "reasoning";
  text: string;
  source?: string;
}

interface ExtendedToolUIPart {
  type: "tool-invocation";
  toolCallId: string;
  state: "output-available";
  input: string | number | boolean | object | null;
  output: string;
}

interface ExtendedUIMessage extends Omit<UIMessage, "parts"> {
  parts: (
    | { type: "text"; text: string }
    | ExtendedReasoningUIPart
    | ExtendedToolUIPart
  )[];
}

describe("convertToAiSdkMessage", () => {
  it("should convert user messages correctly", () => {
    const messages: LettaMessageUnion[] = [
      {
        id: "1",
        messageType: "user_message",
        content: [{ type: "text", text: "Hello" }],
        date: new Date("2023-10-01T10:00:00Z"),
      },
    ];

    const expected: ExtendedUIMessage[] = [
      {
        role: "user",
        id: "1",
        parts: [
          {
            type: "text",
            text: "Hello",
          },
        ],
      },
    ];

    expect(convertToAiSdkMessage(messages)).toEqual(expected);
  });

  it("should convert assistant messages correctly", () => {
    const messages: LettaMessageUnion[] = [
      {
        id: "2",
        messageType: "assistant_message",
        content: [{ type: "text", text: "Hi there!" }],
        date: new Date("2023-10-01T10:05:00Z"),
      },
    ];

    const expected: ExtendedUIMessage[] = [
      {
        role: "assistant",
        id: "2",
        parts: [
          {
            type: "text",
            text: "Hi there!",
          },
        ],
      },
    ];

    expect(convertToAiSdkMessage(messages)).toEqual(expected);
  });

  it("should convert reasoning messages correctly", () => {
    const messages: LettaMessageUnion[] = [
      {
        id: "4",
        messageType: "reasoning_message",
        reasoning: "Let me think about this...",
        source: "reasoner_model",
        date: new Date("2023-10-01T10:10:00Z"),
      },
    ];

    const expected: ExtendedUIMessage[] = [
      {
        role: "assistant",
        id: "4",
        parts: [
          {
            type: "reasoning",
            text: "Let me think about this...",
            source: "reasoner_model",
          } as ExtendedReasoningUIPart,
        ],
      },
    ];

    expect(convertToAiSdkMessage(messages)).toEqual(expected);
  });

  it("should convert tool call messages correctly", () => {
    const messages: LettaMessageUnion[] = [
      {
        id: "4",
        messageType: "tool_call_message",
        toolCall: {
          toolCallId: "tool-1",
          name: "ToolName",
          arguments: "arg1",
        },
        date: new Date("2023-10-01T10:15:00Z"),
      },
    ];

    const expected: ExtendedUIMessage[] = [
      {
        role: "assistant",
        id: "4",
        parts: [
          {
            type: "tool-invocation",
            toolCallId: "tool-1",
            state: "output-available",
            input: "arg1",
            output: "",
          },
        ],
      },
    ];

    expect(convertToAiSdkMessage(messages)).toEqual(expected);
  });

  it("should convert tool return messages correctly", () => {
    const messages: LettaMessageUnion[] = [
      {
        id: "5",
        messageType: "tool_call_message",
        toolCall: {
          toolCallId: "tool-1",
          name: "ToolName",
          arguments: "{}",
        },
        date: new Date("2023-10-01T10:20:00Z"),
      },
    ];

    const expected: ExtendedUIMessage[] = [
      {
        role: "assistant",
        id: "5",
        parts: [
          {
            type: "tool-invocation",
            toolCallId: "tool-1",
            state: "output-available",
            input: "{}",
            output: "",
          } as ExtendedToolUIPart,
        ],
      },
    ];

    expect(convertToAiSdkMessage(messages)).toEqual(expected);
  });

  it("should handle messages with the same id having both reasoning and message", () => {
    const messages: LettaMessageUnion[] = [
      {
        id: "6",
        messageType: "reasoning_message",
        reasoning: "This is a reasoning message",
        source: "non_reasoner_model",
        date: new Date("2023-10-01T10:25:00Z"),
      },
      {
        id: "6",
        messageType: "user_message",
        content: [{ type: "text", text: "Hello" }],
        date: new Date("2023-10-01T10:25:00Z"),
      },
    ];

    const expected: ExtendedUIMessage[] = [
      {
        role: "user",
        id: "6",
        parts: [
          {
            type: "reasoning",
            text: "This is a reasoning message",
            source: "non_reasoner_model",
          } as ExtendedReasoningUIPart,
          {
            type: "text",
            text: "Hello",
          },
        ],
      },
    ];

    expect(convertToAiSdkMessage(messages)).toEqual(expected);
  });
});
