import { describe, it, expect } from 'vitest';
import { convertToAiSdkMessage } from './convert-to-ai-sdk-message';
import { LettaMessageUnion } from '@letta-ai/letta-client/api';
import { Message } from '@ai-sdk/ui-utils';

describe('convertToAiSdkMessage', () => {
    it('should convert user messages correctly', () => {
        const messages: LettaMessageUnion[] = [
            {
                id: '1',
                messageType: 'user_message',
                content: [{ type: 'text', text: 'Hello' }],
                date: new Date('2023-10-01T10:00:00Z')
            }
        ];

        const expected: Message[] = [
            {
                role: 'user',
                content: 'Hello',
                id: '1',
                parts: [{
                    type: 'text',
                    text: 'Hello'
                }],
                createdAt: new Date('2023-10-01T10:00:00Z')
            }
        ];

        expect(convertToAiSdkMessage(messages)).toEqual(expected);
    });

    it('should convert assistant messages correctly', () => {
        const messages: LettaMessageUnion[] = [
            {
                id: '2',
                messageType: 'assistant_message',
                content: [{ type: 'text', text: 'Hi there!' }],
                date: new Date('2023-10-01T10:05:00Z')
            }
        ];

        const expected: Message[] = [
            {
                role: 'assistant',
                content: 'Hi there!',
                id: '2',
                parts: [{
                    type: 'text',
                    text: 'Hi there!'
                }],
                createdAt: new Date('2023-10-01T10:05:00Z')
            }
        ];

        expect(convertToAiSdkMessage(messages)).toEqual(expected);
    });

    it('should convert reasoning messages correctly', () => {
        const messages: LettaMessageUnion[] = [
            {
                id: '3',
                messageType: 'reasoning_message',
                reasoning: 'This is a reasoning message',
                date: new Date('2023-10-01T10:10:00Z')
            }
        ];

        const expected: Message[] = [
            {
                role: 'assistant',
                content: '',
                id: '3',
                parts: [
                    {
                        type: 'reasoning',
                        reasoning: 'This is a reasoning message',
                        details: []
                    }
                ],
                createdAt: new Date('2023-10-01T10:10:00Z')
            }
        ];

        expect(convertToAiSdkMessage(messages)).toEqual(expected);
    });

    it('should convert tool call messages correctly', () => {
        const messages: LettaMessageUnion[] = [
            {
                id: '4',
                messageType: 'tool_call_message',
                toolCall: {
                    toolCallId: 'tool-1',
                    name: 'ToolName',
                    arguments: 'arg1'
                },
                date: new Date('2023-10-01T10:15:00Z')
            }
        ];

        const expected: Message[] = [
            {
                role: 'assistant',
                content: '',
                id: '4',
                parts: [
                    {
                        type: 'tool-invocation',
                        toolInvocation: {
                            state: 'result', // should be 'call' for tool calls, but temporarily set to 'result' to avoid errors
                            result: '', // this prevents the "ToolInvocation must have a result" error
                            toolCallId: 'tool-1',
                            toolName: 'ToolName',
                            args: 'arg1'
                        }
                    }
                ],
                createdAt: new Date('2023-10-01T10:15:00Z')
            }
        ];

        expect(convertToAiSdkMessage(messages)).toEqual(expected);
    });

    it('should convert tool return messages correctly', () => {
        const messages: LettaMessageUnion[] = [
            {
                id: '5',
                messageType: 'tool_return_message',
                toolReturn: 'result',
                toolCallId: 'tool-1',
                name: 'ToolName',
                status: 'success',
                date: new Date('2023-10-01T10:20:00Z')
            }
        ];

        const expected: Message[] = [
            {
                role: 'assistant',
                content: '',
                id: '5',
                parts: [
                    {
                        type: 'tool-invocation',
                        toolInvocation: {
                            state: 'result',
                            result: 'result',
                            toolCallId: 'tool-1',
                            toolName: 'ToolName',
                            args: {}
                        }
                    }
                ],
                createdAt: new Date('2023-10-01T10:20:00Z')
            }
        ];

        expect(convertToAiSdkMessage(messages)).toEqual(expected);
    });

    it('should handle messages with the same id having both reasoning and message', () => {
        const messages: LettaMessageUnion[] = [
            {
                id: '6',
                messageType: 'reasoning_message',
                reasoning: 'This is a reasoning message',
                date: new Date('2023-10-01T10:25:00Z')
            },
            {
                id: '6',
                messageType: 'user_message',
                content: [{ type: 'text', text: 'Hello' }],
                date: new Date('2023-10-01T10:25:00Z')
            }
        ];

        const expected: Message[] = [
            {
                role: 'user',
                content: 'Hello',
                id: '6',
                parts: [
                    {
                        type: 'reasoning',
                        reasoning: 'This is a reasoning message',
                        details: []
                    },
                    {
                        type: 'text',
                        text: 'Hello'
                    }
                ],
                createdAt: new Date('2023-10-01T10:25:00Z')
            }
        ];

        expect(convertToAiSdkMessage(messages)).toEqual(expected);
    });
});