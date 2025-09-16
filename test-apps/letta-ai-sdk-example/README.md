# Letta AI SDK Example App

This is a Next.js test application for the Letta AI SDK Provider with AI SDK 5.0.

## Features

- 🤖 Chat interface with Letta agents
- 🔄 Real-time streaming responses
- 💾 Message persistence with cookies
- 🌙 Dark mode support
- 📱 Responsive design
- ⚡ Built with Next.js 15 and React 19
- 🚀 Custom chat implementation
- 📖 AI SDK useChat() example (reference)

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

- **`/api/chat`**: Handles chat messages with streaming responses

### How It Works

1. **Server Side**: Loads existing messages and agent configuration
2. **Client Side**: Renders chat interface and handles user interactions
3. **API Route**: Processes messages through Letta provider
4. **Streaming**: Real-time response streaming with error handling

### Current Implementation

The current `Chat.tsx` uses a custom implementation that handles:

- Real-time streaming responses from Letta agents
- Message state management with React hooks
- Error handling and user feedback
- Loading states and progress indicators
- Clean, responsive UI with Tailwind CSS

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

Send a message to the chat API.

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
- Streaming text response
- Handles Letta agent interactions
- Returns assistant messages and tool calls

## Examples

### Basic Usage

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { streamText } from 'ai';

const result = streamText({
  model: lettaCloud('letta-model'),
  providerOptions: {
    agent: { id: 'your-agent-id' }
  },
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});
```

### With Custom Configuration

```typescript
const result = streamText({
  model: lettaLocal('letta-model'), // Use local instance
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
│   ├── api/chat/route.ts      # Chat API endpoint
│   ├── Chat.tsx               # Main chat component (custom implementation)
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # App layout
│   └── providers.tsx          # Client providers
├── USECHAT_EXAMPLE.md         # AI SDK useChat() example
└── ...
```

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
