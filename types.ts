
export enum EmailStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
  IMPORTANT = 'IMPORTANT',
  TRASH = 'TRASH',
  DRAFT = 'DRAFT',
  SNOOZED = 'SNOOZED',
}

export type MailboxView = 'INBOX' | 'SENT' | 'DRAFTS' | 'IMPORTANT' | 'TRASH' | 'SNOOZED' | 'CALENDAR' | 'SETTINGS';
export type EmailCategory = 'PRIMARY' | 'PROMOTIONS' | 'UPDATES';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  description?: string;
}

export interface Email {
  id: string;
  sender: string;
  sender_email: string;
  recipient_email?: string;
  subject: string;
  body: string;
  summary?: string;
  timestamp: string;
  status: EmailStatus;
  category?: EmailCategory;
  snoozedUntil?: string;
  attachments?: string[];
  detectedTasks?: DetectedTask[];
}

export type DetectedTaskType = 'REMINDER' | 'EVENT' | 'DEADLINE';

export interface DetectedTask {
  type: DetectedTaskType;
  description: string;
  date?: string; // ISO 8601 format
}

export enum MessageAuthor {
  USER = 'USER',
  AI = 'AI',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

export enum AIAction {
    FIND_EMAILS = 'FIND_EMAILS',
    SUMMARIZE_EMAILS = 'SUMMARIZE_EMAILS',
    ARCHIVE_EMAIL = 'ARCHIVE_EMAIL',
    DELETE_EMAIL = 'DELETE_EMAIL',
    SNOOZE_EMAIL = 'SNOOZE_EMAIL',
    MARK_AS_READ = 'MARK_AS_READ',
    MARK_AS_UNREAD = 'MARK_AS_UNREAD',
    MARK_AS_IMPORTANT = 'MARK_AS_IMPORTANT',
    ANSWER_QUESTION_FROM_EMAIL = 'ANSWER_QUESTION_FROM_EMAIL',
    REPLY_TO_EMAIL = 'REPLY_TO_EMAIL',
    FORWARD_EMAIL = 'FORWARD_EMAIL',
    SEND_EMAIL = 'SEND_EMAIL',
    CREATE_DRAFT = 'CREATE_DRAFT',
    EDIT_DRAFT = 'EDIT_DRAFT',
    OPEN_COMPOSE_MODAL = 'OPEN_COMPOSE_MODAL',
    CHANGE_VIEW = 'CHANGE_VIEW',
    NO_ACTION = 'NO_ACTION',
}

export interface AIActionParameter {
    // Search & Targeting
    sender?: string;
    subject?: string;
    keyword?:string;
    emailId?: string;
    // Summary & Q&A
    summary_scope?: 'UNREAD' | 'ALL' | 'IMPORTANT';
    question?: string;
    // Composition
    recipient_email?: string;
    email_subject?: string;
    email_body?: string;
    reply_content?: string;
    forwarding_message?: string;
    attachments?: string[];
    // View Change
    target_view?: MailboxView;
    // Snoozing
    snooze_until?: string; // ISO 8601 date string
}

export interface AIActionRequest {
    action: AIAction;
    parameters?: AIActionParameter;
}

export interface AIActionResponse {
    actions: AIActionRequest[];
    thought: string;
    response_message: string;
}

export interface AISearchCriteria {
    sender?: string;
    subject?: string;
    keyword?: string; // for body
    isUnread?: boolean;
    hasAttachment?: boolean;
}

// --- App Settings ---
export type Theme = 'dark' | 'light';
export type AgentPersonality = 'Professional' | 'Casual & Friendly' | 'Witty & Sarcastic';

export interface AgentConfig {
    personality: AgentPersonality;
    enableQuickReplies: boolean;
    enableSummarization: boolean;
}

export interface Account {
    email: string;
    provider: string;
}

// --- Agentic Triage & Rules ---
export type TriageAction = 'DELETE' | 'ARCHIVE';

export interface ActionLogEntry {
    action: TriageAction;
    emailId: string;
    sender: string;
    timestamp: number;
}

export interface TriageRule {
    id: string;
    sender: string;
    action: TriageAction;
}
