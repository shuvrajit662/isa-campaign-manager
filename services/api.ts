// API Service for ISA Campaign Manager

import { Email, FolderType, ThreadItem } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:17823';

// Assistant IDs for filtering
const ISA_ESCALATION_ASSISTANT = 'isa-escalation-assistant';
const ISA_CORE_ASSISTANT = 'isa-core-assistant';
const ISA_GUARDRAIL_ASSISTANT = 'isa-guardrail-assistant';

// API Response Types based on Prisma schema

// Message metadata from ConversationMessageMetadata model
export interface APIMessageMetadata {
  isaExternalMessageId?: string;
  isaThreadId?: string;
  isaIsDraft?: boolean;
  isaTo?: string[];
  isaCc?: string[];
  isaBcc?: string[];
  isaSubject?: string;
  isaRawContent?: string;
  isaLoopId?: string;
}

export interface APIConversationMessage {
  id: string;
  createdAt: string;
  updatedAt: string;
  runId?: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  assistantId?: string; // The assistant that processed this message
  content?: string;
  redactedContent?: string;
  messageId?: string;
  metadata?: APIMessageMetadata;
  parts?: Array<{
    type: string;
    content?: string;
    data?: Record<string, unknown>;
  }>;
  redactedParts?: Array<{
    type: string;
    content?: string;
    data?: Record<string, unknown>;
  }>;
  retrievedKnowledge?: Array<{
    sourceId?: string;
    sourceName?: string;
    uri?: string;
    title?: string;
    preview?: string;
    badgeColor?: string;
  }>;
}

// Conversation metadata from ConversationMetadata model
export interface APIConversationMetadata {
  conversationMetadataId: string;
  isa?: {
    threadId?: string;
    leadId?: string;
    campaignId?: string;
    status?: string; // ConversationEmailStatus: RESPOND, FOLLOW_UP, ESCALATE, ESCALATED, COMPLETE
    destination?: {
      to?: string[];
    };
  };
}

export interface APIConversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  accountId: string;
  messages: APIConversationMessage[];
  metadata: APIConversationMetadata;
  type: string;
  canvas?: unknown;
  chatId?: string;
}

export interface APIConversationsResponse {
  conversations: APIConversation[];
  pagination: {
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalCount: number;
    nextPageToken?: string;
    previousPageToken?: string;
  };
}

export interface FetchConversationsParams {
  campaignId: string;
  pageSize?: number;
  pageToken?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * Fetch conversations for a campaign
 */
export async function fetchConversations(params: FetchConversationsParams): Promise<APIConversationsResponse> {
  const { campaignId, pageSize = 20, pageToken, sortBy, order } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.set('pageSize', pageSize.toString());
  if (pageToken) queryParams.set('pageToken', pageToken);
  if (sortBy) queryParams.set('sortBy', sortBy);
  if (order) queryParams.set('order', order);

  const url = `${BACKEND_URL}/v2/conversations/campaign/${campaignId}?${queryParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch a single conversation by ID
 */
export async function fetchConversation(conversationId: string): Promise<APIConversation> {
  const url = `${BACKEND_URL}/v2/conversations/${conversationId}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch conversation: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // API returns { conversation: {...} }, extract the conversation
  return data.conversation;
}

// --- Analytics Events API ---

export interface APIEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  runId: string;
  type: string;
  assistantId?: string;
  depth: number;
  elapsedTime: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  values: {
    toolId?: string;
    context?: {
      caller?: {
        type: string;
        id: string;
      };
      called?: {
        type: string;
        id: string;
      };
    };
    input?: Record<string, unknown>;
    output?: string;
    tokens?: number;
    options?: Record<string, unknown>;
    requestConfig?: Record<string, unknown>;
  };
}

export interface APIEventsResponse {
  events: APIEvent[];
}

/**
 * Fetch analytics events for a conversation
 */
