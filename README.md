# AI SDK - Letta Provider

![NPM Version](https://img.shields.io/npm/v/%40letta-ai%2Fvercel-ai-sdk-provider)

This is the Vercel AI SDK provider for [Letta](https://www.letta.com) - the platform for building stateful AI agents with long-term memory. This will enable you to use Letta agents seamlessly with the Vercel AI SDK ecosystem.

## What is Letta?

[Letta](https://docs.letta.com/overview) is an open-source platform for building stateful agents with advanced memory and infinite context, using any model. Built-in persistence and memory management, with full support for custom tools and MCP (Model Context Protocol). Letta agents can remember context across sessions, learn from interactions, and maintain consistent personalities over time. Letta agents maintain memories across sessions and continuously improve, even while they [sleep](https://docs.letta.com/guides/agents/architectures/sleeptime).

![Platform Overview](https://prod.ferndocs.com/_next/image?url=https%3A%2F%2Ffiles.buildwithfern.com%2Fhttps%3A%2F%2Fletta.docs.buildwithfern.com%2F2025-08-18T18%3A23%3A54.989Z%2Fimages%2Fplatform_overview.png&w=3840&q=75)

## Example

Check out our comprehensive Next.js example that demonstrates:
- Real-time streaming conversations
- Agent memory persistence
- Message history management
- Error handling

Located at: [Letta Chatbot Template](https://github.com/letta-ai/letta-chatbot-example)

## Installation

```bash
npm install @letta-ai/vercel-ai-sdk-provider
```

## Quick Start

### 1. Letta Cloud Setup

Create a `.env` file and add your [API Key](https://app.letta.com/api-keys):

```env
LETTA_API_KEY=your_letta_cloud_apikey
LETTA_BASE_URL=https://api.letta.com
```

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: lettaCloud('your-agent-id'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});

console.log(text);
```

### 2. Local Letta Instance

For local development with Letta running on `http://localhost:8283`:

```env
LETTA_BASE_URL=http://localhost:8283
```

```typescript
import { lettaLocal } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: lettaLocal('your-agent-id'),
  prompt: 'What did we discuss yesterday about the project?',
});
```

### 3. Custom Configuration

For custom endpoints or configurations:

```typescript
import { createLetta } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText } from 'ai';

const letta = createLetta({
  baseUrl: 'https://your-custom-letta-endpoint.com',
  token: 'your-access-token'
});

const { text } = await generateText({
  model: letta('your-agent-id'),
  prompt: 'Continue our conversation from last week.',
});
```

## Advanced Usage

### Streaming Responses

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { streamText } from 'ai';

const { textStream } = await streamText({
  model: lettaCloud('your-agent-id'),
  messages: [
    { role: 'user', content: 'Tell me a story about a robot learning to paint.' }
  ],
});

for await (const textPart of textStream) {
  console.log(textPart);
}
```

## Working with Letta Agents

### Creating a New Agent

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';

// Create a new agent using the Letta client
const agent = await lettaCloud.client.templates.agents.create(
  'your-project-id',
  'your-template-name'
);

console.log('Created agent:', agent.agents[0].id);

// Now use the agent with AI SDK
const { text } = await generateText({
  model: lettaCloud(agent.agents[0].id),
  prompt: 'Hello! I\'m excited to work with you.',
});

console.log(text)
```

## React/Next.js Integration

### Basic Chat Component

```typescript
'use client';

import { useChat } from 'ai/react';
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';

export default function ChatComponent({ agentId }: { agentId: string }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    initialMessages: [],
  });

  return (
    <div>
      <div>
        {messages.map(message => (
          <div key={message.id}>
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Say something..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### API Route (Next.js)

```typescript
// app/api/chat/route.ts
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, agentId } = await req.json();

  const result = await streamText({
    model: lettaCloud(agentId),
    messages,
  });

  return result.toDataStreamResponse();
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LETTA_API_KEY` | Your Letta API key (required for Letta Cloud) | - |
| `LETTA_BASE_URL` | The base URL for Letta API | `https://api.letta.com` or `http://localhost:8283` |
| `LETTA_DEFAULT_PROJECT_SLUG` | Default project slug for agent creation | `default-project` |
| `LETTA_DEFAULT_TEMPLATE_NAME` | Default template name for agent creation | - |

## Configuration Options

### Provider Options

```typescript
interface LettaClient.Options {
  baseUrl?: string;          // Specify a custom URL to connect the client to
  token?: string;            // API token/key
  project?: string;          // Your project slug
  fetcher?: Function;        // Custom fetch function
}
```

## API Reference

### Provider Functions

- `lettaCloud(agentId: string)` - Pre-configured provider for Letta Cloud
- `lettaLocal(agentId: string)` - Pre-configured provider for local Letta instance
- `createLetta(options)` - Create a custom provider instance

### Utility Functions

- `convertToAiSdkMessage(messages, options)` - Convert Letta messages to AI SDK format
- `loadDefaultProject` - Load default project from environment
- `loadDefaultTemplate` - Load default template from environment

## Troubleshooting

### Common Issues

**Agent not found error:**
```typescript
// Ensure your agent ID is correct
const agents = await lettaCloud.client.agents.list();
console.log('Available agents:', agents.map(a => a.id));
```

**Authentication errors:**
- Verify your `LETTA_API_KEY` is set correctly
- Check that your API key has the necessary permissions

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- [Letta Documentation](https://docs.letta.com)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai)
- [GitHub Issues](https://github.com/letta-ai/vercel-ai-sdk-provider/issues)
- [Letta Community Discord](https://discord.gg/letta)
