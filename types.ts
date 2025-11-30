

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  assignedCampaigns: string[];
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
}

export interface ThreadItem {
  id: string;
  sender: string;
  senderEmail: string;
  recipient: string;
  body: string;
  timestamp: string;
  avatarColor?: string;
}

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  snippet: string;
  body: string; // HTML content or latest message
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  labels: string[];
  avatarColor?: string;
  campaignId?: string; // Links email to a campaign
  thread?: ThreadItem[]; // Full conversation history
  isEscalated?: boolean;
  isCompleted?: boolean;
  csat?: {
    score: number;
    comment: string;
  };
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lastEdited: string;
}

export interface TestExecution {
  id: string;
  email: string;
  conversationId: string;
  messageId: string;
  executionType: 'Full Trace' | 'Assistant Run';
  assistantName?: string;
  timestamp: string;
  isTest?: boolean;
}

export enum FolderType {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  TRASH = 'trash'
}