export async function fetchConversationEvents(conversationId: string): Promise<APIEvent[]> {
  const url = `${BACKEND_URL}/v2/analytics/conversations/${conversationId}/events`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch conversation events: ${response.statusText}`);
  }
  
  const data: APIEventsResponse = await response.json();
  return data.events;
}

// --- Assistant Config API ---

export interface AssistantToolInstance {
  tool: {
    id: string;
    name: string;
    description: string;
  };
}

export interface AssistantKnowledgeSource {
  id: string;
  name: string;
  description: string;
}

export interface AssistantConfig {
  id: string;
  name: string;
  description: string;
  role: string;
  objective: string;
  promptSuffix: string;
  toolInstances: AssistantToolInstance[];
  knowledgeSources: AssistantKnowledgeSource[];
}

/**
 * Fetch assistant configuration by ID
 */
export async function fetchAssistantConfig(assistantId: string): Promise<AssistantConfig | null> {
  const url = `${BACKEND_URL}/v2/assistants/${assistantId}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch assistant config for ${assistantId}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    return data.assistant;
  } catch (err) {
    console.warn(`Error fetching assistant config for ${assistantId}:`, err);
    return null;
  }
}

// --- Debugger Types and Functions ---

export interface DebuggerAssistant {
  name: string;
  messageId: string;
  input: string;
  systemPrompt: string;
  outputFormat: string;
  output: string;
  knowledgeUsed: string[];
  toolsUsed: string[];
  toolsAvailable: string[];
  knowledgeAvailable: string[];
}

export interface GuardrailCheck {
  id: string;
  name: string;
  description: string;
  status: boolean;
  score?: number;
  reason?: string;
}

// Hardcoded guardrail definitions
const GUARDRAIL_DEFINITIONS: Record<string, { name: string; description: string }> = {
  allowed: {
    name: 'Allowed',
    description: 'Indicates whether the message/action is allowed to proceed.'
  },
  reason: {
    name: 'Reason',
    description: 'Provides a reason for the decision, especially if not allowed.'
  },
  score: {
    name: 'Sales Manager Score',
    description: 'The sales manager score (0.0-1.0) evaluating the overall quality of the email response.'
  },
  dsrCsatInclusion: {
    name: 'DSR CSAT Inclusion',
    description: 'Does this DSR introduction email include a customer satisfaction survey request?'
  },
  notRobotic: {
    name: 'Not Robotic',
    description: 'Does the email sound natural and human-like, not robotic or artificial?'
  },
  csatSurveyInclusion: {
    name: 'CSAT Survey Inclusion',
    description: 'Does this response include a customer satisfaction survey request with a survey link?'
  },
  isEnglish: {
    name: 'Is English',
    description: 'Is this response written in English?'
  },
  comprehensiveValue: {
    name: 'Comprehensive Value',
    description: 'Does this email provide comprehensive, valuable information that is easy to scan?'
  },
  dsrNoPricing: {
    name: 'DSR No Pricing',
    description: 'Does this DSR introduction email avoid mentioning pricing or costs?'
  },
  noSynchronousHumanInteraction: {
    name: 'No Synchronous Human Interaction',
    description: 'Does the email avoid suggesting ISA schedule synchronous calls/demos/meetings?'
  },
  isTwilioRelated: {
    name: 'Is Twilio Related',
    description: 'Is this email about Twilio products, services, or helping with Twilio-related questions?'
  },
  hasGreeting: {
    name: 'Has Greeting',
    description: 'Does the email contain a greeting (e.g., Hi There, Hello [Name])?'
  },
  isWellFormed: {
    name: 'Is Well Formed',
    description: 'Is the email professionally formatted with proper HTML structure and readability?'
  },
  linksRelevant: {
    name: 'Links Relevant',
    description: 'Are the links in the email relevant to the conversation, or are there no links?'
  },
  noIsaScheduling: {
    name: 'No ISA Scheduling',
    description: 'Does the email avoid offering ISA to personally schedule calls/demos/meetings?'
  },
  dsrIntro: {
    name: 'DSR Introduction',
    description: 'Does this DSR introduction email start with a brief introduction of the colleague?'
  },
  dsrNoResources: {
    name: 'DSR No Resources',
    description: 'Does this DSR introduction email avoid sharing documentation links or partner info?'
  }
};

