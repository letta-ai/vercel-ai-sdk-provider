'use client';

import {useChat} from '@ai-sdk/react';
import {useEffect, useMemo, useRef} from "react";
import {Message} from "@ai-sdk/ui-utils";

interface ChatProps {
    agentId: string
    existingMessages: Message[]
    saveAgentIdCookie: (agentId: string) => void
}

export function Chat(props: ChatProps) {
    const {agentId, existingMessages, saveAgentIdCookie} = props;

    const agentIdSaved = useRef<boolean>(false);

    useEffect(() => {
        if (agentIdSaved.current) {
            return;
        }

        agentIdSaved.current = true;
        saveAgentIdCookie(agentId);
    }, [agentId, saveAgentIdCookie]);


    const {messages, status, input, handleInputChange, handleSubmit} = useChat({
        body: {agentId},
        initialMessages: existingMessages,
        streamProtocol: 'data',
        onFinish: (message, { usage, finishReason }) => {
            console.log('Finished streaming message:', message);
            console.log('Token usage:', usage);
            console.log('Finish reason:', finishReason);
        },
        onError: error => {
            console.error('An error occurred:', error);
        },
        onResponse: response => {
            console.log('Received HTTP response from server:', response);
        },
    });

    const isLoading = useMemo(() => {
        return status === 'streaming' || status === 'submitted'
    }, [status]);

    return (
        <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
            <div>Chatting with {agentId}</div>
            {messages.map(message => (
                <div key={message.id} className="whitespace-pre-wrap">
                    {message.role === 'user' ? 'User: ' : 'AI: '}
                    {message.parts.map((part, i) => {
                        switch (part.type) {
                            case 'text':
                                return <div key={`${message.id}-${i}`}>{part.text}</div>;
                            case 'reasoning':
                                return <div key={`${message.id}-${i}`}>{part.reasoning}</div>;
                        }
                    })}
                </div>
            ))}

            <form onSubmit={handleSubmit}>
                {isLoading && (
                    <div className="flex items-center justify-center w-full h-12">
                        Streaming...
                    </div>
                )}
                <input
                    className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
                    value={input}
                    disabled={status !== 'ready'}
                    placeholder="Say something..."
                    onChange={handleInputChange}
                />
            </form>
        </div>
    );
}