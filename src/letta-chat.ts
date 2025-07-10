import {
    LanguageModelV1,
    LanguageModelV1CallWarning,
    LanguageModelV1FunctionToolCall,
} from '@ai-sdk/provider';
import {convertToLettaMessage} from "./convert-to-letta-message";
import {LettaClient} from "@letta-ai/letta-client";


export class LettaChatModel implements LanguageModelV1 {
    readonly specificationVersion = 'v1' as LanguageModelV1['specificationVersion']
    readonly defaultObjectGenerationMode = 'json';
    readonly supportsImageUrls = false;

    readonly modelId = 'see-your-agent-config';

    readonly agentId: string;
    readonly client: LettaClient;


    constructor(
        agentId: string,
        client: LettaClient
    ) {
        this.agentId = agentId;
        this.client = client;
    }

    get provider(): string {
        return 'letta.chat'
    }

    supportsUrl(url: URL): boolean {
        return url.protocol === 'https:' || url.protocol === 'http:';
    }

    private getArgs({
                        prompt,
                    }: Parameters<LanguageModelV1['doGenerate']>[0]) {

        const warnings: LanguageModelV1CallWarning[] = [];

        const baseArgs = {
            agentId: this.agentId,
            messages: convertToLettaMessage(prompt),
        };


        return {
            args: baseArgs,
            warnings,
        };
    }

    async doGenerate(
        options: Parameters<LanguageModelV1['doGenerate']>[0],
    ): Promise<Awaited<ReturnType<LanguageModelV1['doGenerate']>>> {
        const {args, warnings} = this.getArgs(options);

        const {
            messages
        } = await this.client.agents.messages.create(args.agentId, {
            messages: args.messages,
        })


        let text: string = '';
        let reasoning: string | undefined = undefined;
        const toolCalls: Array<LanguageModelV1FunctionToolCall> = [];

        messages.forEach(message => {

            if (message.messageType === 'assistant_message') {
                text += message.content;
            }

            if (message.messageType === 'tool_call_message') {
                toolCalls.push({
                    toolCallType: 'function',
                    toolCallId: message.id,
                    toolName: message.name || '',
                    args: message.toolCall.arguments || '',
                });
            }

            if (message.messageType === 'reasoning_message') {
                reasoning += message.reasoning;
            }
        })

        return {
            text,
            reasoning,
            toolCalls,
            finishReason: 'stop',
            usage: {
                promptTokens: -1,
                completionTokens: -1,
            },
            rawCall: {
                rawPrompt: args.messages,
                rawSettings: {
                    agentId: args.agentId,
                },
            },
            rawResponse: {
                body: messages,
            },
            request: {body: JSON.stringify(args)},
            warnings,
        };
    }

    async doStream(
        options: Parameters<LanguageModelV1['doStream']>[0],
    ): Promise<Awaited<ReturnType<LanguageModelV1['doStream']>>> {
        const {args, warnings} = this.getArgs({
            ...options,
            prompt: options.prompt.filter(p => p.role !== "assistant" && p.role !== "tool")
        });

        const body = {...args, stream: true};


        const response = await this.client.agents.messages.createStream(
            args.agentId,
            {
                messages: args.messages,
                streamTokens: true,
            },
        );


        const readableStream = new ReadableStream({
            async pull(controller) {
                let lastToolName = '';
                let lastToolCallId = '';

                for await (const message of response) {

                    if (message.messageType === 'assistant_message') {
                        let textDelta = '';
                        if (typeof message.content === 'string') {
                            textDelta = message.content;
                        } else {
                            message.content.forEach(v => {
                                if (v.type === 'text') {
                                    textDelta += v.text;
                                }
                            })
                        }

                        controller.enqueue({
                            type: 'text-delta',
                            textDelta: textDelta,
                        });
                    }


                    if (message.messageType === 'tool_call_message') {

                        if (message.toolCall.name) {
                            lastToolName = message.toolCall.name;
                        }

                        if (message.toolCall.toolCallId) {
                            lastToolCallId = message.toolCall.toolCallId;
                        }
                        controller.enqueue({
                            type: 'tool-call-delta',
                            toolCallType: 'function',
                            toolCallId: lastToolCallId,
                            toolName: lastToolName,
                            argsTextDelta: message.toolCall.arguments,
                        });
                    }


                }

                controller.close();
            },
        });


        return {
            stream: readableStream,
            rawCall: {
                rawPrompt: args.messages,
                rawSettings: {
                    agentId: args.agentId,
                },
            },
            request: {body: JSON.stringify(body)},
            warnings,
        };
    }
}