export interface KnowledgeChunk {
  title: string;
  preview: string;
  uri?: string;
}

export interface KnowledgeGroup {
  sourceName: string;
  chunks: KnowledgeChunk[];
}

export interface ToolUsage {
  toolId: string;
  toolName: string;
  usedBy: string;
  input: Record<string, unknown>;
  output: string | Record<string, unknown>;
}

export interface DebuggerData {
  conversationId: string;
  messageId: string;
  assistants: DebuggerAssistant[];
  userEmail: string;
  guardrails: GuardrailCheck[];
  guardrailReason: string;
  guardrailScore: number;
  generatedOutput: string;
  knowledgeGroups: KnowledgeGroup[];
}

/**
 * Get the relevant messages for debugging
 * Starting from the target message, go backwards to find all messages in the same execution flow.
 * An execution flow is defined as a sequence of messages where each message is within a short time window
 * of the previous one (indicating they are part of the same pipeline execution).
 * 
 * The algorithm:
 * 1. Find the target message
 * 2. Get its runId
 * 3. Go backwards to find the first message that shares the same runId OR is temporally close (within 60 seconds)
 *    and part of the assistant pipeline
 * 4. Return all messages from that point to the target
 */
export function getRelevantMessagesForDebug(
  messages: APIConversationMessage[] | undefined,
  targetMessageId: string
): APIConversationMessage[] {
  // Safety check for undefined or empty messages
  if (!messages || messages.length === 0) {
    console.warn('No messages in conversation');
    return [];
  }
  
  // Find the index of the target message
  const j = messages.findIndex(m => m.id === targetMessageId);
  
  if (j === -1) {
    console.warn(`Message ${targetMessageId} not found in conversation`);
    return [];
  }
  
  const targetMessage = messages[j];
  const targetTimestamp = new Date(targetMessage.createdAt).getTime();
  
  // Go backwards to find the start of this execution flow
  // We consider messages part of the same flow if:
  // 1. They are close in time (within 120 seconds of the target - allows for full pipeline execution)
  // 2. They are not the final ASSISTANT message from isa-core-assistant from a PREVIOUS flow
  let i = j - 1;
  let foundPreviousCoreAssistantResponse = false;
  
  while (i >= 0) {
    const currentMessage = messages[i];
    const currentTimestamp = new Date(currentMessage.createdAt).getTime();
    const timeDiff = targetTimestamp - currentTimestamp;
    
    // If the message is more than 120 seconds before the target, it's likely a different flow
    if (timeDiff > 120000) {
      break;
    }
    
    // Check if this is an isa-core-assistant ASSISTANT response
    if (currentMessage.assistantId === ISA_CORE_ASSISTANT && currentMessage.role === 'ASSISTANT') {
      // If this is the first one we find AND it's not the immediate predecessor to our target's USER message,
      // it might be from a previous iteration in the same flow (e.g., guardrail rejection + retry)
      // We should include it in the trace
      if (!foundPreviousCoreAssistantResponse) {
        foundPreviousCoreAssistantResponse = true;
        // Continue to include earlier messages in the same temporal flow
      }
    }
    
    i--;
  }
  
  // Return messages from [i+1, j] inclusive
  return messages.slice(i + 1, j + 1);
}

/**
 * Transform relevant messages into debugger format
 */
