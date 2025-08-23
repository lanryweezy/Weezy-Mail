
import { Email, EmailStatus, EmailCategory, Subscription, SmartAttachment, QuickAction, AgenticInsight, InboxSummary } from './types';

export const MOCK_EMAILS: Email[] = [
  {
    id: 1,
    sender: 'GitHub',
    sender_email: 'noreply@github.com',
    subject: '[react-project] Your build has succeeded!',
    body: 'Your latest build for the repository react-project has successfully completed. You can view the deployment details and logs in your dashboard. Congratulations on the new update!',
    timestamp: '2024-07-29T10:00:00Z',
    status: EmailStatus.UNREAD,
    category: 'UPDATES',
  },
  {
    id: 2,
    sender: 'Vercel',
    sender_email: 'notifications@vercel.com',
    subject: 'Deployment Status: Ready',
    body: 'The deployment for your project `ai-mailbox` is now ready. The preview URL is available. All checks have passed. Thank you for using Vercel.',
    timestamp: '2024-07-29T09:30:00Z',
    status: EmailStatus.UNREAD,
    category: 'UPDATES',
  },
  {
    id: 3,
    sender: 'Elon Musk',
    sender_email: 'elon@x.com',
    subject: 'Project Starship Update',
    body: 'Team, we are making incredible progress on Starship. The next static fire test is scheduled for this Friday. All hands on deck. The future of humanity is in our hands. Ad astra!',
    timestamp: '2024-07-29T08:45:00Z',
    status: EmailStatus.READ,
    category: 'PRIMARY',
  },
  {
    id: 4,
    sender: 'Linear',
    sender_email: 'support@linear.app',
    subject: 'Your weekly project digest',
    body: 'Here is your weekly digest for the `Frontend` project. 12 issues completed, 5 new issues created. The team is on track to meet the quarterly goals. Keep up the great work!',
    timestamp: '2024-07-28T17:00:00Z',
    status: EmailStatus.READ,
    category: 'UPDATES',
  },
  {
    id: 5,
    sender: 'Notion',
    sender_email: 'team@makenotion.com',
    subject: 'New Feature: AI Autofill',
    body: 'Introducing Notion AI Autofill! Save time by automatically filling tables, databases, and more with context-aware AI. Try it now in any of your Notion pages.',
    timestamp: '2024-07-28T14:20:00Z',
    status: EmailStatus.UNREAD,
    category: 'PROMOTIONS',
  },
    {
    id: 6,
    sender: 'Jane Doe',
    sender_email: 'jane.doe@example.com',
    subject: 'Re: Project Phoenix Meeting',
    body: 'Hi team, confirming the meeting for 3 PM tomorrow to discuss the next steps for Project Phoenix. Please review the attached document beforehand. Looking forward to it.',
    timestamp: '2024-07-28T11:05:00Z',
    status: EmailStatus.ARCHIVED,
    category: 'PRIMARY',
    attachments: ['Project_Phoenix_Brief.pdf']
  },
  {
    id: 7,
    sender: 'Sam Altman',
    sender_email: 'sam@openai.com',
    subject: 'Thoughts on AGI',
    body: 'Following up on our conversation, I wanted to share some further thoughts on the path to AGI. It is crucial that we prioritize safety and alignment research as we scale our models. The societal impact will be immense.',
    timestamp: '2024-07-27T20:15:00Z',
    status: EmailStatus.IMPORTANT,
    category: 'PRIMARY',
  },
  {
    id: 8,
    sender: 'Me',
    sender_email: 'user@agentic-mailbox.com',
    recipient_email: 'team@example.com',
    subject: 'Q3 Planning Document',
    body: 'Here is the link to the Q3 planning document, let me know your thoughts.',
    timestamp: '2024-07-26T15:00:00Z',
    status: EmailStatus.DRAFT,
  },
  {
    id: 9,
    sender: 'Figma',
    sender_email: 'team@figma.com',
    subject: 'Your weekly design recap',
    body: 'A lot happened in your design files this week! Here are some highlights to get you caught up.',
    timestamp: '2024-07-25T12:00:00Z',
    status: EmailStatus.SNOOZED,
    snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Snoozed for 1 day from now
    category: 'UPDATES',
  },
];

export const createNewMockEmail = (): Email => {
    const senders = [
        {name: 'Slack', email: 'updates@slack.com', category: 'UPDATES' as EmailCategory}, 
        {name: 'Framer', email: 'team@framer.com', category: 'PROMOTIONS' as EmailCategory}, 
        {name: 'Changelog', email: 'newsletter@changelog.com', category: 'PROMOTIONS' as EmailCategory},
        {name: 'Stripe', email: 'support@stripe.com', category: 'UPDATES' as EmailCategory},
        {name: 'Alice', email: 'alice@workplace.com', category: 'PRIMARY' as EmailCategory},
    ];
    const subjects = [
        'New mention in #general', 
        'Prototype shared with you', 
        'The best of the week in open source',
        'Your monthly invoice is ready',
        'Quick question about the Q4 report'
    ];
    const bodies = [
        'You were mentioned by @bob in the #general channel. Click here to catch up.', 
        'A new prototype has been shared with your workspace. Open it in Framer to leave feedback.', 
        'Check out our weekly newsletter for the latest updates in the world of software development and open source.',
        'Your invoice for July 2024 is now available for download in your dashboard.',
        'Hey, do you have a minute to look over the numbers for the Q4 report? I think there might be a small error on page 3. Thanks, Alice.'
    ];
    const randomIdx = Math.floor(Math.random() * senders.length);

    return {
        id: Date.now(),
        sender: senders[randomIdx].name,
        sender_email: senders[randomIdx].email,
        subject: subjects[randomIdx],
        body: bodies[randomIdx],
        timestamp: new Date().toISOString(),
        status: EmailStatus.UNREAD,
        category: senders[randomIdx].category,
    };
};

