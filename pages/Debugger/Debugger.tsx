

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronDown, ChevronRight, Terminal, BookOpen, Bot, Clock, Hash, MessageSquare, Play, Loader2, Beaker, AlertCircle, Maximize2 } from 'lucide-react';
import { Input, Button, Badge, cn, Modal } from '../../components/UI';
import { MOCK_TEST_EXECUTIONS } from '../../services/mockData';
import { fetchConversation, fetchConversationEvents, transformMessagesToDebuggerData, getRelevantMessagesForDebug, extractToolUsages, enrichAssistantsWithConfig, DebuggerAssistant, GuardrailCheck, KnowledgeGroup, ToolUsage } from '../../services/api';

// --- Mock Data for Debugger ---

const TRACE_METADATA = {
  conversationId: 'AC57bed091a6a4108cf257065048c0c344',
  rootMessageId: 'MG99123847102938',
  timestamp: new Date().toISOString(),
};

const MOCK_GUARDRAILS: GuardrailCheck[] = [
  { id: 'hasGreeting', name: 'Has Greeting', description: 'Does the email contain a greeting?', status: true, score: 0.9 },
  { id: 'isTwilioRelated', name: 'Is Twilio Related', description: 'Is this email about Twilio products or services?', status: true, score: 0.9 },
  { id: 'notRobotic', name: 'Not Robotic', description: 'Does the email sound natural and human-like?', status: true, score: 0.9 },
  { id: 'isEnglish', name: 'Is English', description: 'Is this response written in English?', status: true, score: 0.9 },
  { id: 'noIsaScheduling', name: 'No ISA Scheduling', description: 'Does the email avoid offering ISA to personally schedule?', status: true, score: 0.9 },
  { id: 'noSynchronousHumanInteraction', name: 'No Synchronous Human Interaction', description: 'Does the email avoid suggesting synchronous calls/demos?', status: true, score: 0.9 },
  { id: 'comprehensiveValue', name: 'Comprehensive Value', description: 'Does this email provide comprehensive, valuable information?', status: true, score: 0.9 },
  { id: 'linksRelevant', name: 'Links Relevant', description: 'Are the links relevant to the conversation?', status: true, score: 0.9 },
  { id: 'isWellFormed', name: 'Is Well Formed', description: 'Is the email professionally formatted?', status: true, score: 0.9 },
];

const MOCK_KNOWLEDGE_GROUPS = [
  {
    name: 'Twilio Toll-Free Verification Guidelines',
    chunks: [
      "Twilio Toll-Free numbers must be verified to send SMS/MMS. Unverified numbers are blocked.",
      "Error 30513 indicates that the message was filtered by the carrier due to unverified status.",
      "Opt-in language must be clear, giving the end-user specific details on what they are signing up for.",
      "High-risk categories like debt collection or gambling are strictly prohibited on Toll-Free channels.",
      "Ensure your privacy policy is publicly accessible and explicitly mentioned in the opt-in flow."
    ]
  },
  {
    name: 'twilio-org',
    chunks: [
      "Verification requires submission of business details, use case, and opt-in workflow images.",
      "Processing time for Toll-Free verification is typically 3-5 business days depending on volume.",
      "You can check the verification status in the Trust Hub section of the Twilio Console.",
      "If your submission is rejected, you will receive an email with specific reasons and next steps.",
      "Resubmitting a verification request resets the queue position, so ensure accuracy before sending."
    ]
  }
];

