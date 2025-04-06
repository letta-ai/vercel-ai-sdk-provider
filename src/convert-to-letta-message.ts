import {LanguageModelV1Prompt} from "@ai-sdk/provider";
import {MessageCreate} from "@letta-ai/letta-client/api";

export function convertToLettaMessage(prompt: LanguageModelV1Prompt): MessageCreate[] {

    return prompt.map(message => {
        if (message.role === 'user') {
            const content = message.content.map(val => {
                switch (val.type) {
                    case 'text':
                        return val.text
                    default:
                        throw new Error(`File type ${val.type} not supported`)
                }
            });

            return content.map(val => {
                return {
                    role: 'user' as const,
                    content: val,
                }
            })
        }

        if (message.role === 'assistant') {
            throw new Error('Assistant role is not supported')
        }

        if (message.role === 'tool') {
            throw new Error('Tool role is not supported')
        }


        return ({
            role: 'system' as const,
            content: message.content,
        })
    }).flat()
}