export function transformMessagesToDebuggerData(
  conversation: APIConversation,
  messageId: string
): DebuggerData {
  const relevantMessages = getRelevantMessagesForDebug(conversation.messages, messageId);
  
  // Extract user email from conversation metadata
  const destination = conversation.metadata?.isa?.destination?.to;
  const userEmail = destination && destination.length > 0 ? destination[0] : 'unknown@example.com';
  
  // All available tools and knowledge (we'll populate from what we find)
  const allToolsUsed = new Set<string>();
  const allKnowledgeUsed = new Set<string>();
  
  // Transform each message into a debugger assistant entry
  const assistants: DebuggerAssistant[] = relevantMessages
    .filter(m => m.role === 'ASSISTANT')
    .map(message => {
      const assistantName = message.assistantId || 'unknown-assistant';
      
      // Extract prompt (from the USER message that triggered this assistant, or the content)
      const userMessageIndex = relevantMessages.findIndex(m => m.id === message.id) - 1;
      const userMessage = userMessageIndex >= 0 ? relevantMessages[userMessageIndex] : null;
      const prompt = userMessage?.content || message.content || '';
      
      // Extract output from parts
      let output = '';
      let outputFormat = '{}';
      
      if (message.parts && message.parts.length > 0) {
        for (const part of message.parts) {
          if (part.type === 'STRUCTURED_OUTPUT' && part.data) {
            output = JSON.stringify(part.data, null, 2);
            // Try to infer schema from the data
            outputFormat = inferSchemaFromData(part.data);
          } else if (part.type === 'MARKDOWN' && part.content) {
            output = part.content;
          }
        }
      }
      
      // Extract knowledge used
      const knowledgeUsed: string[] = [];
      if ((message as any).retrievedKnowledge) {
        for (const k of (message as any).retrievedKnowledge) {
          const name = k.sourceName || k.sourceId || 'Unknown Source';
          knowledgeUsed.push(name);
          allKnowledgeUsed.add(name);
        }
      }
      
      // Extract tools used (would need to look at parts for tool calls)
      const toolsUsed: string[] = [];
      
      return {
        name: assistantName,
        messageId: message.id,
        input: stripHtml(prompt).substring(0, 2000), // Limit input length
        systemPrompt: '', // Will be populated from assistant config
        outputFormat,
        output,
        knowledgeUsed,
        toolsUsed,
        toolsAvailable: [],
        knowledgeAvailable: []
      };
    });
  
  // Set available tools/knowledge on all assistants
  const allTools = Array.from(allToolsUsed);
  const allKnowledge = Array.from(allKnowledgeUsed);
  
  assistants.forEach(a => {
    a.toolsAvailable = allTools;
    a.knowledgeAvailable = allKnowledge;
  });
  
  // Extract guardrails data from the last isa-guardrail-assistant message
  const guardrailsData = extractGuardrailsData(relevantMessages);
  
  // Extract generated output from the last isa-core-assistant ASSISTANT message
  const generatedOutput = extractGeneratedOutput(relevantMessages);
  
  // Extract knowledge groups from all messages
  const knowledgeGroups = extractKnowledgeGroups(relevantMessages);
  
  return {
    conversationId: conversation.id,
    messageId,
    assistants,
    userEmail,
    guardrails: guardrailsData.guardrails,
    guardrailReason: guardrailsData.reason,
    guardrailScore: guardrailsData.score,
    generatedOutput,
    knowledgeGroups
  };
}

/**
 * Enrich debugger assistants with their config data (system prompt, tools available, knowledge available)
 * Also enriches with tools used from analytics events
 */
