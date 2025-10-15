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
            // Skip tool invocations and unsupported parts in user inputs
            if (typeof part.type === "string" && part.type.startsWith("tool-")) {
              return undefined as any;
            }
            throw new Error(`Content type ${part.type} not supported`);
        }
      }).filter(Boolean);

      return {
        role: "user" as const,
        content: content as any,
      };
    }

    if (message.role === "assistant") {
      throw new Error("Assistant role is not supported for user input");
    }

    if (message.role === "tool") {
      throw new Error("Tool role is not supported");
    }

    if (message.role === "system") {
      // Support both string and parts array for system content
      if (typeof message.content === "string") {
        return {
          role: "system" as const,
          content: message.content,
        };
      }
      const sysContent: any = message.content as any;
      const content = Array.isArray(sysContent)
        ? (sysContent as any[])
            .map((part: any) => {
              switch (part.type) {
                case "text":
                  return { type: "text" as const, text: part.text };
                default:
                  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
                    return undefined as any;
                  }
                  throw new Error(`Content type ${part.type} not supported`);
              }
            })
            .filter(Boolean)
        : sysContent;
      return {
        role: "system" as const,
        content: content as any,
      };
    }

    throw new Error(`Message role is not supported`);
  });
}
