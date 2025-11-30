

import { Campaign, Email, FolderType, Prompt, User, TestExecution } from '../types';

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Talk to Sales', status: 'active' },
  { id: 'c2', name: 'Rapid Risers', status: 'active' },
  { id: 'c3', name: 'Toll-free verification', status: 'paused' },
  { id: 'c4', name: '10dlc', status: 'completed' },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Isa', email: 'isa@twilio.com', role: 'admin', assignedCampaigns: ['c1', 'c2', 'c3', 'c4'] },
  { id: 'u2', name: 'Bob Smith', email: 'bob@isa.com', role: 'editor', assignedCampaigns: ['c1'] },
];

export const MOCK_LABELS = [
  'Forums',
  '[Areas of Improvement]',
  'AI',
  'call handling',
  'ed/isa campaigns',
  'high spenders',
  'Rapid Riser',
  'Signal',
  'skills showcase',
  'Twilio Spend 50 - Upsell'
];

export const MOCK_PROMPTS: Prompt[] = [
  { 
    id: 'p1', 
    title: 'Cold Outreach - CEO', 
    content: "Hi {{firstName}},\n\nI noticed that {{company}} is looking to scale its marketing efforts. At Isa, we help teams like yours...", 
    tags: ['Sales', 'Cold Email'], 
    lastEdited: '2023-10-25T10:00:00Z' 
  },
  { 
    id: 'p2', 
    title: 'Follow-up #1', 
    content: "Hi {{firstName}},\n\nJust bumping this to the top of your inbox. Did you have a chance to review my previous email?", 
    tags: ['Follow-up', 'Sales'], 
    lastEdited: '2023-10-26T14:30:00Z' 
  },
];

export const MOCK_TEST_EXECUTIONS: TestExecution[] = [
  {
    id: 'te1',
    email: 'sarah@skynet.com',
    conversationId: 'AC57bed091a6a4108cf257065048c0c344',
    messageId: 'MG99123847102938',
    executionType: 'Full Trace',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isTest: true
  },
  {
    id: 'te2',
    email: 'customer@acme.inc',
    conversationId: 'AC8829103948572819203948572819',
    messageId: 'MG1029384756',
    executionType: 'Assistant Run',
    assistantName: 'Escalation Check',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isTest: true
  },
  {
    id: 'te3',
    email: 'bob@builder.com',
    conversationId: 'AC1122334455667788990011223344',
    messageId: 'MG5566778899',
    executionType: 'Assistant Run',
    assistantName: 'Prompt Builder',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isTest: true
  },
  {
    id: 'te4',
    email: 'alice@wonderland.net',
    conversationId: 'AC77441122558833669900114477',
    messageId: 'MG2255881144',
    executionType: 'Full Trace',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isTest: true
  },
  {
    id: 'te5',
    email: 'compliance@twilio.com',
    conversationId: 'AC00998877665544332211009988',
    messageId: 'MG3366992255',
    executionType: 'Assistant Run',
    assistantName: 'Sales Manager / Guardrail',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    isTest: true
  },
  {
    id: 'te6',
    email: 'security@twilio.com',
    conversationId: 'AC12312312312312312312312312',
    messageId: 'MG9879879879',
    executionType: 'Full Trace',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isTest: true
  },
  {
    id: 'te7',
    email: 'new_lead@startup.io',
    conversationId: 'AC45645645645645645645645645',
    messageId: 'MG6546546546',
    executionType: 'Assistant Run',
    assistantName: 'Core Assistant Helper',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    isTest: true
  },
  {
    id: 'te8',
    email: 'vip@enterprise.com',
    conversationId: 'AC78978978978978978978978978',
    messageId: 'MG3213213213',
    executionType: 'Full Trace',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    isTest: true
  }
];

const THREAD_1 = [
  {
    id: 't1_1',
    sender: 'Sarah Connor',
    senderEmail: 'sarah@skynet.com',
    recipient: 'isa@twilio.com',
    body: `<p>Hi Isa,</p><p>I saw your recent post about the "Talk to Sales" initiative. Is it possible to get a demo for my team?</p><p>Best,<br>Sarah</p>`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    avatarColor: 'bg-blue-500'
  },
  {
    id: 't1_2',
    sender: 'Isa',
    senderEmail: 'isa@twilio.com',
    recipient: 'sarah@skynet.com',
    body: `<p>Hi Sarah,</p><p>Absolutely! I'd be happy to walk you through it. How does Tuesday at 2 PM look for you?</p><p>Thanks,<br>Isa</p>`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5).toISOString(),
    avatarColor: 'bg-indigo-600'
  },
  {
    id: 't1_3',
    sender: 'Sarah Connor',
    senderEmail: 'sarah@skynet.com',
    recipient: 'isa@twilio.com',
    body: `<p>Tuesday works perfectly. Please send the invite.</p><p>Also, does this integrate with our existing CRMs?</p>`,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    avatarColor: 'bg-blue-500'
  }
];

