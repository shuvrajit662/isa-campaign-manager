import { GuardrailCheck, DebuggerAssistant, KnowledgeGroup } from '../../services/api';

// --- Trace Metadata ---
export const TRACE_METADATA = {
  conversationId: 'AC57bed091a6a4108cf257065048c0c344',
  rootMessageId: 'MG99123847102938',
  timestamp: new Date().toISOString(),
};

// --- Mock Guardrails ---
export const MOCK_GUARDRAILS: GuardrailCheck[] = [
  { id: 'hasGreeting', name: 'Has Greeting', description: 'Does the email contain a greeting?', status: 'pass' },
  { id: 'isTwilioRelated', name: 'Is Twilio Related', description: 'Is this email about Twilio products or services?', status: 'pass' },
  { id: 'isRobotic', name: 'Not Robotic', description: 'Does the email sound natural and human-like?', status: 'pass', reasoning: 'The email sounds natural with varied sentence rhythm and direct statements.' },
  { id: 'isPreferredLanguageUsed', name: 'Preferred Language Used', description: "Is the email written in the customer's preferred language?", status: 'pass' },
  { id: 'isaScheduling', name: 'No ISA Scheduling', description: 'Does the email avoid offering ISA to personally schedule?', status: 'pass' },
  { id: 'synchronousHumanInteraction', name: 'No Synchronous Human Interaction', description: 'Does the email avoid suggesting synchronous calls/demos?', status: 'pass' },
  { id: 'comprehensiveValue', name: 'Comprehensive Value', description: 'Does this email provide comprehensive, valuable information?', status: 'pass' },
  { id: 'linksRelevant', name: 'Links Relevant', description: 'Are the links relevant to the conversation?', status: 'pass' },
  { id: 'isWellFormed', name: 'Is Well Formed', description: 'Is the email professionally formatted?', status: 'pass' },
  { id: 'htmlFormattingCompliant', name: 'HTML Formatting', description: 'Is the email content properly wrapped in <div> tags?', status: 'pass' },
  { id: 'dsrIntro', name: 'DSR Introduction', description: 'Does this DSR introduction email start with a brief introduction?', status: 'not_applicable' },
  { id: 'dsrNoPricing', name: 'DSR No Pricing', description: 'Does this DSR introduction email avoid mentioning pricing?', status: 'not_applicable' },
  { id: 'dsrNoResources', name: 'DSR No Resources', description: 'Does this DSR introduction email avoid sharing documentation links?', status: 'not_applicable' },
  { id: 'dsrCsatInclusion', name: 'DSR CSAT Inclusion', description: 'Does this DSR introduction email include a CSAT survey request?', status: 'not_applicable' },
];

// --- Mock Knowledge Groups ---
export const MOCK_KNOWLEDGE_GROUPS: KnowledgeGroup[] = [
  {
    sourceName: 'Twilio Toll-Free Verification Guidelines',
    chunks: [
      { title: '', preview: "Twilio Toll-Free numbers must be verified to send SMS/MMS. Unverified numbers are blocked." },
      { title: '', preview: "Error 30513 indicates that the message was filtered by the carrier due to unverified status." },
      { title: '', preview: "Opt-in language must be clear, giving the end-user specific details on what they are signing up for." },
      { title: '', preview: "High-risk categories like debt collection or gambling are strictly prohibited on Toll-Free channels." },
      { title: '', preview: "Ensure your privacy policy is publicly accessible and explicitly mentioned in the opt-in flow." }
    ]
  },
  {
    sourceName: 'twilio-org',
    chunks: [
      { title: '', preview: "Verification requires submission of business details, use case, and opt-in workflow images." },
      { title: '', preview: "Processing time for Toll-Free verification is typically 3-5 business days depending on volume." },
      { title: '', preview: "You can check the verification status in the Trust Hub section of the Twilio Console." },
      { title: '', preview: "If your submission is rejected, you will receive an email with specific reasons and next steps." },
      { title: '', preview: "Resubmitting a verification request resets the queue position, so ensure accuracy before sending." }
    ]
  }
];

// --- All Available Tools & Knowledge ---
export const ALL_TOOLS = [
  'Toll-free verification tool',
  'Deep research tool',
  'Salesforce Lookup',
  'Policy Checker',
  'Sentiment Analyzer'
];

export const ALL_KNOWLEDGE = [
  'Twilio Toll-Free Verification Guidelines',
  'twilio-org',
  'Messaging Policy',
  'Support Handbook',
  'Pricing Tiers'
];

// --- Sample Email Body ---
export const SAMPLE_EMAIL_BODY = `
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
