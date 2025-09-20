import { describe, it, expect } from "vitest";
import { convertToLettaMessage } from "./convert-to-letta-message";
import { LanguageModelV2Prompt } from "@ai-sdk/provider";
import { MessageCreate } from "@letta-ai/letta-client/api";

describe("convertToLettaMessage", () => {
  it("should convert user messages correctly", () => {
    const prompt: LanguageModelV2Prompt = [
      {
        role: "user",
        content: [
          { type: "text", text: "Hello" },
          { type: "text", text: "World" },
        ],
      },
    ];

    const expected: MessageCreate[] = [
      {
        role: "user",
        content: [
          { type: "text", text: "Hello" },
          { type: "text", text: "World" },
        ],
      },
    ];

    expect(convertToLettaMessage(prompt)).toEqual(expected);
  });

  it("should throw an error for unsupported file types", () => {
    const prompt: LanguageModelV2Prompt = [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: new Uint8Array([1, 2, 3]),
            mediaType: "image/png",
          },
        ],
      },
    ];

    expect(() => convertToLettaMessage(prompt)).toThrow(
      "Content type file not supported",
    );
  });

  it("should throw an error for assistant role in user input", () => {
    const prompt: LanguageModelV2Prompt = [
      {
        role: "assistant",
        content: [{ type: "text", text: "Hello from assistant" }],
      },
    ];

    expect(() => convertToLettaMessage(prompt)).toThrow(
      "Assistant role is not supported for user input",
    );
  });

  it("should throw an error for tool role", () => {
    const prompt: LanguageModelV2Prompt = [
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "test-id",
            toolName: "test-tool",
            output: {
              type: "text",
              value: "Hello",
            },
          },
        ],
      },
    ];

    expect(() => convertToLettaMessage(prompt)).toThrow(
      "Tool role is not supported",
    );
  });

  it("should handle system role correctly", () => {
    const prompt: LanguageModelV2Prompt = [
      {
        role: "system",
        content: "System message",
      },
    ];

    const expected: MessageCreate[] = [
      { role: "system", content: "System message" },
    ];

    expect(convertToLettaMessage(prompt)).toEqual(expected);
  });

  it("should handle multiple user messages", () => {
    const prompt: LanguageModelV2Prompt = [
      {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      },
      {
        role: "user",
        content: [
          { type: "text", text: "How" },
          { type: "text", text: "are you?" },
        ],
      },
    ];

    const expected: MessageCreate[] = [
      {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      },
      {
        role: "user",
        content: [
          { type: "text", text: "How" },
          { type: "text", text: "are you?" },
        ],
      },
    ];

    expect(convertToLettaMessage(prompt)).toEqual(expected);
  });
});
