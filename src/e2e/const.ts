import { CoreMessage } from "ai";
import { Message } from "@ai-sdk/ui-utils";
import { ModelMessage } from "ai";

const newAgentName = "e2e-test-agent-vercel-ai-sdk";
const newAgentDescription =
  "This is a test agent for e2e testing with vercel ai sdk";
const newAgentProjectId = "93e18d21-28e1-4694-82a5-7f7ea1002afe";

const newAgent = {
  name: newAgentName,
  description: newAgentDescription,
  model: "openai/gpt-4o-mini",
  projectId: newAgentProjectId,
  embedding: "openai/text-embedding-3-small",
};

const testMessage: CoreMessage[] | Omit<Message, "id">[] | undefined = [
  {
    role: "user",
    content: "Hello, who are you?",
  },
];

const testMessageWithAssistantRole:
  | CoreMessage[]
  | Omit<Message, "id">[]
  | undefined = [
  {
    role: "assistant",
    content: "Hello, who are you?",
  },
];

const testMessageWithSystemRole:
  | CoreMessage[]
  | Omit<Message, "id">[]
  | undefined = [
  {
    role: "system",
    content: "Hello, who are you?",
  },
];

const testMessageWithToolRole:
  | CoreMessage[]
  | Omit<Message, "id">[]
  | undefined = [
  {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: "test-tool-call-id",
        toolName: "test-tool",
        result: "Tool result",
      },
    ],
  },
];

// Model message versions for AI SDK 5
const modelTestMessage: ModelMessage[] = [
  {
    role: "user",
    content: [{ type: "text", text: "Hello, who are you?" }],
  },
];

const modelTestMessageWithAssistantRole: ModelMessage[] = [
  {
    role: "assistant",
    content: [{ type: "text", text: "Hello, who are you?" }],
  },
];

const modelTestMessageWithSystemRole: ModelMessage[] = [
  {
    role: "system",
    content: "Hello, who are you?",
  },
];

const modelTestMessageWithToolRole: ModelMessage[] = [
  {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: "test-tool-call-id",
        toolName: "test-tool",
        output: {
          type: "text",
          value: "Tool result",
        },
      },
    ],
  },
];

export {
  newAgentName,
  newAgentDescription,
  newAgentProjectId,
  newAgent,
  testMessage,
  testMessageWithAssistantRole,
  testMessageWithSystemRole,
  testMessageWithToolRole,
  // Model message versions
  modelTestMessage,
  modelTestMessageWithAssistantRole,
  modelTestMessageWithSystemRole,
  modelTestMessageWithToolRole,
};
