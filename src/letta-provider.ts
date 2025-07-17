import {
    EmbeddingModelV1,
    LanguageModelV1,
    ProviderV1,
} from '@ai-sdk/provider';

import {LettaClient} from "@letta-ai/letta-client";
import {LettaChatModel} from "./letta-chat";

export interface LettaProvider extends ProviderV1 {
    (
        agentId: string,
    ): LanguageModelV1;

    /**
     Creates a model for text generation.
     */
    chat(
        agentId: string,
    ): LanguageModelV1;

    /**
     @deprecated Use `textEmbeddingModel()` instead.
     */
    textEmbedding(): EmbeddingModelV1<string>;

    textEmbeddingModel: () => EmbeddingModelV1<string>;

    client: LettaClient

}

/**
 Create a Letta AI provider instance.
 */
export function createLetta(
    options: LettaClient.Options = {},
): LettaProvider {
    const client = new LettaClient({
        ...options,
        token: options.token || process.env.LETTA_API_KEY,
        baseUrl: options.baseUrl || process.env.BASE_URL_OVERRIDE || 'https://api.letta.com',
    })

    const createChatModel = (
        agentId: string
    ) =>
        new LettaChatModel(agentId, client);

    const provider = function (
        agentId: string,
    ) {
        if (new.target) {
            throw new Error(
                'The Letta model function cannot be called with the new keyword.',
            );
        }

        return createChatModel(agentId);
    };

    provider.languageModel = createChatModel;
    provider.chat = createChatModel;
    provider.textEmbedding = () => {
        throw new Error('unsupported');
    }
    provider.textEmbeddingModel = () => {
        throw new Error('unsupported');
    }

    provider.client = client;

    return provider;
}



/**
 Default Letta provider instance.
 */
export const lettaCloud = createLetta();
export const lettaLocal = createLetta({
    baseUrl: 'http://localhost:8283',
});


