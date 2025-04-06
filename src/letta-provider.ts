import {
    EmbeddingModelV1,
    LanguageModelV1,
    ProviderV1,
} from '@ai-sdk/provider';
import {
    loadApiKey,
} from '@ai-sdk/provider-utils';

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
}

/**
 Create a Letta AI provider instance.
 */
export function createLetta(
    options: LettaClient.Options = {},
): LettaProvider {

    const client = new LettaClient({
        ...options,
        token: loadApiKey({
            apiKey: options.token as string,
            environmentVariableName: 'LETTA_API_KEY',
            description: 'Letta',
        }),
        baseUrl: options.baseUrl || 'https://api.letta.com',
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
    return provider;
}

/**
 Default Mistral provider instance.
 */
export const letta = createLetta();