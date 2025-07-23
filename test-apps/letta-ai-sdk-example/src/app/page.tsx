'use server';

import {cookies} from "next/headers";
import {
    convertToAiSdkMessage,
    lettaCloud,
    loadDefaultProject,
    loadDefaultTemplate
} from "@letta-ai/vercel-ai-sdk-provider";
import {Chat} from "@/app/Chat";


async function getAgentId() {
    const cookie = await cookies()
    const activeAgentId = cookie.get('active-agent');

    if (activeAgentId) {
        return activeAgentId.value
    }

    if (!loadDefaultProject) {
        throw new Error('Missing LETTA_DEFAULT_PROJECT_ID environment variable');
    }

    if (!loadDefaultTemplate) {
        throw new Error('Missing LETTA_DEFAULT_TEMPLATE_NAME environment variable');
    }

    const response = await lettaCloud.client.templates.agents.create(loadDefaultProject, loadDefaultTemplate)

    const nextActiveAgentId = response.agents[0].id;

    return nextActiveAgentId;
}

async function getExistingMessages(agentId: string) {
    return convertToAiSdkMessage(await lettaCloud.client.agents.messages.list(agentId), {allowMessageTypes: ['user_message', 'assistant_message']});
}

async function saveAgentIdCookie(agentId: string) {
    'use server'
    const cookie = await cookies();
    await cookie.set('active-agent', agentId, {path: '/'});
}

export default async function Homepage() {
    const agentId = await getAgentId();
    const existingMessages = await getExistingMessages(agentId);

    return <Chat existingMessages={existingMessages} saveAgentIdCookie={saveAgentIdCookie} agentId={agentId}/>
}