// --- Schemas ---
const SCHEMA_ESCALATION = JSON.stringify({
    "name": "submit_intent_analysis",
    "description": "Submits the structured analysis of customer intent and a summary based on a conversation thread.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "committed_use": {
                "type": "object",
                "description": "Assessment of whether the customer is interested in a committed use agreement.",
                "properties": {
                    "value": { "type": "boolean", "description": "True if interest is detected, otherwise false." },
                    "reason": { "type": "string", "description": "The explanation for the assessment value." }
                },
                "additionalProperties": false,
                "required": ["value", "reason"]
            },
            "custom_porting": {
                "type": "object",
                "description": "Assessment of whether the customer requires custom or special porting.",
                "properties": {
                    "value": { "type": "boolean", "description": "True if interest is detected, otherwise false." },
                    "reason": { "type": "string", "description": "The explanation for the assessment value." }
                },
                "additionalProperties": false,
                "required": ["value", "reason"]
            },
            "thread_summary": { "type": "string", "description": "A concise summary of the context, requests, and details present in the conversation thread." },
            "sip_trunk_increase": {
                "type": "object",
                "description": "Assessment of whether the customer wants to increase SIP trunks or CPS.",
                "properties": {
                    "value": { "type": "boolean", "description": "True if interest is detected, otherwise false." },
                    "reason": { "type": "string", "description": "The explanation for the assessment value." }
                },
                "additionalProperties": false,
                "required": ["value", "reason"]
            },
            "proserv_interest_detected": {
                "type": "object",
                "description": "Assessment of whether the customer has indicated interest in purchasing professional services.",
                "properties": {
                    "value": { "type": "boolean", "description": "True if interest is detected, otherwise false." },
                    "reason": { "type": "string", "description": "The explanation for the assessment value." }
                },
                "additionalProperties": false,
                "required": ["value", "reason"]
            },
            "_debug_metadata": {
                "type": "object",
                "description": "Internal metadata regarding the analysis execution.",
                "properties": {
                    "last_run": { "type": "string", "description": "The timestamp of when the analysis was last run." },
                    "status": { "type": "string", "description": "The operational status of the analysis run (e.g., 'fresh')." }
                },
                "additionalProperties": false,
                "required": ["last_run", "status"]
            }
        },
        "additionalProperties": false,
        "required": [
            "committed_use",
            "custom_porting",
            "thread_summary",
            "sip_trunk_increase",
            "proserv_interest_detected",
            "_debug_metadata"
        ]
    }
}, null, 2);

const SCHEMA_PROMPT_BUILDER = JSON.stringify({
    "name": "generate_system_prompt",
    "description": "Constructs a system prompt.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "system_prompt": { "type": "string", "description": "The generated prompt text." },
            "reasoning": { "type": "string", "description": "Explanation of the prompt strategy." }
        },
        "required": ["system_prompt", "reasoning"],
        "additionalProperties": false
    }
}, null, 2);

const SCHEMA_TOOL_EXEC = JSON.stringify({
    "name": "execute_tool",
    "description": "Result of tool execution.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "status": { "type": "string", "enum": ["success", "failed"] },
            "data": { "type": "object", "additionalProperties": true }
        },
        "required": ["status", "data"],
        "additionalProperties": false
    }
}, null, 2);

const SCHEMA_GUARDRAIL = JSON.stringify({
    "name": "guardrail_check",
    "description": "Validation result of the response.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "status": { "type": "string", "enum": ["passed", "failed"] },
            "score": { "type": "number" },
            "checks": { 
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "check": { "type": "string" },
                        "passed": { "type": "boolean" }
                    },
                    "required": ["check", "passed"],
                    "additionalProperties": false
                }
            }
        },
        "required": ["status", "score", "checks"],
        "additionalProperties": false
    }
}, null, 2);

const SCHEMA_STATE = JSON.stringify({
    "name": "update_state",
    "description": "Updates conversation state.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "conversation_id": { "type": "string" },
            "status": { "type": "string" },
            "last_action": { "type": "string" },
            "timestamp": { "type": "string" }
        },
        "required": ["conversation_id", "status", "last_action", "timestamp"],
        "additionalProperties": false
    }
}, null, 2);

const SCHEMA_FINAL = JSON.stringify({
    "name": "generate_html_email",
    "description": "Generates the final HTML email.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "email_html_body": { "type": "string" }
        },
        "required": ["email_html_body"],
        "additionalProperties": false
    }
}, null, 2);

const ALL_TOOLS = [
  'Toll-free verification tool',
  'Deep research tool',
  'Salesforce Lookup',
  'Policy Checker',
  'Sentiment Analyzer'
];

const ALL_KNOWLEDGE = [
  'Twilio Toll-Free Verification Guidelines',
  'twilio-org',
  'Messaging Policy',
  'Support Handbook',
  'Pricing Tiers'
];

