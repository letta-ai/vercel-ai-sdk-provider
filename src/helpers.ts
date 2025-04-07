import {loadApiKey} from "@ai-sdk/provider-utils";

export const loadDefaultProject = process.env.LETTA_DEFAULT_PROJECT_SLUG || 'default-project'


export const loadDefaultTemplate = process.env.LETTA_DEFAULT_TEMPLATE_NAME;