export async function enrichAssistantsWithConfig(
  assistants: DebuggerAssistant[],
  events: APIEvent[]
): Promise<DebuggerAssistant[]> {
  // Get unique assistant IDs
  const assistantIds = [...new Set(assistants.map(a => a.name))];
  
  // Fetch all assistant configs in parallel
  const configPromises = assistantIds.map(id => fetchAssistantConfig(id));
  const configs = await Promise.all(configPromises);
  
  // Create a map of assistantId -> config
  const configMap = new Map<string, AssistantConfig>();
  assistantIds.forEach((id, idx) => {
    if (configs[idx]) {
      configMap.set(id, configs[idx]!);
    }
  });
  
  // Get all runIds from the messages for tool usage lookup
  // We'll use the events to find which tools each assistant used
  const toolUsageByAssistant = new Map<string, string[]>();
  
  for (const event of events) {
    if (event.type === 'TOOL_CALL' && event.assistantId) {
      const toolId = event.values?.toolId || '';
      if (!toolUsageByAssistant.has(event.assistantId)) {
        toolUsageByAssistant.set(event.assistantId, []);
      }
      const tools = toolUsageByAssistant.get(event.assistantId)!;
      if (toolId && !tools.includes(toolId)) {
        tools.push(toolId);
      }
    }
  }
  
  // Enrich each assistant
  return assistants.map(assistant => {
    const config = configMap.get(assistant.name);
    
    // Extract tools available from config
    const toolsAvailable = config?.toolInstances?.map(ti => ti.tool?.id || ti.tool?.name || 'unknown-tool') || [];
    
    // Extract knowledge available from config  
    const knowledgeAvailable = config?.knowledgeSources?.map(ks => ks.id || ks.name || 'unknown-source') || [];
    
    // Get system prompt from config (use promptSuffix)
    const systemPrompt = config?.promptSuffix || '';
    
    // Get tools used for this assistant from events
    const toolsUsed = toolUsageByAssistant.get(assistant.name) || [];
    
    return {
      ...assistant,
      systemPrompt,
      toolsAvailable,
      knowledgeAvailable,
      toolsUsed
    };
  });
}

/**
 * Extract knowledge groups from all messages with retrievedKnowledge
 * Groups chunks by sourceName
 */
function extractKnowledgeGroups(messages: APIConversationMessage[]): KnowledgeGroup[] {
  const groupsMap = new Map<string, KnowledgeChunk[]>();
  
  for (const message of messages) {
    if (message.retrievedKnowledge && message.retrievedKnowledge.length > 0) {
      for (const knowledge of message.retrievedKnowledge) {
        const sourceName = knowledge.sourceName || 'Unknown Source';
        const chunk: KnowledgeChunk = {
          title: knowledge.title || '',
          preview: knowledge.preview || '',
          uri: knowledge.uri
        };
        
        if (!groupsMap.has(sourceName)) {
          groupsMap.set(sourceName, []);
        }
        groupsMap.get(sourceName)!.push(chunk);
      }
    }
  }
  
  // Convert map to array
  const groups: KnowledgeGroup[] = [];
  for (const [sourceName, chunks] of groupsMap) {
    groups.push({ sourceName, chunks });
  }
  
  return groups;
}

/**
 * Extract tool usages from events based on runIds from messages
 * Filters events by TOOL_CALL type and matching runIds
 */
export function extractToolUsages(
  messages: APIConversationMessage[],
  events: APIEvent[]
): ToolUsage[] {
  // Get unique runIds from the messages
  const runIds = new Set<string>();
  for (const message of messages) {
    if (message.runId) {
      runIds.add(message.runId);
    }
  }
  
  // Filter TOOL_CALL events that match the runIds
  const toolCallEvents = events.filter(
    e => e.type === 'TOOL_CALL' && runIds.has(e.runId)
  );
  
  // Transform events into ToolUsage objects
  const toolUsages: ToolUsage[] = toolCallEvents.map(event => {
    const values = event.values || {};
    const toolId = values.toolId || 'unknown-tool';
    const assistantId = event.assistantId || values.context?.caller?.id || 'Unknown Assistant';
    
    // Parse output - it may be a JSON string
    let output: string | Record<string, unknown> = values.output || '';
    if (typeof output === 'string') {
      try {
        output = JSON.parse(output);
      } catch {
        // Keep as string if not valid JSON
      }
    }
    
    return {
      toolId,
      toolName: formatToolName(toolId),
      usedBy: assistantId,
      input: values.input || {},
      output
    };
  });
  
  return toolUsages;
}

/**
 * Format tool ID into a human-readable name
 */
