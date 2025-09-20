import { LanguageModelV2Prompt } from "@ai-sdk/provider";
import { MessageCreate } from "@letta-ai/letta-client/api";

export function convertToLettaMessage(
  prompt: LanguageModelV2Prompt,
): MessageCreate[] {
  return prompt.map((message) => {
    if (message.role === "user") {
      const content = message.content.map((part) => {
        switch (part.type) {
          case "text":
            return {
              type: "text" as const,
              text: part.text,
            };
          default:
            throw new Error(`Content type ${part.type} not supported`);
        }
      });

      return {
        role: "user" as const,
        content: content,
      };
    }

    if (message.role === "assistant") {
      throw new Error("Assistant role is not supported for user input");
    }

    if (message.role === "tool") {
      throw new Error("Tool role is not supported");
    }

    if (message.role === "system") {
      return {
        role: "system" as const,
        content: message.content,
      };
    }

    throw new Error(`Message role is not supported`);
  });
}
