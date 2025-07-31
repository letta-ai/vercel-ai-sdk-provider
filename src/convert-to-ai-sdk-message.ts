import {LettaMessageUnion} from "@letta-ai/letta-client/api";
import {Message, TextUIPart, ToolInvocationUIPart} from "@ai-sdk/ui-utils";



interface ConvertToAiSdkMessageOptions {
    allowMessageTypes?: LettaMessageUnion['messageType'][]
}

const baseOptions: ConvertToAiSdkMessageOptions = {
    allowMessageTypes: [
        'user_message',
        'assistant_message',
        'system_message',
        'tool_call_message',
        'tool_return_message',
        'reasoning_message'
    ]
}

export function convertToAiSdkMessage(messages: LettaMessageUnion[], options: ConvertToAiSdkMessageOptions = baseOptions): Message[] {
    const sdkMessageObj: Record<string, Message> = {};

    const allowMessageTypeSet = new Set(options.allowMessageTypes || []);


    messages.forEach(message => {

        if (!allowMessageTypeSet.has(message.messageType)) {
            return;
        }

        if (!sdkMessageObj[message.id]) {
            sdkMessageObj[message.id] = {
                role: 'data',
                content: '',
                id: message.id,
                parts: []
            }
        }


        if (message.messageType === 'system_message') {
            sdkMessageObj[message.id].role = 'system';
            sdkMessageObj[message.id].content = message.content;
            sdkMessageObj[message.id].createdAt = message.date;
            const textPart: TextUIPart = {
                type: 'text',
                text: message.content,
            }

            if (!sdkMessageObj[message.id].parts) {
                sdkMessageObj[message.id].parts = [];
            }

            // @ts-ignore
            sdkMessageObj[message.id].parts.push(textPart);
        }



        sdkMessageObj[message.id].createdAt = message.date;

        if (message.messageType === 'user_message') {
            sdkMessageObj[message.id].role = 'user';
            let text = message.content;

            if (Array.isArray(text)) {
                text = text.map(val => {
                    switch (val.type) {
                        case 'text':
                            return val.text
                        default:
                            throw new Error(`File type ${val.type} not supported`)
                    }
                }).join('');
            }

            sdkMessageObj[message.id].content = text;
            sdkMessageObj[message.id].createdAt = message.date;
            const textPart: TextUIPart = {
                type: 'text',
                text,
            }

            if (!sdkMessageObj[message.id].parts) {
                sdkMessageObj[message.id].parts = [];
            }

            // @ts-ignore
            sdkMessageObj[message.id].parts.push(textPart);
        }

        if (message.messageType === 'assistant_message') {
            sdkMessageObj[message.id].role = 'assistant';
            let text = message.content;

            if (Array.isArray(text)) {
                text = text.map(val => {
                    switch (val.type) {
                        case 'text':
                            return val.text
                        default:
                            throw new Error(`File type ${val.type} not supported`)
                    }
                }).join('');
            }

            sdkMessageObj[message.id].content = text;

            const textPart: TextUIPart = {
                type: 'text',
                text,
            }

            if (!sdkMessageObj[message.id].parts) {
                sdkMessageObj[message.id].parts = [];
            }

            // @ts-ignore
            sdkMessageObj[message.id].parts.push(textPart);
        }

        if (message.messageType === 'reasoning_message') {
            if (!sdkMessageObj[message.id].parts) {
                sdkMessageObj[message.id].parts = [];
            }

            sdkMessageObj[message.id].role = 'assistant';
            // @ts-ignore
            sdkMessageObj[message.id].parts.push({
                type: 'reasoning',
                reasoning: message.reasoning,
                details: [],
            });
            sdkMessageObj[message.id].createdAt = message.date;
        }

        // Letta handles the tool call message, so the tool *return* message is not used
        if (message.messageType === 'tool_return_message' || message.messageType === 'tool_call_message') {
            if (!sdkMessageObj[message.id].parts) {
                sdkMessageObj[message.id].parts = [];
            }

            sdkMessageObj[message.id].role = 'assistant';

            const isToolCallMessage = message.messageType === 'tool_call_message';

            const toolInvocation: ToolInvocationUIPart = {
                type: 'tool-invocation',
                toolInvocation: {
                    state: 'result',
                    result: isToolCallMessage ? '' : message.toolReturn,
                    toolCallId: isToolCallMessage ? message.toolCall.toolCallId || '' : message.toolCallId || '',
                    toolName: isToolCallMessage ? message.toolCall.name || '' : message.name || '',
                    args: isToolCallMessage ? message.toolCall.arguments || '' : {},
                }
            }

            // @ts-ignore
            sdkMessageObj[message.id].parts.push(toolInvocation);
        }
    })

    return Object.values(sdkMessageObj).sort((a, b) => {
        if (a.createdAt && b.createdAt) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return 0;
    });
}