function formatToolName(toolId: string): string {
  // Remove common prefixes
  let name = toolId.replace(/^isa-/, '');
  
  // Convert kebab-case to Title Case
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract the generated output from the last isa-core-assistant ASSISTANT message
 * Looks for MARKDOWN content in parts, or falls back to message content
 */
function extractGeneratedOutput(messages: APIConversationMessage[]): string {
  // Find the last ASSISTANT message from isa-core-assistant
  const coreAssistantMessages = messages.filter(
    m => m.role === 'ASSISTANT' && m.assistantId === ISA_CORE_ASSISTANT
  );
  
  if (coreAssistantMessages.length === 0) {
    return '';
  }
  
  const lastCoreMessage = coreAssistantMessages[coreAssistantMessages.length - 1];
  
  // Look for MARKDOWN parts first
  if (lastCoreMessage.parts) {
    for (const part of lastCoreMessage.parts) {
      if (part.type === 'MARKDOWN' && part.content) {
        return part.content;
      }
    }
  }
  
  // Fallback to message content
  return lastCoreMessage.content || '';
}

/**
 * Extract guardrails data from the last isa-guardrail-assistant message
 * Looks for ASSISTANT messages with assistantId = isa-guardrail-assistant
 * Then extracts STRUCTURED_OUTPUT parts and uses data.data
 */
function extractGuardrailsData(messages: APIConversationMessage[]): { 
  guardrails: GuardrailCheck[]; 
  reason: string; 
  score: number;
} {
  // Find the last message from isa-guardrail-assistant with role ASSISTANT
  const guardrailMessages = messages.filter(
    m => m.role === 'ASSISTANT' && m.assistantId === ISA_GUARDRAIL_ASSISTANT
  );
  
  if (guardrailMessages.length === 0) {
    return { guardrails: [], reason: '', score: 0 };
  }
  
  // Get the last guardrail message
  const lastGuardrailMessage = guardrailMessages[guardrailMessages.length - 1];
  
  // Find STRUCTURED_OUTPUT parts
  const guardrails: GuardrailCheck[] = [];
  
  // Track if we found the main score and reason
  let mainScore: number = 0;
  let mainReason: string = '';
  
  if (lastGuardrailMessage.parts) {
    for (const part of lastGuardrailMessage.parts) {
      if (part.type === 'STRUCTURED_OUTPUT' && part.data) {
        // The actual data is in data.data according to user
        const outputData = part.data.data || part.data;
        
        // First pass: extract score and reason
        if (typeof outputData === 'object' && outputData !== null) {
          if ('score' in outputData && typeof outputData.score === 'number') {
            mainScore = outputData.score;
          }
          if ('reason' in outputData && typeof outputData.reason === 'string') {
            mainReason = outputData.reason;
          }
          
          // Second pass: extract boolean guardrail checks
          for (const [key, value] of Object.entries(outputData)) {
            // Skip non-boolean fields (score, reason, allowed are handled separately or skipped)
            if (key === 'score' || key === 'reason') continue;
            
            // Get the definition for this guardrail
            const definition = GUARDRAIL_DEFINITIONS[key];
            if (!definition) continue; // Skip unknown fields
            
            if (typeof value === 'boolean') {
              guardrails.push({
                id: key,
                name: definition.name,
                description: definition.description,
                status: value
              });
            }
          }
        }
      }
    }
  }
  
  return { guardrails, reason: mainReason, score: mainScore };
}

/**
 * Infer a simple JSON schema from data
 */
function inferSchemaFromData(data: Record<string, unknown>): string {
  const schema: Record<string, any> = {
    name: 'structured_output',
    description: 'Assistant structured output',
    strict: true,
    parameters: {
      type: 'object',
      properties: {},
      required: [] as string[],
      additionalProperties: false
    }
  };
  
  for (const [key, value] of Object.entries(data)) {
    let type: string = typeof value;
    if (Array.isArray(value)) type = 'array';
    if (value === null) type = 'null';
    
    schema.parameters.properties[key] = { type };
    schema.parameters.required.push(key);
  }
  
  return JSON.stringify(schema, null, 2);
}

/**
 * Extract the latest user message content from a conversation
 */
function extractLatestUserMessage(messages: APIConversationMessage[]): { 
  content: string; 
  timestamp: string;
  subject?: string;
  to?: string[];
} | null {
  // Find the most recent USER message
  const userMessages = messages.filter(m => m.role === 'USER' && m.content);
  if (userMessages.length === 0) return null;
  
  const latestUserMessage = userMessages[userMessages.length - 1];
  
  // Strip HTML tags for snippet
  const content = latestUserMessage.content || '';
  
  return {
    content,
    timestamp: latestUserMessage.createdAt,
    subject: latestUserMessage.metadata?.isaSubject,
    to: latestUserMessage.metadata?.isaTo
  };
}

/**
 * Extract subject from the first user message metadata
 */
function extractSubject(messages: APIConversationMessage[]): string | null {
  // Look for subject in message metadata (first user message usually has it)
  for (const message of messages) {
    if (message.role === 'USER' && message.metadata?.isaSubject) {
      return message.metadata.isaSubject;
    }
  }
  return null;
}

/**
 * Extract sender email from the conversation metadata or messages
 */
function extractSenderInfo(conversation: APIConversation): { email: string; name: string } {
  // Try to get email from metadata destination
  const destination = conversation.metadata?.isa?.destination?.to;
  if (destination && destination.length > 0) {
    const email = destination[0];
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { email, name };
  }
  
  // Try to find from message metadata (isaTo field)
  for (const message of conversation.messages) {
    if (message.role === 'USER' && message.metadata?.isaTo && message.metadata.isaTo.length > 0) {
      const email = message.metadata.isaTo[0];
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return { email, name };
    }
  }
  
  // Default fallback
  return { email: 'unknown@example.com', name: 'Unknown' };
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Generate a random avatar color
 */
function getAvatarColor(seed: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Extract thread summary from classification assistant messages
 */
function extractThreadSummary(messages: APIConversationMessage[]): string | null {
  for (const message of messages) {
    if (message.role === 'ASSISTANT' && message.parts) {
      for (const part of message.parts) {
        if (part.type === 'STRUCTURED_OUTPUT' && part.data) {
          const data = part.data as Record<string, unknown>;
          if (typeof data.summary === 'string') {
            return data.summary;
          }
          if (typeof data.thread_summary === 'string') {
            return data.thread_summary;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Build thread items from conversation messages
 * - USER messages: from isa-escalation-assistant (with actual email content)
 * - ASSISTANT responses: from isa-core-assistant with MARKDOWN content
 * - Ensures proper USER > ASSISTANT alternation by pairing messages
 * - For each core-assistant ASSISTANT response, finds the most recent escalation USER message
 * - Ordered chronologically (earliest first for email-like view)
 */
function buildThreadItems(
  messages: APIConversationMessage[],
  senderInfo: { email: string; name: string }
): ThreadItem[] {
  const threadItems: ThreadItem[] = [];
  
  // Sort messages by createdAt ascending (earliest first)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Strategy: Find all isa-core-assistant ASSISTANT messages with MARKDOWN (these are the actual responses)
  // For each one, find the most recent preceding USER message from isa-escalation-assistant
  // This ensures proper USER > ASSISTANT pairing and avoids duplicate user messages from retries
  
  // Track which USER message indices have been used to avoid duplicates
  const usedUserMessageIndices = new Set<number>();
  
  // First pass: identify all core-assistant ASSISTANT messages with MARKDOWN
  const assistantResponses: Array<{ index: number; message: APIConversationMessage }> = [];
  for (let i = 0; i < sortedMessages.length; i++) {
    const message = sortedMessages[i];
    if (message.role === 'ASSISTANT' && message.assistantId === ISA_CORE_ASSISTANT && message.parts) {
      const markdownPart = message.parts.find(p => p.type === 'MARKDOWN');
      if (markdownPart && markdownPart.content) {
        assistantResponses.push({ index: i, message });
      }
    }
  }
  
  // Second pass: for each assistant response, find the most recent preceding USER message
  // from isa-escalation-assistant that hasn't been used yet
  for (const { index: assistantIndex, message: assistantMessage } of assistantResponses) {
    // Look backwards from the assistant message to find the corresponding USER message
    let userMessageIndex = -1;
    for (let i = assistantIndex - 1; i >= 0; i--) {
      const msg = sortedMessages[i];
      if (msg.role === 'USER' && msg.assistantId === ISA_ESCALATION_ASSISTANT && msg.content) {
        if (!usedUserMessageIndices.has(i)) {
          userMessageIndex = i;
          break;
        }
      }
    }
    
    // Add the USER message if found
    if (userMessageIndex >= 0) {
      const userMessage = sortedMessages[userMessageIndex];
      usedUserMessageIndices.add(userMessageIndex);
      
      threadItems.push({
        id: userMessage.id,
        sender: senderInfo.name,
        senderEmail: senderInfo.email,
        recipient: 'isa@twilio.com',
        body: userMessage.content!,
        timestamp: userMessage.createdAt,
        avatarColor: getAvatarColor(senderInfo.email)
      });
    }
    
    // Add the ASSISTANT response
    const markdownPart = assistantMessage.parts!.find(p => p.type === 'MARKDOWN');
    threadItems.push({
      id: assistantMessage.id,
      sender: 'Isa',
      senderEmail: 'isa@twilio.com',
      recipient: senderInfo.email,
      body: markdownPart!.content!,
      timestamp: assistantMessage.createdAt,
      avatarColor: 'bg-indigo-600'
    });
  }
  
  return threadItems;
}

/**
 * Transform API conversations to Email format
 */
export function transformConversationsToEmails(conversations: APIConversation[], campaignId: string): Email[] {
  return conversations.map((conv) => {
    const senderInfo = extractSenderInfo(conv);
    const threadSummary = extractThreadSummary(conv.messages);
    const emailSubject = extractSubject(conv.messages);
    
    // Build thread from messages (filtered for escalation/core assistant flow)
    const thread = buildThreadItems(conv.messages, senderInfo);
    
    // Get the latest isa-core-assistant ASSISTANT response with MARKDOWN for snippet
    const assistantMessages = conv.messages
      .filter(m => m.role === 'ASSISTANT' && m.assistantId === ISA_CORE_ASSISTANT && m.parts)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const latestAssistantMessage = assistantMessages[0];
    const markdownPart = latestAssistantMessage?.parts?.find(p => p.type === 'MARKDOWN');
    const assistantContent = markdownPart?.content || '';
    
    // Strip HTML and limit to ~2 lines (around 120 chars)
    const snippetText = stripHtml(assistantContent).substring(0, 120);
    const snippet = snippetText.length >= 120 ? snippetText.substring(0, 117) + '...' : snippetText;
    
    // Get the latest user message for timestamp
    const userMessages = conv.messages
      .filter(m => m.role === 'USER' && m.assistantId === ISA_ESCALATION_ASSISTANT && m.content)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const latestUserMessage = userMessages[0];
    
    // Use email subject from metadata, fallback to default
    const subject = emailSubject || 'Twilio Followup';
    
    // Determine status from metadata
    const status = conv.metadata?.isa?.status;
    const isEscalated = status === 'ESCALATE' || status === 'ESCALATED';
    const isCompleted = status === 'COMPLETE';

    return {
      id: conv.id,
      sender: senderInfo.name,
      senderEmail: senderInfo.email,
      recipient: 'isa@twilio.com',
      subject: subject.length > 80 ? subject.substring(0, 80) + '...' : subject,
      snippet,
      body: assistantContent,
      timestamp: latestAssistantMessage?.createdAt || latestUserMessage?.createdAt || conv.updatedAt,
      isRead: false, // Could be determined by some other logic
      isStarred: isEscalated,
      folder: FolderType.INBOX,
      labels: isEscalated ? ['Escalated'] : [],
      avatarColor: getAvatarColor(senderInfo.email),
      campaignId,
      thread,
      isEscalated,
      isCompleted
    };
  });
}
