

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

// API Prompt types
export interface PromptTag {
  id: string;
  name: string;
  color?: string;
}

export interface APIPrompt {
  id: string;
  type: string;
  name: string;
  description: string;
  template: string;
  tags: PromptTag[];
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  isActive?: boolean;
}

export interface PromptsResponse {
  prompts: APIPrompt[];
  page?: {
    total?: number;
    offset?: number;
    limit?: number;
  };
  pagination?: {
    total?: number;
    offset?: number;
    limit?: number;
    hasMore?: boolean;
  };
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