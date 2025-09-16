"use client";

import { useState, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
}

interface ChatProps {
  agentId: string;
  existingMessages: Message[];
  saveAgentIdCookie: (agentId: string) => void;
}

export function Chat(props: ChatProps) {
  const { agentId, existingMessages, saveAgentIdCookie } = props;
  const [messages, setMessages] = useState<Message[]>(existingMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveAgentIdCookie(agentId);
  }, [agentId, saveAgentIdCookie]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          agentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let assistantResponse = "";
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantResponse += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: assistantResponse }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setError(errorMsg);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: `Sorry, there was an error: ${errorMsg}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="mb-4 text-center">
        <div className="font-medium">Chatting with Agent: {agentId}</div>
        {error && (
          <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded border">
            <div className="font-medium">Error occurred:</div>
            <div className="mt-1">{error}</div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={clearError}
                className="text-gray-500 underline hover:text-gray-700 text-xs"
              >
                Clear Error
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 mb-20 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="whitespace-pre-wrap">
            <div
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100 dark:bg-blue-900 ml-8 border border-blue-200"
                  : message.role === "assistant"
                    ? "bg-gray-100 dark:bg-gray-800 mr-8 border border-gray-200"
                    : "bg-yellow-100 dark:bg-yellow-900 mr-8 border border-yellow-200"
              }`}
            >
              <div className="font-semibold text-sm mb-1 opacity-70">
                {message.role === "user"
                  ? "You"
                  : message.role === "assistant"
                    ? "Assistant"
                    : "System"}
              </div>
              <div className="text-sm">{message.content}</div>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md p-4 bg-white dark:bg-gray-900"
      >
        {isLoading && (
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Assistant is responding...
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type your message..."
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors font-medium"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-2"></div>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
