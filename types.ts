
export enum EmailStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
  IMPORTANT = 'IMPORTANT',
  TRASH = 'TRASH',
  DRAFT = 'DRAFT',
  SNOOZED = 'SNOOZED',
}

export type MailboxView = 'INBOX' | 'SENT' | 'DRAFTS' | 'IMPORTANT' | 'TRASH' | 'SNOOZED';
export type EmailCategory = 'PRIMARY' | 'PROMOTIONS' | 'UPDATES';

export interface Email {
  id: number;
  sender: string;
  sender_email: string;
  recipient_email?: string;
  subject: string;
  body: string;
  timestamp: string;
  status: EmailStatus;
  category?: EmailCategory;
  snoozedUntil?: string;
  attachments?: string[];
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
    // New agentic actions
    UNSUBSCRIBE_BULK = 'UNSUBSCRIBE_BULK',
    CONVERT_ATTACHMENT = 'CONVERT_ATTACHMENT',
    EXTRACT_INVOICE_DATA = 'EXTRACT_INVOICE_DATA',
    SCHEDULE_FOLLOWUP = 'SCHEDULE_FOLLOWUP',
    CLEAN_INBOX = 'CLEAN_INBOX',
    GENERATE_SUMMARY_DIGEST = 'GENERATE_SUMMARY_DIGEST',
    AUTO_CATEGORIZE = 'AUTO_CATEGORIZE',
    DETECT_ACTION_ITEMS = 'DETECT_ACTION_ITEMS',
    SMART_PRIORITIZE = 'SMART_PRIORITIZE',
}

export interface AIActionParameter {
    // Search & Targeting
    sender?: string;
    subject?: string;
    keyword?: string;
    emailId?: number;
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

// New types for enhanced agentic features
export interface Subscription {
    id: string;
    name: string;
    email: string;
    readCount: number;
    totalCount: number;
    lastActivity: string;
    category: 'newsletter' | 'promotional' | 'updates' | 'social';
    isActive: boolean;
    source: string; // e.g., "TechCrunch", "Medium Digest"
}

export interface SmartAttachment {
    id: string;
    name: string;
    type: 'PDF' | 'DOCX' | 'XLSX' | 'IMG' | 'OTHER';
    size: number;
    emailId: number;
    extractedText?: string;
    suggestedActions: AttachmentAction[];
    conversionOptions: string[];
}

export type AttachmentAction = 
    | 'convert_to_excel' 
    | 'summarize_and_send' 
    | 'extract_text' 
    | 'categorize'
    | 'create_task'
    | 'schedule_followup';

export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    description: string;
    action: () => void;
    category: 'drafting' | 'scheduling' | 'extraction' | 'organization' | 'automation';
}

export interface InboxSummary {
    urgentCount: number;
    actionItemsCount: number;
    unreadNewsletters: number;
    filesForConversion: number;
    overdueReplies: number;
    scheduledEmails: number;
}

export interface ConversationThread {
    id: string;
    subject: string;
    participants: string[];
    emailIds: number[];
    lastActivity: string;
    status: 'active' | 'resolved' | 'waiting' | 'escalated';
    aiSummary?: string;
    actionItems: string[];
}

export interface AgenticInsight {
    type: 'subscription_cleanup' | 'reply_suggestion' | 'file_conversion' | 'schedule_conflict' | 'follow_up_needed';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    actionable: boolean;
    suggestedAction?: string;
    relatedEmailIds?: number[];
}
