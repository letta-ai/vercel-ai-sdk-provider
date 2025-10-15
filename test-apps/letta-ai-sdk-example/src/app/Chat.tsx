"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage, ToolUIPart } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

// Type guard for named tool parts
const isNamedTool = (part: {
  type: string;
  [key: string]: unknown;
}): part is ToolUIPart =>
  part.type.startsWith("tool-") && part.type !== "tool-invocation";

// Type guard for reasoning parts (both model and agent)
const isReasoningPart = (part: {
  type: string;
  [key: string]: unknown;
}): part is {
  type: string;
  text: string;
  providerMetadata?: { letta?: { source?: string; [key: string]: unknown } };
} =>
  part.type === "reasoning" && "text" in part && typeof part.text === "string";

// Letta reasoning source constants
const LETTA_SOURCE = {
  REASONER_MODEL: 'reasoner_model',
  NON_REASONER_MODEL: 'non_reasoner_model',
} as const;

// Helper to determine reasoning source
const getReasoningSource = (part: {
  type: string;
  text: string;
  providerMetadata?: { letta?: { source?: string; [key: string]: unknown } };
}) => {
  // Use the source field from Letta ReasoningMessage via providerMetadata.letta
  // "reasoner_model" = model-level reasoning (from language model itself)
  // "non_reasoner_model" = agent-level reasoning (from Letta platform)
  const source = part.providerMetadata?.letta?.source;

  if (source === LETTA_SOURCE.REASONER_MODEL) {
    return {
      source: "model" as const,
      text: part.text,
    };
  }

  if (source === LETTA_SOURCE.NON_REASONER_MODEL) {
    return {
      source: "agent" as const,
      text: part.text,
    };
  }

  // If no source field or unknown value, default to model reasoning
  // (this handles reasoning from extractReasoningMiddleware which won't have source)
  return {
    source: "model" as const,
    text: part.text,
  };
};

interface ChatProps {
  agentId: string;
  existingMessages?: UIMessage[];
  saveAgentIdCookie: (agentId: string) => void;
}