const MOCK_ASSISTANTS: DebuggerAssistant[] = [
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

const SAMPLE_EMAIL_BODY = `
<div class="font-sans text-sm text-slate-800">
  <p class="mb-3">Hi Sarah,</p>
  <p class="mb-3">Thanks for reaching out about the rejection on your Toll-Free verification request. I see you're encountering error <strong>30513</strong>.</p>
  <p class="mb-3">This error means the carrier has filtered your messages because the number isn't fully verified yet. To resolve this, we need to clarify your opt-in language.</p>
  <p class="mb-3">Here is a checklist to fix the opt-in language:</p>
  <ul class="list-disc pl-5 mb-3 space-y-1">
    <li>Ensure the opt-in is explicitly clear about receiving messages.</li>
    <li>Include the sender name and frequency of messages.</li>
    <li>Provide links to Terms and Privacy Policy.</li>
  </ul>
  <p class="mb-3">Feel free to reply with your current opt-in language, and I can take a look before you resubmit. </p>
  <p>Best,<br>Isa</p>
</div>
`;

export const Debugger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse the ID: format is conversationId_messageId
  const [conversationId, messageId] = useMemo(() => {
    if (!id) return ['', ''];
    const parts = id.split('_');
    if (parts.length >= 2) {
      // Join all parts except the last one as conversationId (in case it contains underscores)
      const msgId = parts[parts.length - 1];
      const convId = parts.slice(0, -1).join('_');
      return [convId, msgId];
    }
    return [id, ''];
  }, [id]);
  
  const [emailSearch, setEmailSearch] = useState('');
  const [openAssistants, setOpenAssistants] = useState<Record<string, boolean>>(location.state?.openAssistants || {});
  const [assistants, setAssistants] = useState<DebuggerAssistant[]>(location.state?.assistants || MOCK_ASSISTANTS);
  const [guardrails, setGuardrails] = useState<GuardrailCheck[]>(MOCK_GUARDRAILS);
  const [guardrailReason, setGuardrailReason] = useState<string>('');
  const [guardrailScore, setGuardrailScore] = useState<number>(0.9);
  const [reasonExpanded, setReasonExpanded] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string>(SAMPLE_EMAIL_BODY);
  const [knowledgeGroups, setKnowledgeGroups] = useState<KnowledgeGroup[]>(MOCK_KNOWLEDGE_GROUPS.map(g => ({ sourceName: g.name, chunks: g.chunks.map(c => ({ title: '', preview: c })) })));
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({});
  const [toolUsages, setToolUsages] = useState<ToolUsage[]>([]);
  const [expandedTools, setExpandedTools] = useState<Record<number, boolean>>({});
  const [toolModalIndex, setToolModalIndex] = useState<number | null>(null);
  const [toolModalSection, setToolModalSection] = useState<'input' | 'output' | null>(null);
  const [assistantModalData, setAssistantModalData] = useState<{ assistantIdx: number; section: 'input' | 'output' | 'outputFormat' | 'prompt' } | null>(null);
  const [runningTests, setRunningTests] = useState<Set<number>>(new Set());
  const [isSystemRunning, setIsSystemRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversation data on mount
  useEffect(() => {
    if (!conversationId || !messageId) return;
    if (location.state?.assistants) return; // Skip if we have state from navigation
    
    const loadDebugData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const conversation = await fetchConversation(conversationId);
        const debugData = transformMessagesToDebuggerData(conversation, messageId);
        
        // Fetch events and extract tool usages
        const events = await fetchConversationEvents(conversationId);
        const relevantMessages = getRelevantMessagesForDebug(conversation.messages, messageId);
        const tools = extractToolUsages(relevantMessages, events);
        setToolUsages(tools);
        
        // Enrich assistants with config data (system prompt, tools available/used, knowledge available)
        const enrichedAssistants = await enrichAssistantsWithConfig(debugData.assistants, events);
        
        setAssistants(enrichedAssistants.length > 0 ? enrichedAssistants : MOCK_ASSISTANTS);
        setEmailSearch(debugData.userEmail);
        setGuardrails(debugData.guardrails.length > 0 ? debugData.guardrails : MOCK_GUARDRAILS);
        setGuardrailReason(debugData.guardrailReason || '');
        setGuardrailScore(debugData.guardrailScore || 0);
        setGeneratedOutput(debugData.generatedOutput || SAMPLE_EMAIL_BODY);
        if (debugData.knowledgeGroups.length > 0) {
          setKnowledgeGroups(debugData.knowledgeGroups);
        }
      } catch (err) {
        console.error('Failed to load debug data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load debug data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDebugData();
  }, [conversationId, messageId, location.state?.assistants]);

  // Determine if this is a test execution based on ID lookup in mock data OR state passed from navigation
  const isTestExecution = useMemo(() => {
    if (location.state?.isTest) return true;
    return MOCK_TEST_EXECUTIONS.some(te => te.conversationId === conversationId && te.isTest);
  }, [conversationId, location.state]);

  const toggleAssistant = (name: string) => {
    setOpenAssistants(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleInputChange = (index: number, value: string) => {
    setAssistants((prev: any[]) => {
      const next = [...prev];
      next[index] = { ...next[index], input: value };
      return next;
    });
  };

  const handleOutputFormatChange = (index: number, value: string) => {
    setAssistants((prev: any[]) => {
      const next = [...prev];
      next[index] = { ...next[index], outputFormat: value };
      return next;
    });
  };

  // Helper function to update output with timestamp
  const getUpdatedOutput = (currentOutput: string, statusLabel: string) => {
    const time = new Date().toLocaleTimeString();
    let newOutput = currentOutput;
    try {
        if (currentOutput.trim().startsWith('{')) {
            const json = JSON.parse(currentOutput);
            if (json._debug_metadata) {
                json._debug_metadata.last_run = time;
                json._debug_metadata.status = statusLabel;
            } else {
                json._debug_metadata = { last_run: time, status: statusLabel };
            }
            newOutput = JSON.stringify(json, null, 2);
        } else {
             if (newOutput.includes('<!-- Last run:')) {
                 newOutput = newOutput.replace(/<!-- Last run: .* -->/, `<!-- Last run: ${time} -->`);
             } else {
                 newOutput += `\n\n<!-- Last run: ${time} -->`;
             }
        }
    } catch (e) {
        newOutput = currentOutput + `\n\n[System] Result refreshed at ${time}`;
    }
    return newOutput;
  };

  const handleRunTest = (index: number) => {
    setRunningTests(prev => new Set(prev).add(index));
    
    // Simulate API call delay with spinner state active
    setTimeout(() => {
      // Create new state for the next page
      const nextAssistants = assistants.map((a: any) => ({ ...a }));
      
      const currentOutput = nextAssistants[index].output;
      nextAssistants[index].output = getUpdatedOutput(currentOutput, 're-run');
      
      const newId = 'AC' + Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      navigate(`/debugger/${newId}`, { 
        state: { 
          assistants: nextAssistants,
          openAssistants: openAssistants,
          isTest: true // When running a test, the new view is considered a test result
        } 
      });
      
      // setRunningTests(prev => { ... }) // Not needed due to unmount
    }, 2000); 
  };

  const handleRunFullSystem = () => {
    setIsSystemRunning(true);

    setTimeout(() => {
      const nextAssistants = assistants.map((a: any) => ({ 
          ...a,
          output: getUpdatedOutput(a.output, 'full-system-run')
      }));

      const newId = 'AC' + Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');

      navigate(`/debugger/${newId}`, { 
        state: { 
          assistants: nextAssistants,
          openAssistants: openAssistants,
          isTest: true // When running the system, the new view is considered a test result
        } 
      });
      
      setIsSystemRunning(false);
    }, 3500); // Slightly longer delay for full system run
  };

  const getAssistantsForKnowledge = (groupName: string) => {
    return assistants.filter((a: any) => a.knowledgeUsed.includes(groupName)).map((a: any) => a.name);
  };

  // Use the guardrailScore from state
  const overallScore = guardrailScore.toFixed(2);
  const isHighScore = guardrailScore > 0.85;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 h-screen overflow-y-auto bg-slate-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading debug data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 h-screen overflow-y-auto bg-slate-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Debugger</h1>
              <p className="text-slate-500 mt-1">Trace generation, guardrails, and tool usage.</p>
            </div>
            <Button 
                onClick={handleRunFullSystem} 
                disabled={isSystemRunning || runningTests.size > 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all"
                size="lg"
            >
                {isSystemRunning ? (
                    <>
                        <Loader2 size={20} className="mr-2 animate-spin" />
                        Running Trace...
                    </>
                ) : (
                    <>
                        <Play size={20} className="mr-2 fill-white" />
                        Re-run Full Trace
                    </>
                )}
            </Button>
          </div>

          {/* Context Bar (Search + Metadata) */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-2">
            
            {/* Search Area */}
            <div className="flex-1 flex gap-2 p-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  className="pl-10 bg-slate-50 border-slate-200 focus:bg-white h-10" 
                  placeholder="Search by email..." 
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => console.log('Searching', emailSearch)} className="px-6">
                Search
              </Button>
            </div>

            {/* Divider (Desktop) */}
            <div className="hidden xl:block w-px bg-slate-100 my-2"></div>
            {/* Divider (Mobile) */}
            <div className="block xl:hidden h-px bg-slate-100 mx-2"></div>

            {/* Metadata Area */}
            <div className="flex flex-wrap items-center gap-3 p-2 xl:px-4">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <MessageSquare size={14} className="text-indigo-500" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Conv</span>
                <span className="font-mono text-xs text-slate-700 select-all font-medium">{conversationId || TRACE_METADATA.conversationId}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <Hash size={14} className="text-indigo-500" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Msg</span>
                <span className="font-mono text-xs text-slate-700 select-all font-medium">{messageId || TRACE_METADATA.rootMessageId}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <Clock size={14} className="text-indigo-500" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Time</span>
                <span className="text-xs text-slate-700 font-medium">{new Date(TRACE_METADATA.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Output & Guardrails Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Output Column */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-3">
                 <h2 className="font-semibold text-slate-900">Generated Output</h2>
                 {isTestExecution && (
                   <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                     <Beaker size={12} className="mr-1" /> Test
                   </Badge>
                 )}
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                ESCALATED
              </Badge>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div 
                className="prose prose-slate prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedOutput }} 
              />
            </div>
          </div>

          {/* Guardrails Column */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex justify-between items-center">
              <h2 className="font-semibold text-slate-900">Guardrails</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Overall Score:</span>
                <span className={cn("text-sm font-bold", isHighScore ? "text-green-600" : "text-orange-600")}>{overallScore}</span>
              </div>
            </div>
            {guardrailReason && (
              <div className="border-b border-slate-100 bg-amber-50">
                <button
                  onClick={() => setReasonExpanded(!reasonExpanded)}
                  className="w-full px-6 py-3 flex items-center gap-2 text-left hover:bg-amber-100/50 transition-colors"
                >
                  {reasonExpanded ? <ChevronDown size={16} className="text-amber-600" /> : <ChevronRight size={16} className="text-amber-600" />}
                  <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Feedback</span>
                </button>
                {reasonExpanded && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{guardrailReason}</p>
                  </div>
                )}
                {!reasonExpanded && (
                  <div className="px-6 pb-3">
                    <p className="text-sm text-slate-600 line-clamp-3">{guardrailReason}</p>
                  </div>
                )}
              </div>
            )}
            <div className="p-0 overflow-y-auto flex-1">
              <div className="divide-y divide-slate-100">
                {guardrails.map((guard, idx) => (
                  <div key={guard.id || idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-semibold text-slate-900">{guard.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{guard.description}</p>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <Badge 
                        className={cn(
                          "uppercase text-[10px] w-16 justify-center", 
                          guard.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}
                      >
                        {guard.status ? 'true' : 'false'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tools & Knowledge Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Tools */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex items-center gap-2 flex-shrink-0">
              <Terminal size={18} className="text-slate-500" />
              <h2 className="font-semibold text-slate-900">Tools Used</h2>
              {toolUsages.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">{toolUsages.length} tool{toolUsages.length !== 1 ? 's' : ''}</Badge>
              )}
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {toolUsages.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8">No tools used in this execution</div>
              ) : (
                toolUsages.map((tool, idx) => {
                  const isExpanded = expandedTools[idx];
                  return (
                  <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedTools(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span className="text-sm font-medium text-slate-900">{tool.toolName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Used By</span>
                        <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5">{tool.usedBy}</Badge>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-3 space-y-3 border-t border-slate-200">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Input</p>
                            <button
                              onClick={() => { setToolModalIndex(idx); setToolModalSection('input'); }}
                              className="p-1 hover:bg-slate-200 rounded transition-colors"
                              title="Expand Input"
                            >
                              <Maximize2 size={12} className="text-slate-400" />
                            </button>
                          </div>
                          <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto max-h-48 relative">
                            <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap">
                              {JSON.stringify(tool.input, null, 2)}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Output</p>
                            <button
                              onClick={() => { setToolModalIndex(idx); setToolModalSection('output'); }}
                              className="p-1 hover:bg-slate-200 rounded transition-colors"
                              title="Expand Output"
                            >
                              <Maximize2 size={12} className="text-slate-400" />
                            </button>
                          </div>
                          <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto max-h-48 relative">
                            <pre className="text-xs text-indigo-300 font-mono whitespace-pre-wrap">
                              {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )})
              )}
            </div>
          </div>

          {/* Knowledge */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex items-center gap-2 flex-shrink-0">
              <BookOpen size={18} className="text-slate-500" />
              <h2 className="font-semibold text-slate-900">Knowledge Base</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {knowledgeGroups.map((group, groupIdx) => {
                const usedBy = getAssistantsForKnowledge(group.sourceName);
                return (
                <div key={groupIdx} className="space-y-3">
                   <div className="flex items-center justify-between">
                     <Badge variant="secondary">{group.sourceName}</Badge>
                     {usedBy.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Used By</span>
                        {usedBy.map((u: any) => (
                          <Badge key={u} variant="secondary" className="text-[10px] py-0 px-2 h-5">{u}</Badge>
                        ))}
                      </div>
                    )}
                   </div>
                   <div className="space-y-2">
                     {group.chunks.map((chunk, chunkIdx) => {
                      const chunkKey = `${groupIdx}-${chunkIdx}`;
                      const isExpanded = expandedChunks[chunkKey];
                      return (
                      <div key={chunkIdx} className="border border-slate-100 rounded bg-slate-50">
                        <button
                          onClick={() => setExpandedChunks(prev => ({ ...prev, [chunkKey]: !prev[chunkKey] }))}
                          className="w-full flex items-start gap-3 p-2 text-left hover:bg-slate-100 transition-colors"
                        >
                          {isExpanded ? <ChevronDown size={14} className="text-slate-400 mt-0.5 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            {chunk.title && (
                              <p className="text-xs font-medium text-slate-700 mb-1">{chunk.title}</p>
                            )}
                            <p className={cn("text-sm text-slate-600", !isExpanded && "line-clamp-3")}>
                              {chunk.preview}
                            </p>
                          </div>
                        </button>
                      </div>
                     )})}
                   </div>
                </div>
              )})}
            </div>
          </div>
        </div>

        {/* Assistants Trace */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex items-center gap-2">
            <Bot size={18} className="text-slate-500" />
            <h2 className="font-semibold text-slate-900">Assistants Execution Trace</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {assistants.map((assistant: any, idx: number) => {
              const isOpen = openAssistants[assistant.name];
              const isRunning = runningTests.has(idx);
              return (
                <div key={idx} className="group">
                  <button 
                    onClick={() => toggleAssistant(assistant.name)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        isOpen ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                      )}>
                        {idx + 1}
                      </div>
                      <span className="font-medium text-slate-900">{assistant.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">ID: {assistant.messageId}</span>
                       {isOpen ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 pb-6 pl-[3.25rem] animate-in slide-in-from-top-2 duration-200">
                      
                      {/* Main Trace Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        
                        {/* Left Column: Input + Prompt */}
                        <div className="flex flex-col gap-6">
                            {/* Input */}
                            <div className="flex flex-col h-[250px]">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setAssistantModalData({ assistantIdx: idx, section: 'input' })}
                                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                                    title="Expand Input"
                                  >
                                    <Maximize2 size={12} className="text-slate-400" />
                                  </button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className={cn("h-6 px-2", isRunning ? "text-slate-400" : "text-indigo-600 hover:bg-indigo-50")}
                                    onClick={(e) => { e.stopPropagation(); handleRunTest(idx); }}
                                    disabled={isRunning || isSystemRunning}
                                    title="Test this prompt"
                                  >
                                    {isRunning ? <Loader2 className="animate-spin" size={12} /> : <Play size={12} className="mr-1.5 fill-indigo-600" />} 
                                    {isRunning ? <span className="ml-1.5">Running...</span> : 'Test'}
                                  </Button>
                                </div>
                              </div>
                              <textarea 
                                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 font-mono w-full flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                                value={assistant.input}
                                onChange={(e) => handleInputChange(idx, e.target.value)}
                                spellCheck={false}
                              />
                            </div>
                            
                            {/* System Prompt */}
                            <div className="flex flex-col h-[250px]">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prompt</p>
                                <button
                                  onClick={() => setAssistantModalData({ assistantIdx: idx, section: 'prompt' })}
                                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                                  title="Expand Prompt"
                                >
                                  <Maximize2 size={12} className="text-slate-400" />
                                </button>
                              </div>
                              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-900 font-mono overflow-auto flex-1">
                                <pre className="whitespace-pre-wrap">{assistant.systemPrompt || 'No system prompt configured'}</pre>
                              </div>
                            </div>
                        </div>

                        {/* Right Column: Output + Output Format */}
                        <div className="flex flex-col gap-6">
                          {/* Output */}
                          <div className="flex flex-col h-[250px]">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output</p>
                              <button
                                onClick={() => setAssistantModalData({ assistantIdx: idx, section: 'output' })}
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                title="Expand Output"
                              >
                                <Maximize2 size={12} className="text-slate-400" />
                              </button>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900 font-mono overflow-auto flex-1 relative">
                              {(isRunning || isSystemRunning) && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                                    <span className="text-xs font-medium text-indigo-700">Generating response...</span>
                                  </div>
                                </div>
                              )}
                              <pre className="whitespace-pre-wrap">{assistant.output}</pre>
                            </div>
                          </div>
                          
                          {/* Output Format */}
                          <div className="flex flex-col h-[250px]">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output Format</p>
                              <button
                                onClick={() => setAssistantModalData({ assistantIdx: idx, section: 'outputFormat' })}
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                title="Expand Output Format"
                              >
                                <Maximize2 size={12} className="text-slate-400" />
                              </button>
                            </div>
                            <textarea 
                              className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 font-mono w-full flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                              value={assistant.outputFormat}
                              onChange={(e) => handleOutputFormatChange(idx, e.target.value)}
                              spellCheck={false}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Secondary Trace Grid: Tools & Knowledge */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Box 3: Tools */}
                        <div className="flex flex-col h-full">
                           <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tools</p>
                           <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1">
                              {/* Available Tools */}
                              <div className="p-3 bg-slate-50 border-b border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Available</p>
                                <div className="flex flex-wrap gap-2">
                                  {assistant.toolsAvailable.map((t: string) => (
                                    <Badge key={t} variant="outline" className="border-slate-200 text-slate-500 bg-white py-0.5 px-2 text-[10px]">
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {/* Used Tools */}
                              <div className="p-3 flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Used</p>
                                {assistant.toolsUsed && assistant.toolsUsed.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {assistant.toolsUsed.map((t: string) => (
                                        <Badge key={t} variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 py-1 px-2">
                                          <Terminal size={12} className="mr-1.5" /> {t}
                                        </Badge>
                                      ))}
                                    </div>
                                 ) : (
                                   <div className="text-slate-400 italic text-xs">None</div>
                                 )}
                              </div>
                           </div>
                        </div>

                        {/* Box 4: Knowledge */}
                        <div className="flex flex-col h-full">
                           <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Knowledge Base</p>
                           <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1">
                              {/* Available Knowledge */}
                              <div className="p-3 bg-slate-50 border-b border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Available</p>
                                <div className="flex flex-wrap gap-2">
                                  {assistant.knowledgeAvailable.map((k: string) => (
                                    <Badge key={k} variant="outline" className="border-slate-200 text-slate-500 bg-white py-0.5 px-2 text-[10px]">
                                      {k}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {/* Used Knowledge */}
                              <div className="p-3 flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Used</p>
                                {assistant.knowledgeUsed && assistant.knowledgeUsed.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {(Array.from(new Set(assistant.knowledgeUsed)) as string[]).map((k) => (
                                        <Badge key={k} variant="secondary" className="bg-slate-100 text-slate-700 py-1 px-2">
                                          <BookOpen size={12} className="mr-1.5" /> {k}
                                        </Badge>
                                      ))}
                                    </div>
                                 ) : (
                                   <div className="text-slate-400 italic text-xs">None</div>
                                 )}
                              </div>
                           </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Tool Details Modal */}
      <Modal 
        isOpen={toolModalIndex !== null} 
        onClose={() => { setToolModalIndex(null); setToolModalSection(null); }}
        title={toolModalIndex !== null 
          ? `${toolUsages[toolModalIndex]?.toolName}${toolModalSection ? ` - ${toolModalSection.charAt(0).toUpperCase() + toolModalSection.slice(1)}` : ''}`
          : ''}
        className="max-w-3xl"
      >
        {toolModalIndex !== null && toolUsages[toolModalIndex] && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Used By</span>
              <Badge variant="secondary" className="text-xs">{toolUsages[toolModalIndex].usedBy}</Badge>
            </div>
            {(toolModalSection === null || toolModalSection === 'input') && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Input</p>
                <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-[60vh]">
                  <pre className="text-sm text-emerald-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(toolUsages[toolModalIndex].input, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {(toolModalSection === null || toolModalSection === 'output') && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Output</p>
                <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-[60vh]">
                  <pre className="text-sm text-indigo-300 font-mono whitespace-pre-wrap">
                    {typeof toolUsages[toolModalIndex].output === 'string' 
                      ? toolUsages[toolModalIndex].output 
                      : JSON.stringify(toolUsages[toolModalIndex].output, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Assistant Section Modal */}
      <Modal 
        isOpen={assistantModalData !== null} 
        onClose={() => setAssistantModalData(null)}
        title={assistantModalData !== null 
          ? `${assistants[assistantModalData.assistantIdx]?.name} - ${
              assistantModalData.section === 'input' ? 'Input' :
              assistantModalData.section === 'output' ? 'Output' :
              assistantModalData.section === 'outputFormat' ? 'Output Format' :
              'Prompt'
            }`
          : ''}
        className="max-w-4xl"
      >
        {assistantModalData !== null && assistants[assistantModalData.assistantIdx] && (
          <div className="space-y-4">
            {assistantModalData.section === 'input' && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto max-h-[70vh]">
                <pre className="text-sm text-slate-700 font-mono whitespace-pre-wrap">
                  {assistants[assistantModalData.assistantIdx].input}
                </pre>
              </div>
            )}
            {assistantModalData.section === 'output' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 overflow-auto max-h-[70vh]">
                <pre className="text-sm text-indigo-900 font-mono whitespace-pre-wrap">
                  {assistants[assistantModalData.assistantIdx].output}
                </pre>
              </div>
            )}
            {assistantModalData.section === 'outputFormat' && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto max-h-[70vh]">
                <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap">
                  {assistants[assistantModalData.assistantIdx].outputFormat}
                </pre>
              </div>
            )}
            {assistantModalData.section === 'prompt' && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 overflow-auto max-h-[70vh]">
                <pre className="text-sm text-amber-900 font-mono whitespace-pre-wrap">
                  {assistants[assistantModalData.assistantIdx].systemPrompt || 'No system prompt configured'}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};