export const MOCK_EMAILS: Email[] = [
  {
    id: 'e1',
    sender: 'Sarah Connor',
    senderEmail: 'sarah@skynet.com',
    recipient: 'isa@twilio.com',
    subject: 'Twilio Followup',
    snippet: 'Tuesday works perfectly. Please send the invite. Also, does this integrate...',
    body: THREAD_1[2].body,
    thread: THREAD_1,
    timestamp: THREAD_1[2].timestamp, // 5 mins ago
    isRead: false,
    isStarred: true,
    folder: FolderType.INBOX,
    labels: ['High Priority'],
    avatarColor: 'bg-blue-500',
    campaignId: 'c1'
  },
  {
    id: 'e2',
    sender: 'John Doe',
    senderEmail: 'john.doe@example.com',
    recipient: 'isa@twilio.com',
    subject: 'Twilio Followup',
    snippet: 'Can we schedule a time to discuss the Q4 goals regarding Rapid Risers?',
    body: `<p>Hi Isa,</p><p>Can we schedule a time to discuss the Q4 goals? I'm free on Tuesday.</p>`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isRead: true,
    isStarred: false,
    folder: FolderType.INBOX,
    labels: ['Work', 'Rapid Riser'],
    avatarColor: 'bg-green-500',
    campaignId: 'c2',
    isCompleted: true
  },
  {
    id: 'e3',
    sender: 'Compliance Team',
    senderEmail: 'compliance@twilio.com',
    recipient: 'isa@twilio.com',
    subject: 'Twilio Followup',
    snippet: 'Your toll-free verification request has been updated.',
    body: `<p>Hello,</p><p>Your request #88291 for Toll-free verification has moved to the next stage.</p>`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
    isStarred: false,
    folder: FolderType.INBOX,
    labels: ['Compliance'],
    avatarColor: 'bg-purple-500',
    campaignId: 'c3',
    isCompleted: true,
    csat: {
      score: 4,
      comment: "The automated verification updates were very timely and helpful."
    }
  },
  {
    id: 'e4',
    sender: 'Isa',
    senderEmail: 'isa@twilio.com',
    recipient: 'client@prospect.com',
    subject: 'Twilio Followup',
    snippet: 'Thanks for submitting your 10dlc registration details.',
    body: `<p>Thanks for taking the time to submit your details...</p>`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    isRead: true,
    isStarred: false,
    folder: FolderType.SENT,
    labels: ['10dlc'],
    avatarColor: 'bg-gray-500',
    campaignId: 'c4'
  },
  {
    id: 'e5',
    sender: 'Security Ops',
    senderEmail: 'secops@twilio.com',
    recipient: 'isa@twilio.com',
    subject: 'Suspicious Activity Detected',
    snippet: 'We noticed an unusual login attempt from IP 192.168.1.1.',
    body: `<p>Hi Isa,</p><p>We detected a login attempt from an unrecognized device in Antarctica.</p><p>If this wasn't you, please reset your credentials immediately.</p>`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    isRead: false,
    isStarred: true,
    folder: FolderType.INBOX,
    labels: ['Security', 'High Priority'],
    avatarColor: 'bg-red-600',
    isEscalated: true
  },
  {
    id: 'e6',
    sender: 'Michael Scott',
    senderEmail: 'michael@dundermifflin.com',
    recipient: 'isa@twilio.com',
    subject: 'Paper Supply Order',
    snippet: 'Just wanted to check if you need a refill on A4 paper?',
    body: `<p>Hey Isa,</p><p>Dunder Mifflin is having a sale on A4 paper. Unbeatable prices!</p><p>Let me know,</p><p>- Michael</p>`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    isRead: true,
    isStarred: false,
    folder: FolderType.INBOX,
    labels: ['Sales'],
    avatarColor: 'bg-yellow-500',
  }
];