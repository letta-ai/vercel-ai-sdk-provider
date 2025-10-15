# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the official Vercel AI SDK provider for **Letta** - a platform for building stateful AI agents with long-term memory. The provider enables seamless integration between Letta agents and the Vercel AI SDK v5+ ecosystem, supporting both streaming and non-streaming chat interfaces.

### Architecture

**Core Components:**
- **LettaProvider** (`src/letta-provider.ts`): Factory that creates provider instances with different configurations (cloud, local, custom)
- **LettaChatModel** (`src/letta-chat.ts`): Main chat model implementation handling streaming/non-streaming via Letta's API
- **Message Conversion**: Bidirectional converters between Letta and AI SDK message formats
- **Tool System**: Placeholder tool creation for Letta's backend-executed tools

**Key Pattern**: Unlike traditional AI SDK providers that execute tools locally, Letta handles all tool execution on their backend. The provider creates tool "placeholders" that satisfy AI SDK type requirements while actual execution happens server-side.

**Message Flow:**
1. AI SDK messages → `convertToLettaMessage()` → Letta API
2. Letta streaming response → LettaChatModel transforms → AI SDK stream parts
3. Tools calls are buffered and emitted when JSON is complete

## Development Commands

### Build and Testing
```bash
# Build the provider (required before testing)
npm run build

# Watch mode during development
npm run build:watch

# Run all tests
npm run test

# Run only unit tests
npm run test:node

# Run unit tests in watch mode
npm run test:node:watch

# Run E2E tests (requires environment setup)
npm run test:e2e

# Run E2E tests against local Letta instance
npm run test:e2e:local

# Type checking
npm run type-check

# Linting
npm run lint

# Code formatting check
npm run prettier-check
```

### Example App Development
```bash
# Navigate to example app
cd test-apps/letta-ai-sdk-example

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

**Important**: Always build the provider first (`npm run build` in root) before working with the example app, as it depends on the built dist files.

## Development Workflow

### 1. Provider Changes
When modifying provider code:
1. Make changes in `src/`
2. Run `npm run build` or `npm run build:watch`
3. Test with example app or unit tests
4. Ensure type safety with `npm run type-check`

### 2. Testing Strategy
- **Unit Tests**: Test individual functions and message conversion
- **E2E Tests**: Test against real Letta instances (both local and cloud)
- **Example App**: Manual testing of streaming/non-streaming interfaces

### 3. Environment Setup
The example app supports two modes:

**Cloud Mode** (default):
```bash
LETTA_API_KEY=your-api-key
LETTA_AGENT_ID=your-agent-id
TEST_MODE=cloud
```

**Local Mode** (no API key required):
```bash
LETTA_AGENT_ID=your-local-agent-id
TEST_MODE=local
BASE_URL_OVERRIDE=http://localhost:8283
```

## Code Architecture Details

### Provider Pattern
Three factory functions create providers with different configurations:
- `lettaCloud()`: Pre-configured for Letta Cloud
- `lettaLocal()`: Pre-configured for localhost:8283  
- `createLetta(options)`: Custom configuration

### Streaming Implementation
The `doStream()` method in LettaChatModel handles complex streaming scenarios:
- **Text Streaming**: Buffers by message ID, emits deltas
- **Reasoning Streaming**: Separate reasoning blocks with source attribution
- **Tool Call Buffering**: Accumulates JSON arguments until valid, then emits complete tool calls
- **Tool Results**: Immediate emission with error handling

### Message Type Conversion
Key conversion utilities:
- `convertToLettaMessage()`: AI SDK → Letta format (single message only)
- `convertToAiSdkMessage()`: Letta → AI SDK UIMessage format with filtering options

### Tool Placeholder System
Tools are defined as placeholders since Letta handles execution:
```typescript
// Tool definitions are for AI SDK type safety only
const tools = {
  web_search: lettaCloud.tool("web_search"),
  memory_insert: lettaCloud.tool("memory_insert", {
    description: "Insert into agent memory",
    inputSchema: z.object({ content: z.string() })
  })
};
```

## Testing Considerations

### E2E Test Requirements
- **Local E2E**: Requires local Letta instance running on port 8283
- **Cloud E2E**: Requires valid `LETTA_API_KEY` and agent ID
- Tests cover both streaming and non-streaming scenarios

### Common Development Issues
1. **Module Resolution**: If seeing import errors, rebuild provider with `npm run build`
2. **Tool Execution**: Remember tools execute on Letta backend, not locally
3. **Message Limits**: Letta accepts only one message per API call (latest message from array)
4. **Streaming Complexity**: Tool calls require JSON completion buffering

### Build System
- **tsup**: Handles TypeScript compilation to both CJS and ESM
- **Workspace**: Example app references provider via `file:../..` dependency
- **Types**: Full TypeScript support with generated `.d.ts` files

## Key Integration Points

- **Letta Client SDK**: `@letta-ai/letta-client` for API communication
- **AI SDK Provider Interface**: Implements `LanguageModelV2` specification  
- **Streaming Protocol**: Supports AI SDK v5 streaming with reasoning tokens
- **Tool Integration**: Placeholder system compatible with AI SDK tool definitions
- **Message Conversion**: Bidirectional format transformation between systems