// Mock data for new agentic features
export const MOCK_SUBSCRIPTIONS: Subscription[] = [
    {
        id: 'techcrunch',
        name: 'TechCrunch',
        email: 'techcrunch@techcrunch.com',
        readCount: 2,
        totalCount: 30,
        lastActivity: '2024-07-20T10:00:00Z',
        category: 'newsletter',
        isActive: true,
        source: 'TechCrunch'
    },
    {
        id: 'medium',
        name: 'Medium Digest',
        email: 'digest@medium.com',
        readCount: 0,
        totalCount: 20,
        lastActivity: '2024-07-15T08:00:00Z',
        category: 'newsletter',
        isActive: true,
        source: 'Medium Digest'
    },
    {
        id: 'aws',
        name: 'AWS Newsletter',
        email: 'newsletter@aws.amazon.com',
        readCount: 12,
        totalCount: 15,
        lastActivity: '2024-07-25T14:00:00Z',
        category: 'updates',
        isActive: true,
        source: 'AWS Updates'
    },
    {
        id: 'vercel',
        name: 'Vercel Updates',
        email: 'updates@vercel.com',
        readCount: 8,
        totalCount: 10,
        lastActivity: '2024-07-28T16:00:00Z',
        category: 'updates',
        isActive: true,
        source: 'Vercel'
    }
];

export const MOCK_SMART_ATTACHMENTS: SmartAttachment[] = [
    {
        id: 'salary-breakdown',
        name: 'Salary_Breakdown_Q3.pdf',
        type: 'PDF',
        size: 245760,
        emailId: 10,
        extractedText: 'Salary breakdown for Q3 2024...',
        suggestedActions: ['convert_to_excel', 'extract_text'],
        conversionOptions: ['xlsx', 'csv', 'docx']
    },
    {
        id: 'proposal-draft',
        name: 'Project_Proposal_Draft.docx',
        type: 'DOCX',
        size: 156800,
        emailId: 11,
        suggestedActions: ['summarize_and_send', 'create_task'],
        conversionOptions: ['pdf', 'txt']
    },
    {
        id: 'receipt-image',
        name: 'Receipt_20240729.jpg',
        type: 'IMG',
        size: 98304,
        emailId: 12,
        suggestedActions: ['extract_text', 'categorize'],
        conversionOptions: ['pdf']
    }
];

export const MOCK_QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'draft-reply',
        label: 'Draft & Send Smart Reply',
        icon: '📤',
        description: 'AI-powered reply generation',
        action: () => console.log('Draft smart reply'),
        category: 'drafting'
    },
    {
        id: 'schedule-followup',
        label: 'Schedule Follow-Up',
        icon: '📅',
        description: 'Set intelligent reminders',
        action: () => console.log('Schedule follow-up'),
        category: 'scheduling'
    },
    {
        id: 'extract-invoice',
        label: 'Extract Invoice Data',
        icon: '🧾',
        description: 'Parse invoice information',
        action: () => console.log('Extract invoice data'),
        category: 'extraction'
    },
    {
        id: 'pin-threads',
        label: 'Pin Important Threads',
        icon: '📌',
        description: 'Organize priority conversations',
        action: () => console.log('Pin threads'),
        category: 'organization'
    },
    {
        id: 'clean-inbox',
        label: 'Clean Inbox (AI Sweep)',
        icon: '🧹',
        description: 'Automated inbox organization',
        action: () => console.log('Clean inbox'),
        category: 'automation'
    },
    {
        id: 'voice-compose',
        label: 'Voice-to-Email',
        icon: '🎤',
        description: 'Dictate emails hands-free',
        action: () => console.log('Voice compose'),
        category: 'drafting'
    },
    {
        id: 'smart-categorize',
        label: 'Auto-Categorize All',
        icon: '🏷️',
        description: 'Bulk AI categorization',
        action: () => console.log('Auto categorize'),
        category: 'automation'
    },
    {
        id: 'sentiment-analysis',
        label: 'Analyze Email Tone',
        icon: '😊',
        description: 'Check emotional sentiment',
        action: () => console.log('Analyze sentiment'),
        category: 'extraction'
    }
];

export const MOCK_AGENTIC_INSIGHTS: AgenticInsight[] = [
    {
        type: 'subscription_cleanup',
        priority: 'medium',
        title: 'Subscription Cleanup',
        description: '3 newsletters with <10% engagement rate detected',
        actionable: true,
        suggestedAction: 'Auto-unsubscribe',
        relatedEmailIds: [5, 6, 7]
    },
    {
        type: 'reply_suggestion',
        priority: 'high',
        title: 'Pending Reply',
        description: 'Elon Musk email from 2 days ago needs response',
        actionable: true,
        suggestedAction: 'Draft Reply',
        relatedEmailIds: [3]
    },
    {
        type: 'file_conversion',
        priority: 'low',
        title: 'File Format Optimization',
        description: '2 PDFs can be converted to preferred Excel format',
        actionable: true,
        suggestedAction: 'Convert Files',
        relatedEmailIds: [10, 12]
    },
    {
        type: 'follow_up_needed',
        priority: 'medium',
        title: 'Follow-up Reminder',
        description: 'Project proposal sent 1 week ago - no response',
        actionable: true,
        suggestedAction: 'Send Follow-up',
        relatedEmailIds: [8]
    }
];

export const MOCK_INBOX_SUMMARY: InboxSummary = {
    urgentCount: 3,
    actionItemsCount: 7,
    unreadNewsletters: 12,
    filesForConversion: 2,
    overdueReplies: 4,
    scheduledEmails: 1
};
