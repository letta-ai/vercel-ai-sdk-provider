'use client';

import { useChat } from '@ai-sdk/react';
import {useMemo} from "react";

export default function Chat() {
    const { messages, status, input, handleInputChange, handleSubmit } = useChat();

    const isLoading = useMemo(() => {
        return status === 'streaming' || status === 'submitted'
    }, [status]);

    return (
        <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
            {messages.map(message => (
                <div key={message.id} className="whitespace-pre-wrap">
                    {message.role === 'user' ? 'User: ' : 'AI: '}
                    {message.parts.map((part, i) => {
                        switch (part.type) {
                            case 'text':
                                return <div key={`${message.id}-${i}`}>{part.text}</div>;
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