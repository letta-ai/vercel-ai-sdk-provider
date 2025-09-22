"use client";

import { useState } from "react";
import { AGENT_ID, TEST_MODE } from "@/app/env-vars";

interface UsageData {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface ReasoningData {
  text: string;
  providerMetadata?: {
    reasoning?: {
      source?: string;
    };
  };
}

interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
}

interface ExperimentalData {
  text?: string;
  finishReason?: string;
  usage?: UsageData;
  warnings?: Array<{ message: string }>;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  reasoning?: ReasoningData[];
  response?: {
    id: string;
    modelId: string;
    timestamp: string;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  experimental_data?: ExperimentalData;
}

export default function GenerateClient() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // useChat is not available for generateText
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          agentId: AGENT_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: { messages: Message[] } = await response.json();

      // Add assistant message from response
      if (result.messages && result.messages[0]) {
        const assistantMessage: Message = result.messages[0];
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Generate error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const lastMessage = messages[messages.length - 1];
  const result =
    lastMessage && lastMessage.role === "assistant" ? lastMessage : null;

  return (
    <div className="space-y-8">
      {/* Info Section */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          🧪 doGenerate Method Testing
        </h3>
        <p className="text-blue-800 text-sm mb-3">
          This page directly tests the{" "}
          <code className="bg-blue-100 px-1 rounded">doGenerate</code> method
          from the Letta provider using{" "}
          <code className="bg-blue-100 px-1 rounded">generateText</code> with
          custom fetch.
        </p>
        <div className="text-sm text-blue-700">
          <p>
            <strong>Mode:</strong> {TEST_MODE}
          </p>
          <p>
            <strong>Agent ID:</strong> {AGENT_ID}
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message to send to Letta agent:
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your message here..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Generating..." : "Generate Response"}
          </button>
          <div className="text-xs text-gray-500">
            Status: {isLoading ? "loading" : "ready"} | Messages:{" "}
            {messages.length}
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="bg-red-100 px-2 py-1 rounded text-sm text-red-800 hover:bg-red-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-6">
          {/* Generated Response */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">
              📝 Generated Response
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-wrap">{result.content}</p>
            </div>
          </div>

          {/* Reasoning Display */}
          {result.experimental_data?.reasoning &&
            result.experimental_data.reasoning.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">🧠 Reasoning</h3>
                <div className="space-y-3">
                  {result.experimental_data.reasoning.map(
                    (reasoning: ReasoningData, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg"
                      >
                        <div className="flex items-center mb-1">
                          <span className="text-purple-700 font-semibold text-sm">
                            {reasoning.providerMetadata?.reasoning?.source ===
                            "reasoner_model"
                              ? "🧠 Model Reasoning"
                              : "🤖 Agent Reasoning"}
                          </span>
                          <span className="ml-2 text-xs text-purple-500">
                            (
                            {reasoning.providerMetadata?.reasoning?.source ||
                              "unknown source"}
                            )
                          </span>
                        </div>
                        <div className="text-purple-800 text-sm italic">
                          {reasoning.text}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Tool Calls */}
          {result.experimental_data?.toolCalls &&
            result.experimental_data.toolCalls.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">🔧 Tool Calls</h3>
                <div className="space-y-2">
                  {result.experimental_data.toolCalls.map(
                    (tool: ToolCall, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg"
                      >
                        <div className="text-green-700 font-semibold text-sm mb-2">
                          🛠️ {tool.toolName}
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Args:</strong>
                            <pre className="text-xs bg-green-100 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(tool.args, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Warnings */}
          {result.experimental_data?.warnings &&
            result.experimental_data.warnings.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  ⚠️ Warnings
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {result.experimental_data.warnings.map(
                    (warning: { message: string }, index: number) => (
                      <li key={index}>• {warning.message}</li>
                    ),
                  )}
                </ul>
              </div>
            )}

          {/* Conversation History */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">
              💬 Conversation History ({messages.length} messages)
            </h3>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`p-3 rounded ${
                    message.role === "user"
                      ? "bg-blue-50 border-l-4 border-blue-400"
                      : "bg-gray-50 border-l-4 border-gray-400"
                  }`}
                >
                  <div className="font-semibold text-sm capitalize mb-1">
                    {message.role === "user" ? "👤 User" : "🤖 Assistant"}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Response Debug */}
          <details className="bg-white rounded-lg shadow-sm border">
            <summary className="p-4 cursor-pointer hover:bg-gray-50 font-medium text-gray-700">
              🔍 Raw Response Data (Debug)
            </summary>
            <div className="p-4 border-t">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* Documentation */}
      <div className="bg-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          📚 About Generate with Custom Fetch + generateText
        </h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            This page uses a custom fetch implementation with a backend that
            uses <code className="bg-gray-200 px-1 rounded">generateText</code>{" "}
            for non-streaming responses.
          </p>
          <p>
            This approach gives you full control over the request/response
            handling while using the synchronous generateText method for
            complete responses.
          </p>
          <p>
            <strong>Features tested:</strong> Non-streaming generation,
            conversation management, custom fetch handling, error states, and
            generateText functionality.
          </p>
        </div>
      </div>
    </div>
  );
}
