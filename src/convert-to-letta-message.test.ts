import { describe, it, expect } from 'vitest';
import { convertToLettaMessage } from './convert-to-letta-message';
import { LanguageModelV1Prompt } from '@ai-sdk/provider';
import { MessageCreate } from '@letta-ai/letta-client/api';

describe('convertToLettaMessage', () => {
    it('should convert user messages correctly', () => {
        const prompt: LanguageModelV1Prompt = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Hello' },
                    { type: 'text', text: 'World' }
                ]
            }
        ];

        const expected: MessageCreate[] = [
            { role: 'user', content: 'Hello' },
            { role: 'user', content: 'World' }
        ];

        expect(convertToLettaMessage(prompt)).toEqual(expected);
    });

    it('should throw an error for unsupported file types', () => {
        const prompt: LanguageModelV1Prompt = [
            {
                role: 'user',
                content: [
                    { type: 'image', text: 'image.png' }
                ]
            }
        ];

        expect(() => convertToLettaMessage(prompt)).toThrow('File type image not supported');
    });

    it('should throw an error for assistant role', () => {
        const prompt: LanguageModelV1Prompt = [
            {
                role: 'assistant',
                content: [
                    { type: 'text', text: 'Hello' }
                ]
            }
        ];

        expect(() => convertToLettaMessage(prompt)).toThrow('Assistant role is not supported');
    });

    it('should throw an error for tool role', () => {
        const prompt: LanguageModelV1Prompt = [
            {
                role: 'tool',
                content: [
                    { type: 'text', text: 'Hello' }
                ]
            }
        ];

        expect(() => convertToLettaMessage(prompt)).toThrow('Tool role is not supported');
    });

    it('should handle system role correctly', () => {
        const prompt: LanguageModelV1Prompt = [
            {
                role: 'system',
                content: [
                    { type: 'text', text: 'System message!' }
                ]
            }
        ];

        const expected: MessageCreate[] = [
            { role: 'system', content: [{ type: 'text', text: 'System message' }] }
        ];

        expect(convertToLettaMessage(prompt)).toEqual(expected);
    });
});