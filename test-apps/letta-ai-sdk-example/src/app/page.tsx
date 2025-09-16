"use server";

import { cookies } from "next/headers";
import {
  convertToAiSdkMessage,
  lettaCloud,
  lettaLocal,
} from "@letta-ai/vercel-ai-sdk-provider";
import { Chat } from "@/app/Chat";
import { TEST_MODE } from "@/app/env-vars";

async function getAgentId() {
  const cookie = await cookies();
  const activeAgentId = cookie.get("active-agent");

  if (activeAgentId) {
    return activeAgentId.value;
  }

  // For demo purposes, use a hardcoded agent ID
  // In production, you would create agents dynamically
  if (TEST_MODE === "local") {
    return "local-demo-agent-123";
  } else {
    return "agent-4347ca82-3af0-40ef-99a0-e6b74f84faf1";
  }
}

async function getExistingMessages(agentId: string) {
  try {
    return TEST_MODE === "local"
      ? convertToAiSdkMessage(
          await lettaLocal.client.agents.messages.list(agentId),
          { allowMessageTypes: ["user_message", "assistant_message"] },
        )
      : convertToAiSdkMessage(
          await lettaCloud.client.agents.messages.list(agentId),
          { allowMessageTypes: ["user_message", "assistant_message"] },
        );
  } catch (error) {
    console.log("Error fetching messages:", error);
    return [];
  }
}

async function saveAgentIdCookie(agentId: string) {
  "use server";
  const cookie = await cookies();
  await cookie.set("active-agent", agentId, { path: "/" });
}

export default async function Homepage() {
  const agentId = await getAgentId();
  console.log("agentId", agentId);
  const existingMessages = await getExistingMessages(agentId);

  return (
    <Chat
      existingMessages={existingMessages}
      saveAgentIdCookie={saveAgentIdCookie}
      agentId={agentId}
    />
  );
}
