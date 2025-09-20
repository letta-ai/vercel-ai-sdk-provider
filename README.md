# AI SDK - Letta Provider

![NPM Version](https://img.shields.io/npm/v/%40letta-ai%2Fvercel-ai-sdk-provider)

The official Vercel AI SDK provider for [Letta](https://www.letta.com) - the platform for building stateful AI agents with long-term memory. This provider enables you to use Letta agents seamlessly with the Vercel AI SDK ecosystem.

## What is Letta?

[Letta](https://docs.letta.com/overview) is an open-source platform for building stateful agents with advanced memory and infinite context length. Built with persistence and memory management, with full support for custom tools and MCP (Model Context Protocol). Letta agents can remember context across sessions, learn from interactions, and maintain consistent personalities over time. Letta agents maintain memories across sessions and continuously improve, even while they [sleep](https://docs.letta.com/guides/agents/architectures/sleeptime).

![Platform Overview](https://prod.ferndocs.com/_next/image?url=https%3A%2F%2Ffiles.buildwithfern.com%2Fhttps%3A%2F%2Fletta.docs.buildwithfern.com%2F2025-08-18T18%3A23%3A54.989Z%2Fimages%2Fplatform_overview.png&w=3840&q=75)

## Installation

```bash
npm install @letta-ai/vercel-ai-sdk-provider
```

## Quick Start

### 1. Environment Setup

Create a `.env` file in your project root:

```bash
# Required: Your Letta API key
LETTA_API_KEY=your-letta-api-key

# Optional: Override base URL (defaults to https://api.letta.com)
LETTA_BASE_URL=https://api.letta.com
```

**Get your API key:** Sign up at [Letta](https://app.letta.com/) and get your API key from the [dashboard](https://app.letta.com/api-keys).

**Note:** If using a `.env` file, you can source it in your shell (`source .env`) or use a package like `dotenv` to load it in your application.

Alternatively, export environment variables directly:

```bash
export LETTA_API_KEY=your-letta-api-key
export LETTA_BASE_URL=https://api.letta.com  # Optional
```

**Note:** If using exported variables, make sure they're available in your runtime environment. You may need to source your shell profile or restart your terminal.

### 2. Basic Usage

#### Non-Streaming Text Generation

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: lettaCloud(), // Model configuration (LLM, temperature, etc.) is managed through your Letta agent
  providerOptions: {
    agent: { id: 'your-agent-id' }
  },
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});

console.log(result.text);
```

#### Streaming Responses

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { streamText } from 'ai';

const result = streamText({
  model: lettaCloud(), // Model configuration (LLM, temperature, etc.) is managed through your Letta agent
  providerOptions: {
    agent: { id: 'your-agent-id' }
  },
  messages: [
    { role: 'user', content: 'Tell me a story about a robot learning to paint.' }
  ],
});

for await (const textPart of result.textStream) {
  console.log(textPart);
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LETTA_API_KEY` | Your Letta API key (required for Letta Cloud) | - |
| `LETTA_BASE_URL` | The base URL for Letta API | `https://api.letta.com` |

### Provider Setup

#### Letta Cloud (Recommended)

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';

// Uses LETTA_API_KEY and LETTA_BASE_URL from environment
const model = lettaCloud(); // Model configuration (LLM, temperature, etc.) is managed through your Letta agent
```

#### Local Letta Instance

For local development with Letta running on `http://localhost:8283`:

```bash
# .env
LETTA_BASE_URL=http://localhost:8283
```

Or export directly:

```bash
export LETTA_BASE_URL=http://localhost:8283
```

**Remember:** Exported variables need to be available when running your application.

```typescript
import { lettaLocal } from '@letta-ai/vercel-ai-sdk-provider';

const model = lettaLocal(); // Model configuration (LLM, temperature, etc.) is managed through your Letta agent
```

#### Custom Configuration

```typescript
import { createLetta } from '@letta-ai/vercel-ai-sdk-provider';

const letta = createLetta({
  baseUrl: 'https://your-custom-letta-endpoint.com',
  token: 'your-access-token'
});

const model = letta(); // Model configuration (LLM, temperature, etc.) is managed through your Letta agent
```

## Working with Letta Agents

### Creating a New Agent

```typescript
// https://docs.letta.com/api-reference/agents/create

import { LettaClient } from "@letta-ai/letta-client";

const client = new LettaClient({
  token: process.env.LETTA_API_KEY
  project: "your-project-id" // optional param
});

// Create a new agent
const agent = await client.agents.create({
  name: 'My Assistant',
  model: 'openai/gpt-4o-mini',
  embedding: 'openai/text-embedding-3-small'
});

console.log('Created agent:', agent.id);
```

### Using Existing Messages

```typescript
import { convertToAiSdkMessage } from '@letta-ai/vercel-ai-sdk-provider';
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText, convertToModelMessages } from 'ai';

// Load messages from Letta agent
const lettaMessages = await client.agents.getMessages(agentId);

// Convert to AI SDK format
const uiMessages = convertToAiSdkMessage(lettaMessages);
```

## React/Next.js Integration

### Streaming API Route

```typescript
// app/api/chat/route.ts - For real-time streaming with useChat
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { streamText, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
  const { messages, agentId } = await req.json();

  if (!agentId) {
    throw new Error('Agent ID is required');
  }

  const result = streamText({
    model: lettaCloud(),
    providerOptions: {
      agent: { id: agentId }
    },
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true, // Include AI reasoning in responses
  });
}
```



### Streaming Chat Component (with useChat)

```typescript
// app/Chat.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useState } from 'react';

interface ChatProps {
  agentId: string;
  existingMessages?: UIMessage[];
}

export function StreamingChat({ agentId, existingMessages = [] }: ChatProps) {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { agentId },
    }),
    messages: existingMessages,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div>
      {/* Messages */}
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong>
            {/* Handle message parts (for reasoning, tools, etc.) */}
            {message.parts?.map((part, index) => (
              <div key={index}>
                {part.type === 'text' && <div>{part.text}</div>}
                {part.type === 'reasoning' && (
                  <div style={{ color: 'blue', fontSize: '0.9em' }}>
                    💭 {part.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        if (input.trim()) {
          sendMessage({ text: input });
          setInput('');
        }
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

```typescript
// app/page.tsx - Streaming chat page
import { LettaClient } from '@letta-ai/letta-client';
import { convertToAiSdkMessage } from '@letta-ai/vercel-ai-sdk-provider';
import { StreamingChat } from './StreamingChat';

export default async function HomePage() {
  const agentId = process.env.LETTA_AGENT_ID;

  if (!agentId) {
    throw new Error('LETTA_AGENT_ID environment variable is required');
  }

  // Load existing messages
  const client = new LettaClient({
    token: process.env.LETTA_API_KEY
  });

  const lettaMessages = await client.agents.getMessages(agentId);
  const existingMessages = convertToAiSdkMessage(lettaMessages);

  return (
    <div>
      <h1>Streaming Chat with Letta Agent</h1>
      <StreamingChat
        agentId={agentId}
        existingMessages={existingMessages}
      />
    </div>
  );
}
```



## Advanced Features

### Reasoning Support

Both `streamText` and `generateText` support AI reasoning tokens:

#### Streaming with Reasoning

```typescript
const result = streamText({
  model: lettaCloud(),
  providerOptions: { agent: { id: agentId } },
  messages: convertToModelMessages(messages),
});

// Include reasoning in UI message stream
return result.toUIMessageStreamResponse({
  sendReasoning: true,
});
```

#### Non-Streaming with Reasoning

```typescript
const result = await generateText({
  model: lettaCloud(),
  providerOptions: { agent: { id: agentId } },
  messages: convertToModelMessages(messages),
});

// generateText inherently includes `reasoning`
// https://ai-sdk.dev/docs/ai-sdk-core/generating-text
const reasoningParts = result.content.filter(part => part.type === 'reasoning');
reasoningParts.forEach(reasoning => {
  console.log('AI thinking:', reasoning.text);
});
```

#### Distinguishing Agent vs Model Reasoning

Letta provides two types of reasoning that you can distinguish in your UI:

```typescript
// Type guard for reasoning parts
const isReasoningPart = (part: { type: string; [key: string]: unknown }) =>
  part.type === "reasoning" && "text" in part && typeof part.text === "string";

// Helper to determine reasoning source
const getReasoningSource = (part: {
  type: string;
  text: string;
  source?: string;
  providerMetadata?: { reasoning?: { source?: string } };
}) => {
  const source = part.providerMetadata?.reasoning?.source || part.source;

  if (source === "reasoner_model") {
    return {
      source: "model" as const,
      text: part.text,
    };
  }

  if (source === "non_reasoner_model") {
    return {
      source: "agent" as const,
      text: part.text,
    };
  }

  // Default to model reasoning if source is unclear
  return {
    source: "model" as const,
    text: part.text,
  };
};

// Usage in your UI components
message.parts?.forEach((part) => {
  if (isReasoningPart(part)) {
    const { source, text } = getReasoningSource(part);

    if (source === "model") {
      console.log("🧠 Model Reasoning (from language model):", text);
    } else if (source === "agent") {
      console.log("🤖 Agent Reasoning (from Letta platform):", text);
    }
  }
});
```

**Reasoning Types:**
- **Model Reasoning** (`reasoner_model`): Internal thinking from the language model itself
- **Agent Reasoning** (`non_reasoner_model`): The internal reasoning of the agent signature




### Message Conversion

Convert between Letta message formats and AI SDK formats:

```typescript
import { convertToAiSdkMessage } from '@letta-ai/vercel-ai-sdk-provider';

// Convert Letta messages to AI SDK UIMessage format (for UI components)
const uiMessages = convertToAiSdkMessage(lettaMessages, {
  allowMessageTypes: [
    'user_message',
    'assistant_message',
    'system_message',
    'reasoning_message'
  ]
});

// Convert to ModelMessages for generateText/streamText
const modelMessages = convertToModelMessages(uiMessages);
```

### Working with Tools

Letta agents support custom tools and MCP (Model Context Protocol). Unlike traditional AI SDK usage, tools are configured at the agent level in Letta, not passed to the AI SDK calls.

#### Tool Configuration

Tools are configured through your agent on Letta via API or UI.

#### Using Tools with AI SDK

Once tools are configured on your agent, they work seamlessly with both streaming and non-streaming. Tool calls are handled automatically by Letta, so you don't need to define or execute tool functions in your AI SDK code.

However, the Vercel AI SDK requires tool definitions in the configuration to prevent errors. You must provide placeholder tool configurations:

```typescript
import { z } from 'zod';

// Use with streaming
const streamResult = streamText({
  model: lettaCloud(),
  tools: {
    web_search: {
      description: "Search the web",
      inputSchema: z.any(),
      execute: async () => "Handled by Letta",
    },
    memory_replace: {
      description: "Replace memory content", 
      inputSchema: z.any(),
      execute: async () => "Handled by Letta",
    },
  },
  providerOptions: {
    agent: { id: agentId },
  },
  messages: messages,
});

// Use with non-streaming
const generateResult = await generateText({
  model: lettaCloud(),
  tools: {
    web_search: {
      description: "Search the web",
      inputSchema: z.any(),
      execute: async () => "Handled by Letta",
    },
    memory_replace: {
      description: "Replace memory content", 
      inputSchema: z.any(),
      execute: async () => "Handled by Letta",
    },
  },
  providerOptions: {
    agent: { id: agentId },
  },
  messages: messages,
});
```

**Note**: The actual tool execution happens in Letta - these configurations are placeholders required by the AI SDK to prevent runtime errors.

#### Accessing Tool Calls

Tool calls appear in message parts and can be filtered by type:

```typescript
// Type guard for named tool parts
const isNamedTool = (part: { type: string; [key: string]: unknown }): boolean =>
  part.type.startsWith("tool-") && part.type !== "tool-invocation";

// Filter tool parts from message parts
const toolParts = message.parts?.filter(isNamedTool) || [];

toolParts.forEach(part => {
  console.log('Tool Type:', part.type); // e.g., "tool-call", "tool-result"
  console.log('State:', part.state);
  console.log('Call ID:', part.toolCallId);
  console.log('Input:', part.input);
  console.log('Output:', part.output);

  // Handle errors if present
  if (part.errorText) {
    console.error('Tool Error:', part.errorText);
  }
});
```

#### MCP Integration

Letta supports Model Context Protocol (MCP) for advanced tool integration:

```typescript
// MCP tools are configured in Letta and work automatically
const result = streamText({
  model: lettaCloud(),
  providerOptions: {
    agent: { id: agentId } // Tools are configured in your Letta agent
  },
  messages: convertToModelMessages(messages),
});

// MCP tool calls appear in the stream just like regular tools
for await (const part of result.textStream) {
  if (part.type === 'tool-call') {
    console.log('MCP tool called:', part.toolName);
  }
}
```

## Usage Patterns

### Using Provider Options (Recommended)

Both streaming and non-streaming approaches use the same provider pattern:

```typescript
// Non-streaming
const result = await generateText({
  model: lettaCloud(),
  messages: [{ role: 'user', content: 'Hello!' }],
  providerOptions: { agent: { id: 'your-agent-id' } },
});

// Streaming
const stream = streamText({
  model: lettaCloud(),
  messages: [{ role: 'user', content: 'Hello!' }],
  providerOptions: { agent: { id: 'your-agent-id' } },
});
```

### Long-Running Executions

For streaming operations that may take longer to complete, you can use the `background` option:

```typescript
// Streaming with background execution
const stream = streamText({
  model: lettaCloud(),
  messages: [{ role: 'user', content: 'Process this complex task...' }],
  providerOptions: { 
    agent: { id: 'your-agent-id' },
    background: true 
  },
});
```

**Note**: Background executions are useful for complex streaming tasks that may exceed typical request timeouts. See [Letta's long-running guide](https://docs.letta.com/guides/agents/long-running) for more details.

### When to Use Each Approach

**Use `generateText` (non-streaming) when:**
- You need complete response before proceeding
- Building batch processing or automation
- You want to analyze the full response (tokens, reasoning, tools)
- Using custom fetch or server-side processing

**Use `streamText` (streaming) when:**
- Building real-time chat interfaces
- You want immediate user feedback
- Using `useChat` or similar AI SDK UI hooks
- Building interactive conversational experiences

```

## API Reference

### Provider Functions

- `lettaCloud()` - Pre-configured provider for Letta Cloud
- `lettaLocal()` - Pre-configured provider for local Letta instance
- `createLetta(options)` - Create a custom provider instance

### Utility Functions

- `convertToAiSdkMessage(messages, options?)` - Convert Letta messages to AI SDK format

### Configuration Options

```typescript
interface LettaProviderOptions {
  baseUrl?: string;     // Custom Letta instance URL
  token?: string;       // API token/key
  project?: string;     // Your project slug
}

interface ProviderOptions {
  agent: {
    id: string;         // Agent ID (required via providerOptions)
  };
}
```



## Troubleshooting

### Common Issues

**Agent not found error:**
```typescript
// List available agents
import { LettaClient } from '@letta-ai/letta-client';

const client = new LettaClient({ token: process.env.LETTA_API_KEY });
const agents = await client.agents.list();
console.log('Available agents:', agents.map(a => ({ id: a.id, name: a.name })));
```

**Authentication errors:**
- Verify `LETTA_API_KEY` is set correctly in your environment
- Check that your API key has necessary permissions
- Ensure the agent exists and is accessible with your API key

**Type compatibility issues:**
- Make sure you're using the latest version of the provider
- Use `convertToAiSdkMessage` when loading existing messages from Letta
- Import `UIMessage` from `'ai'` package, not `'@ai-sdk/ui-utils'`

**Local development:**
```bash
# Set environment for local development
LETTA_BASE_URL=http://localhost:8283
```


## Requirements

- Node.js 18+
- Vercel AI SDK 5.0+
- A Letta account (for cloud) or local Letta instance

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- [Letta Documentation](https://docs.letta.com)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai)
- [GitHub Issues](https://github.com/letta-ai/vercel-ai-sdk-provider/issues)
- [Letta Community Discord](https://discord.gg/letta)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