export function Chat(props: ChatProps) {
  const { agentId, saveAgentIdCookie, existingMessages = [] } = props;
  const [input, setInput] = useState("");
  const [showModelReasoning, setShowModelReasoning] = useState(true);
  const [showAgentReasoning, setShowAgentReasoning] = useState(true);

  const agentIdSaved = useRef<boolean>(false);

  useEffect(() => {
    if (agentIdSaved.current) {
      return;
    }

    agentIdSaved.current = true;
    saveAgentIdCookie(agentId);
  }, [agentId, saveAgentIdCookie]);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        agentId: agentId,
      },
    }),
    messages: existingMessages,
    onFinish: (message) => {
      console.log("Finished streaming message:", message);
    },
    onError: (error) => {
      console.error("useChat error:", error);
      console.error(
        "Error details:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
    },
  });

  const isLoading = useMemo(() => {
    return status === "streaming" || status === "submitted";
  }, [status]);

  return (
    <div className="flex flex-col w-full max-w-4xl py-24 mx-auto stretch">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Chatting with {agentId}</h2>
        <div className="p-2 bg-gray-100 rounded text-sm">
          <div>Messages count: {messages.length}</div>
          <div>Status: {status}</div>
        </div>
      </div>

      {/* Reasoning Controls */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-2">Reasoning Display Options</h3>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showModelReasoning}
              onChange={(e) => setShowModelReasoning(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">🧠 Show Model Reasoning</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showAgentReasoning}
              onChange={(e) => setShowAgentReasoning(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">🤖 Show Agent Reasoning</span>
          </label>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-20">
        {messages.map((message) => (
          <div
            key={message.id}
            className="p-4 border rounded-lg bg-white shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg">
                <span role={message.role === "system" ? "status" : undefined}>
                  {message.role === "user"
                    ? "👤 User"
                    : message.role === "system"
                      ? "⚙️ System"
                      : "🤖 Assistant"}
                </span>
              </div>
              <div className="text-xs text-gray-500">ID: {message.id}</div>
            </div>

            {/* Render message parts */}
            <div className="space-y-2">
              {message.parts && message.parts.length > 0
                ? message.parts.map((part, index) => (
                    <div key={index}>
                      {/* Text parts - regular message content */}
{part.type === "text" && (
                        <div className={`p-3 rounded-lg ${
                          message.role === "system"
                            ? "bg-yellow-50 border-l-4 border-yellow-400"
                            : "bg-gray-50"
                        }`}>
                          <div className={`${
                            message.role === "system"
                              ? "text-yellow-900 text-sm"
                              : "text-gray-800"
                          }`}
                          role={message.role === "system" ? "status" : undefined}
                          aria-label={message.role === "system" ? "System message" : undefined}>
                            {part.text}
                          </div>
                        </div>
                      )}

                      {/* Reasoning parts - with source detection */}
                      {isReasoningPart(part) &&
                        (() => {
                          const { source, text } = getReasoningSource(part);
                          const rawSource =
                            part.providerMetadata?.letta?.source;

                          // Model reasoning
                          if (source === "model" && showModelReasoning) {
                            return (
                              <div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                                <div className="flex items-center mb-1">
                                  <span className="text-purple-700 font-semibold text-sm">
                                    🧠 Model Reasoning
                                  </span>
                                  <span className="ml-2 text-xs text-purple-500">
                                    {rawSource
                                      ? `(source: ${rawSource})`
                                      : "(extracted from language model)"}
                                  </span>
                                </div>
                                <div className="text-purple-800 text-sm italic">
                                  {text}
                                </div>
                                {part.providerMetadata?.letta && (
                                  <details className="mt-2">
                                    <summary className="cursor-pointer text-xs text-purple-600 hover:text-purple-800">
                                      Show Letta Metadata
                                    </summary>
                                    <pre className="mt-1 text-xs bg-purple-100 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(
                                        part.providerMetadata.letta,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            );
                          }

                          // Agent reasoning
                          if (source === "agent" && showAgentReasoning) {
                            return (
                              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                                <div className="flex items-center mb-1">
                                  <span className="text-blue-700 font-semibold text-sm">
                                    🤖 Agent Reasoning
                                  </span>
                                  <span className="ml-2 text-xs text-blue-500">
                                    (source: {rawSource || "non_reasoner_model"}
                                    )
                                  </span>
                                </div>
                                <div className="text-blue-800 text-sm">
                                  {text}
                                </div>
                                {part.providerMetadata?.letta && (
                                  <details className="mt-2">
                                    <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                                      Show Letta Metadata
                                    </summary>
                                    <pre className="mt-1 text-xs bg-blue-100 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(
                                        part.providerMetadata.letta,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            );
                          }

                          return null;
                        })()}

                      {/* Named tool parts */}
                      {isNamedTool(part) && (
                        <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                          <div className="text-green-700 font-semibold text-sm mb-2">
                            🛠️ Tool:{" "}
                            {part.type
                              .replace("tool-", "")
                              .charAt(0)
                              .toUpperCase() +
                              part.type.replace("tool-", "").slice(1)}
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <strong>State:</strong>{" "}
                              {"state" in part ? String(part.state) : "N/A"}
                            </div>
                            <div>
                              <strong>Call ID:</strong>{" "}
                              {"toolCallId" in part
                                ? String(part.toolCallId)
                                : "N/A"}
                            </div>
                            {"input" in part &&
                              part.input !== null &&
                              part.input !== undefined && (
                                <div>
                                  <strong>Input:</strong>
                                  <pre className="text-xs bg-green-100 p-2 rounded mt-1 overflow-x-auto">
                                    {typeof part.input === "object"
                                      ? JSON.stringify(part.input, null, 2)
                                      : String(part.input)}
                                  </pre>
                                </div>
                              )}
                            {"output" in part &&
                              part.output !== null &&
                              part.output !== undefined && (
                                <div>
                                  <strong>Output:</strong>
                                  <pre className="text-xs bg-green-100 p-2 rounded mt-1 overflow-x-auto">
                                    {typeof part.output === "object"
                                      ? JSON.stringify(part.output, null, 2)
                                      : String(part.output)}
                                  </pre>
                                </div>
                              )}
                            {"errorText" in part && part.errorText && (
                              <div className="text-red-600">
                                <strong>Error:</strong> {String(part.errorText)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                : /* Fallback for legacy Message format without parts */
                  (message as { content?: string }).content && (
                    <div className={`p-3 rounded-lg ${
                      message.role === "system"
                        ? "bg-yellow-50 border-l-4 border-yellow-400"
                        : "bg-gray-50"
                    }`}>
                      <div className={`${
                        message.role === "system"
                          ? "text-yellow-900 text-sm"
                          : "text-gray-800"
                      }`}>
                        {(message as { content?: string }).content}
                      </div>
                    </div>
                  )}
            </div>

            {/* Debug info - collapsible */}
            <details className="mt-3">
              <summary className="cursor-pointer text-gray-500 text-xs hover:text-gray-700">
                🔍 Debug Information
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto border">
                {JSON.stringify(message, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form
        className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            console.log("Sending message:", input);
            console.log("Current messages before sending:", messages.length);

            try {
              sendMessage({ text: input });
              setInput("");
            } catch (error) {
              console.error("Error in sendMessage:", error);
              console.error(
                "Error details:",
                JSON.stringify(error, Object.getOwnPropertyNames(error)),
              );
            }
          }
        }}
      >
        <div className="max-w-4xl mx-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center mb-2 text-blue-600">
              <div className="animate-pulse">
                🤖 AI is thinking and responding...
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              value={input}
              disabled={status !== "ready"}
              placeholder="Type your message here..."
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={status !== "ready" || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {status === "ready"
              ? "Ready to chat"
              : status === "streaming"
                ? "Streaming response..."
                : status === "submitted"
                  ? "Processing..."
                  : `Status: ${status}`}
          </div>
        </div>
      </form>
    </div>
  );
}
