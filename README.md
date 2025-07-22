# AI SDK - Letta Provider
![NPM Version](https://img.shields.io/npm/v/%40letta-ai%2Fvercel-ai-sdk-provider)


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

## Quick Start
### Using Letta Cloud (https://api.letta.com)
Create a file called `.env.local` and add your [API Key](https://app.letta.com/api-keys)
```text
LETTA_API_KEY=<your_letta_cloud_apikey>
```

```ts
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: lettaCloud('your-agent-id'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

### Local instances (http://localhost:8283)
```ts
import { lettaLocal } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: lettaLocal('your-agent-id'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```


### Custom setups
```ts
import { createLetta } from '@letta-ai/vercel-ai-sdk-provider';
import { generateText } from 'ai';

const letta = createLetta({
    baseUrl: '<your_base_url>',
    token: '<your_access_token>'
})

const { text } = await generateText({
  model: letta('your_agent_id'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

### Using other Letta Client Functions
The `vercel-ai-sdk-provider` extends the letta node client, you can access the operations directly by using `lettaCloud.client` or `lettaLocal.client` or your custom generated `letta.client`
```ts
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';

lettaCloud.client.agents.list();

```

## More Examples
Check out our simple example using nextjs to stream letta messages to your frontend in [examples/letta-ai-sdk-example](examples/letta-ai-sdk-example)

