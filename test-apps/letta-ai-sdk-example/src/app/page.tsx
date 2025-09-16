"use server";

import Link from "next/link";
import { cookies } from "next/headers";
import {
  convertToAiSdkMessage,
  lettaCloud,
  lettaLocal,
} from "@letta-ai/vercel-ai-sdk-provider";
import { Chat } from "@/app/Chat";
import { TEST_MODE, AGENT_ID } from "@/app/env-vars";

async function getAgentId() {
  // const cookie = await cookies();
  // const activeAgentId = cookie.get("active-agent");

  // if (activeAgentId) {
  //   return activeAgentId.value;
  // }

  // For demo purposes, use a hardcoded agent ID
  // In production, you would create agents dynamically
  return AGENT_ID;
}

async function getExistingMessages(agentId: string) {
  try {
    console.log("=====", TEST_MODE);
    // convertToAiSdkMessage now returns UIMessage[] instead of Message[]
    // This includes proper parts array with text, reasoning, and tool invocation parts
    return TEST_MODE === "local"
      ? convertToAiSdkMessage(
          await lettaLocal.client.agents.messages.list(agentId),
          {
            allowMessageTypes: [
              "user_message",
              "assistant_message",
              "reasoning_message",
            ],
          },
        )
      : convertToAiSdkMessage(
          await lettaCloud.client.agents.messages.list(agentId),
          {
            allowMessageTypes: [
              "user_message",
              "assistant_message",
              "reasoning_message",
            ],
          },
        );
  } catch (error) {
    console.log("Error fetching messages:", error);
    return [];
  }
}

async function saveAgentIdCookie(agentId: string) {
  "use server";
  const cookie = await cookies();
  cookie.set("active-agent", agentId, { path: "/" });
}

export default async function Homepage() {
  const agentId = await getAgentId();
  console.log("agentId", agentId);

  // existingMessages is now UIMessage[] with proper parts structure
  // Each message contains parts array with text, reasoning, and tool invocation parts
  const existingMessages = await getExistingMessages(agentId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Letta AI SDK Example
              </h1>
              <p className="text-gray-600">
                Chat with Letta agents using the Vercel AI SDK
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Basic Chat
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Features */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-3">🤖 Chat Interface</h3>
            <p className="text-gray-600 mb-4">
              Standard chat interface with Letta agent reasoning enabled. Shows
              agent-level reasoning from the Letta platform.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Agent-level reasoning display</li>
              <li>• Tool usage visualization</li>
              <li>• Message history persistence</li>
              <li>• Debug information</li>
            </ul>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">
            Technical Implementation
          </h3>
          <p className="text-blue-800 text-sm mb-3">
            This demo combines two powerful reasoning features:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900">
                extractReasoningMiddleware
              </h4>
              <p className="text-blue-700">
                Extracts reasoning tokens from language models (like
                OpenAI&apos;s o1 series) to show the model&apos;s internal
                thinking process.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">sendReasoning: true</h4>
              <p className="text-blue-700">
                Includes reasoning from the Letta agent platform, showing the
                agent&apos;s decision-making and context-aware responses.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto">
        <Chat
          existingMessages={existingMessages} // UIMessage[] format
          saveAgentIdCookie={saveAgentIdCookie}
          agentId={agentId}
        />
      </div>
    </div>
  );
}
