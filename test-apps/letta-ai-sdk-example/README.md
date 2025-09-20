# Letta AI SDK Example App

This is a Next.js test application for the Letta AI SDK Provider with AI SDK 5.0.

## Features

- 🤖 Chat interface with Letta agents
- 🔄 Real-time streaming responses
- ⚡ Non-streaming `generateText` with custom fetch
- 💾 Message persistence with cookies
- 🧠 Reasoning token support and display
- 🔧 Tool call visualization
- 📊 Token usage statistics
- 📱 Responsive design
- ⚡ Built with Next.js 15 and React 19
- 🚀 Custom chat and generate implementations

## Setup

### 1. Environment Variables

Create a `.env` file in this directory:

```bash
# Required: Your Letta API token
LETTA_API_KEY=your-letta-api-token

# Required: Your Letta agent ID
LETTA_AGENT_ID=your-agent-id

# Optional: Test mode (local or cloud)
TEST_MODE=cloud

# Optional: Custom base URL for local development
BASE_URL_OVERRIDE=http://localhost:8283
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Provider

Make sure the provider is built first:

```bash
cd ../..
npm run build
cd test-apps/letta-ai-sdk-example
```

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic Chat

The app provides a simple chat interface where you can:

1. Send messages to your Letta agent
2. Receive streaming responses in real-time
3. View conversation history
4. Handle errors with retry mechanisms

### Configuration Options

#### Test Mode

Set `TEST_MODE` in your environment:

- `cloud`: Uses Letta Cloud (default)
- `local`: Uses local Letta instance at `http://localhost:8283`

#### Agent Management

The app uses cookies to persist the active agent ID. You can:

- Set a default agent via `LETTA_AGENT_ID`
- Switch agents by updating the cookie
- Create new agents programmatically

## Architecture

### Components

- **`Chat.tsx`**: Main chat interface with custom implementation
- **`page.tsx`**: Server component that loads agent data
- **`providers.tsx`**: Client-side providers setup

### API Routes

- **`/api/chat`**: Handles chat messages with streaming responses (`streamText`)
- **`/api/generate`**: Handles non-streaming text generation (`generateText`)

### How It Works

1. **Server Side**: Loads existing messages and agent configuration
2. **Client Side**: Renders chat interface and handles user interactions
3. **API Routes**: Process messages through Letta provider with two approaches:
   - **Streaming**: Real-time response streaming via `streamText`
   - **Generate**: Complete responses via `generateText`

### Current Implementation

The app includes two main interfaces:

#### Streaming Chat (`Chat.tsx`)
Uses `useChat` hook with `streamText` for real-time streaming:
- Real-time streaming responses from Letta agents
- Message state management with React hooks
- Error handling and user feedback
- Loading states and progress indicators

#### Generate Interface (`generate/GenerateClient.tsx`)
Uses custom fetch with `generateText` for complete responses:
- Non-streaming complete text generation
- Custom state management with TypeScript interfaces
- Direct `doGenerate` method testing
- Detailed response visualization (reasoning, tool calls, usage stats)
- Error handling with custom fetch implementation

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**
   ```bash
   # Rebuild the provider
   cd ../..
   npm run build
   cd test-apps/letta-ai-sdk-example
   npm install
   ```

2. **Agent Not Found**
   - Verify `LETTA_AGENT_ID` is correct
   - Check your Letta API token has access to the agent
   - Ensure the agent exists in your Letta instance

3. **Network Errors**
   - Check `BASE_URL_OVERRIDE` for local development
   - Verify `LETTA_API_KEY` is valid
   - Ensure Letta service is running (for local mode)

4. **TypeScript Errors**
   ```bash
   # Clear and rebuild
   rm -rf .next
   npm run build
   ```

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=letta:*
NODE_ENV=development
```

## API Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LETTA_API_KEY` | Yes | Your Letta API token |
| `LETTA_AGENT_ID` | Yes | Default agent ID to use |
| `TEST_MODE` | No | `cloud` or `local` (default: `cloud`) |
| `BASE_URL_OVERRIDE` | No | Custom Letta instance URL |

### API Endpoints

#### POST `/api/chat`

Send a message to the streaming chat API using `streamText`.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "agentId": "your-agent-id"
}
```

**Response:**
- Streaming text response (UI Message Stream Protocol)
- Real-time assistant messages and tool calls
- Reasoning tokens (if supported by model)

#### POST `/api/generate`

Send a message to the non-streaming generate API using `generateText`.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "agentId": "your-agent-id"
}
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-123456789",
      "role": "assistant",
      "content": "Generated response text",
      "experimental_data": {
        "text": "Generated response text",
        "finishReason": "stop",
        "usage": {
          "inputTokens": 15,
          "outputTokens": 42,
          "totalTokens": 57
        },
        "toolCalls": [...],
        "toolResults": [...],
        "reasoning": [...],
        "warnings": [...]
      }
    }
  ]
}
```

## Examples

### Streaming Chat with `streamText`

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { streamText } from 'ai';

const result = streamText({
  model: lettaCloud(),
  providerOptions: {
    agent: { id: 'your-agent-id' }
  },
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

// Return streaming response
return result.toUIMessageStreamResponse({
  sendReasoning: true,
});
```

### Non-Streaming Generation with `generateText`

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: lettaCloud(),
  providerOptions: {
    agent: { id: 'your-agent-id' }
  },
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

// Access complete response
console.log(result.text);
console.log(result.usage);
console.log(result.toolCalls);
console.log(result.reasoning);
```

### With Custom Configuration

```typescript
const result = streamText({
  model: lettaLocal(), // Use local instance
  providerOptions: {
    agent: { id: 'local-agent-123' }
  },
  messages: [...],
});
```

## Development

### File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Streaming chat API (streamText)
│   │   └── generate/route.ts      # Non-streaming generate API (generateText)
│   ├── generate/
│   │   ├── page.tsx               # Generate page wrapper
│   │   └── GenerateClient.tsx     # Generate interface (custom fetch)
│   ├── Chat.tsx                   # Main chat component (useChat hook)
│   ├── page.tsx                   # Home page
│   ├── layout.tsx                 # App layout
│   └── env-vars.ts                # Environment variables
└── ...
```

### Testing Both Approaches

The app provides two interfaces to test different AI SDK patterns:

1. **Main Chat (`/`)**: Uses `useChat` hook with `streamText` for real-time streaming
2. **Generate Page (`/generate`)**: Uses custom fetch with `generateText` for complete responses

Both interfaces test the same `doGenerate` method in the Letta provider but demonstrate different integration patterns with the AI SDK.

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see the main project LICENSE file for details.
