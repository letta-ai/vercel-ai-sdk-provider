# AI SDK - Letta Provider


## Setup

The Letta provider is available in the `@letta-ai/vercel-ai-sdk-provider` module. You can install it with

```bash
npm i @letta-ai/vercel-ai-sdk-provider
```

## Provider Instance

You can import the default provider instance `letta` from `@letta-ai/vercel-ai-sdk-provider`:

```ts
import { letta } from '@letta-ai/vercel-ai-sdk-provider';
```

## Example

```ts
import { mistral } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: letta('your-agent-id'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```
