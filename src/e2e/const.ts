import { CoreMessage } from "ai";
import { UIMessage } from "ai";
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

const testMessage: CoreMessage[] | Omit<UIMessage, "id">[] | undefined = [
  {
    role: "user",
    parts: [
      {
        type: "text",
        text: "Hello, who are you?",
      },
    ],
  },
];

const testMessageWithAssistant:
  | CoreMessage[]
  | Omit<UIMessage, "id">[]
  | undefined = [
  {
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "I am an AI assistant",
      },
    ],
  },
];

const testMessageWithSystemRole:
  | CoreMessage[]
  | Omit<UIMessage, "id">[]
  | undefined = [
  {
    role: "system",
    parts: [
      {
        type: "text",
        text: "You are a helpful assistant",
      },
    ],
  },
];

const testMessageWithToolRole:
  | CoreMessage[]
  | Omit<UIMessage, "id">[]
  | undefined = [
  {
    role: "assistant",
    parts: [
      {
        type: "tool-calculator" as any,
        toolCallId: "test-tool-call-id",
        state: "output-available",
        input: { expression: "2+2" },
        output: { result: 4 },
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
        toolName: "calculator",
        output: {
          type: "text",
          value: "4",
        },
      },
    ],
  },
];

const modelTestMessageWithNamedToolRole: ModelMessage[] = [
  {
    role: "assistant",
    content: [
      {
        type: "tool-calculator" as any,
        toolCallId: "test-tool-call-id",
        state: "output-available",
        input: { expression: "5*5" },
        output: { result: 25 },
      } as any,
    ],
  },
];

export {
  newAgentName,
  newAgentDescription,
  newAgentProjectId,
  newAgent,
  testMessage,
  testMessageWithAssistant,
  testMessageWithSystemRole,
  testMessageWithToolRole,
  // Model message versions
  modelTestMessage,
  modelTestMessageWithAssistantRole,
  modelTestMessageWithSystemRole,
  modelTestMessageWithToolRole,
  modelTestMessageWithNamedToolRole,
};
