
import { Email, EmailStatus, EmailCategory } from './types';

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
