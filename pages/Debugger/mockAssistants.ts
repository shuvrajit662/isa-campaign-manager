import { DebuggerAssistant } from '../../services/api';
import { ALL_TOOLS, ALL_KNOWLEDGE } from './constants';
import { 
  SCHEMA_ESCALATION, 
  SCHEMA_PROMPT_BUILDER, 
  SCHEMA_TOOL_EXEC, 
  SCHEMA_GUARDRAIL, 
  SCHEMA_STATE, 
  SCHEMA_FINAL 
} from './schemas';

export const MOCK_ASSISTANTS: DebuggerAssistant[] = [
  {
    name: 'isa-escalation-assistant',
    messageId: 'MG48231948230157',
    input: `## CUSTOMER (Lead) ##

Company: [[stetdfjg]]
Industry: Unknown
Title: Unknown
Selected Product: Twilio Products
First Name: test
Country: Sweden`,
    systemPrompt: `Analyze the input for any signs of frustration, negative sentiment, or explicit requests for escalation. Output a JSON classification.`,
    outputFormat: SCHEMA_ESCALATION,
    output: `{
  "committed_use": {
    "value": false,
    "reason": "There is no mention of committed use, spending thresholds, or intent to proceed with a committed use agreement."
  },
  "custom_porting": {
    "value": false,
    "reason": "There is no mention of custom porting or special porting requirements."
  },
  "thread_summary": "The customer provided basic company information (company name: [[stetdfjg]], country: Sweden) and selected 'Twilio Products' as their product of interest. No further context, requests, or details are present in the thread.",
  "sip_trunk_increase": {
    "value": false,
    "reason": "There is no mention of SIP trunk increases or CPS increases."
  },
  "proserv_interest_detected": {
    "value": false,
    "reason": "There is no language indicating professional services purchase intent."
  },
  "_debug_metadata": {
    "last_run": "2023-10-27T10:25:00Z",
    "status": "fresh"
  }
}`,
    knowledgeUsed: [],
    toolsUsed: [],
    toolsAvailable: ALL_TOOLS,
    knowledgeAvailable: ALL_KNOWLEDGE
  },
  {
    name: 'isa-classification-assistant',
    messageId: 'MG48231948230158',
    input: `## USER INTENT ##
"Toll-free verification help"

## CONTEXT ##
User is encountering error 30513.`,
    systemPrompt: `Construct a system prompt that guides the model to be helpful, concise, and accurate regarding Twilio Toll-Free verification policies.`,
    outputFormat: SCHEMA_PROMPT_BUILDER,
    output: `System Prompt:
"You are an expert Twilio support agent specialized in messaging compliance.
Your goal is to assist the user with Toll-Free verification issues.
Be polite, direct, and use the provided knowledge base to explain Error 30513.
Do not invent policy details. If unsure, ask for the Case ID."`,
    knowledgeUsed: ['Twilio Toll-Free Verification Guidelines', 'twilio-org'],
    toolsUsed: [],
    toolsAvailable: ALL_TOOLS,
    knowledgeAvailable: ALL_KNOWLEDGE
  },
  {
    name: 'isa-core-helper-assistant',
    messageId: 'MG48231948230159',
    input: `Execute tool: 'Toll-free verification tool' with arguments: { request_id: "88291" }`,
    systemPrompt: `You are a helper assistant that executes tools and returns structured results.`,
    outputFormat: SCHEMA_TOOL_EXEC,
    output: `{
  "status": "success",
  "data": {
    "verification_status": "verified",
    "submission_date": "2023-10-25",
    "rejection_reason": null,
    "next_step": "carrier_review"
  }
}`,
    knowledgeUsed: [],
    toolsUsed: ['Toll-free verification tool', 'Deep research tool'],
    toolsAvailable: ALL_TOOLS,
    knowledgeAvailable: ALL_KNOWLEDGE
  },
  {
    name: 'isa-guardrail-assistant',
    messageId: 'MG48231948230160',
    input: `## GUARDRAIL CHECK ##
Analyze the drafted response for sales compliance.

Checklist:
1. Is pricing mentioned? No.
2. Is personal scheduling offered? No.
3. Is tone professional? Yes.`,
    systemPrompt: `You are a guardrail assistant that validates responses for compliance and quality.`,
    outputFormat: SCHEMA_GUARDRAIL,
    output: `{
  "status": "passed",
  "score": 0.98,
  "checks": [
    { "check": "Pricing", "passed": true },
    { "check": "Scheduling", "passed": true },
    { "check": "Tone", "passed": true }
  ]
}`,
    knowledgeUsed: [],
    toolsUsed: [],
    toolsAvailable: ALL_TOOLS,
    knowledgeAvailable: ALL_KNOWLEDGE
  },
  {
    name: 'isa-state-assistant',
    messageId: 'MG48231948230161',
    input: `## STATE UPDATE ##
Mark conversation as 'waiting_user'.
Log metadata for analytics.`,
    systemPrompt: `You manage conversation state transitions and metadata logging.`,
    outputFormat: SCHEMA_STATE,
    output: `{
  "conversation_id": "AC57bed091a6a4108cf257065048c0c344",
  "status": "waiting_user",
  "last_action": "email_sent",
  "timestamp": "2023-10-27T10:30:00Z"
}`,
    knowledgeUsed: [],
    toolsUsed: [],
    toolsAvailable: ALL_TOOLS,
    knowledgeAvailable: ALL_KNOWLEDGE
  },
  {
    name: 'isa-core-assistant',
    messageId: 'MG48231948230162',
    input: `## GENERATION CONTEXT ##
- User: Sarah
- Issue: Error 30513 (Unverified Number)
- Solution: Fix opt-in language in current application.`,
    systemPrompt: `Draft a response email using HTML format. Be helpful and professional.`,
    outputFormat: SCHEMA_FINAL,
    output: `<p>Hi Sarah,</p>
<p>Thanks for reaching out about the rejection on your Toll-Free verification request. I see you're encountering error <strong>30513</strong>.</p>
<p>This error means the carrier has filtered your messages because the number isn't fully verified yet. To resolve this, we need to clarify your opt-in language.</p>
...`,
    knowledgeUsed: [],
    toolsUsed: [],
    toolsAvailable: ALL_TOOLS,
    knowledgeAvailable: ALL_KNOWLEDGE
  }
];
