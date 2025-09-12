import { GoogleGenAI, Type } from "@google/genai";
import { Email, AIActionResponse, ChatMessage, MessageAuthor, MailboxView, AIAction, EmailCategory, AISearchCriteria, AgentPersonality } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const actionSchema = {
    type: Type.OBJECT,
    properties: {
        actions: {
            type: Type.ARRAY,
            description: "An array of one or more actions to execute in sequence.",
            items: {
                type: Type.OBJECT,
                properties: {
                    action: {
                        type: Type.STRING,
                        enum: ['FIND_EMAILS', 'SUMMARIZE_EMAILS', 'ARCHIVE_EMAIL', 'DELETE_EMAIL', 'SNOOZE_EMAIL', 'MARK_AS_READ', 'MARK_AS_UNREAD', 'MARK_AS_IMPORTANT', 'ANSWER_QUESTION_FROM_EMAIL', 'REPLY_TO_EMAIL', 'FORWARD_EMAIL', 'SEND_EMAIL', 'CREATE_DRAFT', 'EDIT_DRAFT', 'OPEN_COMPOSE_MODAL', 'CHANGE_VIEW', 'NO_ACTION'],
                        description: 'The single most appropriate action to take. If no specific action can be taken, return NO_ACTION.',
                    },
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            sender: { type: Type.STRING, description: 'The sender of an email to search for.' },
                            subject: { type: Type.STRING, description: 'Keywords in the subject of an email to search for.' },
                            keyword: { type: Type.STRING, description: 'A keyword to search for in an email body.' },
                            emailId: { type: Type.INTEGER, description: 'The unique ID of a specific email to act upon. Required for most actions. If not specified by user, infer from context (e.g., the currently selected email).' },
                            summary_scope: { type: Type.STRING, enum: ['UNREAD', 'ALL', 'IMPORTANT'], description: 'The scope of emails to summarize.' },
                            question: { type: Type.STRING, description: 'A specific question to answer from the body of an email.' },
                            recipient_email: { type: Type.STRING, description: 'The recipient email address.' },
                            email_subject: { type: Type.STRING, description: 'The subject line for a new email.' },
                            email_body: { type: Type.STRING, description: 'The body content for a new email.' },
                            reply_content: { type: Type.STRING, description: 'The content of the reply for a reply action.' },
                            forwarding_message: { type: Type.STRING, description: 'An optional introductory message to add when forwarding an email.' },
                            attachments: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of filenames to attach to the email.'},
                            target_view: { type: Type.STRING, enum: ['INBOX', 'SENT', 'DRAFTS', 'IMPORTANT', 'TRASH', 'SNOOZED'], description: 'The mailbox view to switch to.'},
                            snooze_until: { type: Type.STRING, description: 'An ISO 8601 date string for when to unsnooze the email. You must convert natural language (e.g., "tomorrow at 9am") into this format.'}
                        },
                        nullable: true
                    }
                },
                required: ['action']
            }
        },
        thought: {
            type: Type.STRING,
            description: 'Your reasoning for choosing this action and its parameters. Explain your step-by-step interpretation of the user command and how it maps to the email context and available tools. If you are performing multiple actions, explain the logic for the sequence.'
        },
        response_message: {
            type: Type.STRING,
            description: 'A friendly, user-facing message explaining what action you took, the result of a query, or why you cannot perform an action (e.g., asking for more information).'
        }
    },
    required: ['actions', 'thought', 'response_message']
};


export const processEmailCommand = async (
    chatHistory: ChatMessage[], 
    context: { emails: Email[], selectedEmailId: number | null, currentView: MailboxView },
    personality: AgentPersonality = 'Professional'
): Promise<AIActionResponse> => {
    
    const emailContext = context.emails.map(e => ({
        id: e.id,
        from: e.sender,
        subject: e.subject,
        status: e.status,
        has_attachments: (e.attachments || []).length > 0
    }));

    const lastMessage = chatHistory[chatHistory.length -1];
    if (lastMessage.author !== MessageAuthor.USER) {
        throw new Error("Last message must be from the user.");
    }
    
    const contents = chatHistory.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    
    let personalityInstruction = '';
    switch (personality) {
        case 'Casual & Friendly':
            personalityInstruction = 'Your tone should be casual and friendly.';
            break;
        case 'Witty & Sarcastic':
            personalityInstruction = 'Your tone should be witty and slightly sarcastic, but still helpful.';
            break;
        case 'Professional':
        default:
            personalityInstruction = 'Your tone should be strictly professional and concise.';
            break;
    }

    const systemInstruction = `You are a powerful AI agent integrated into an email client. Your purpose is to help users manage their emails by converting their natural language commands into executable JSON actions.

    **PERSONALITY:** ${personalityInstruction}

    CURRENT CONTEXT:
    - Current Time: ${new Date().toISOString()}
    - Selected Email ID: ${context.selectedEmailId || 'None'}
    - Current View: ${context.currentView}
    - All Emails (summary):
      ${JSON.stringify(emailContext.slice(0, 20), null, 2)}
      (...and more)

    ACTIONS GUIDE:

    **1. Composition (Always creates drafts unless specified):**
    - \`REPLY_TO_EMAIL\`: **Use this for all replies.** Requires \`emailId\` of the original email and \`reply_content\`.
    - \`FORWARD_EMAIL\`: **Use this for all forwards.** Requires \`emailId\` of the original email and \`recipient_email\`.
    - \`CREATE_DRAFT\`: **Use ONLY for brand new emails.** Requires \`recipient_email\`, \`email_subject\`, and \`email_body\`.
    - \`SEND_EMAIL\`: Use ONLY when the user explicitly says to send immediately.
    - \`EDIT_DRAFT\`: Opens an existing draft. Requires \`emailId\`.
    - \`OPEN_COMPOSE_MODAL\`: Opens a blank compose window for the user.

    **2. Management & Information:**
    - \`DELETE_EMAIL\`, \`ARCHIVE_EMAIL\`, \`MARK_AS_READ\`/\`UNREAD\`/\`IMPORTANT\`: All require \`emailId\`.
    - \`SNOOZE_EMAIL\`: Requires \`emailId\` and \`snooze_until\` (an ISO 8601 date string you must create from user text like "tomorrow at 9am").
    - \`ANSWER_QUESTION_FROM_EMAIL\`: Answers a specific question from an email. Requires \`emailId\` and a \`question\`. The answer goes in 'response_message'.
    - \`CHANGE_VIEW\`: Switches mailbox view (e.g., to 'INBOX', 'DRAFTS').
    - \`NO_ACTION\`: Use if the command cannot be fulfilled or is unclear.

    CRITICAL RULES:
    1.  **USE THE RIGHT ACTION:** Use \`REPLY_TO_EMAIL\` for replies, not \`CREATE_DRAFT\`. \`REPLY_TO_EMAIL\` automatically creates a draft.
    2.  **INFER CONTEXT:** Use the \`selectedEmailId\` if the user says "this one", "it", etc. If no email is selected, or the command is ambiguous ("delete the github email" when there are many), ask for clarification in \`response_message\` and use \`NO_ACTION\`.
    3.  **BE PRECISE:** For \`SNOOZE_EMAIL\`, you MUST convert times like "next week" into a precise ISO 8601 timestamp.
    4.  **THINK FIRST:** Explain your reasoning in the 'thought' field before choosing actions.
    5.  **FIND AND ACT:** For commands like "find the email from Vercel and delete it," find the ID from the context, then return the \`DELETE_EMAIL\` action with that ID. If you can't find a single, specific email, ask the user.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: actionSchema,
                temperature: 0.1,
            },
        });

        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText) as AIActionResponse;
        
        if (!parsedResponse.actions || !parsedResponse.response_message) {
             throw new Error("Invalid response format from AI: missing actions or response_message.");
        }

        return parsedResponse;
        
    } catch (error) {
        console.error("Error generating content from Gemini:", error);
        const emptyResponse: AIActionResponse = {
            actions: [{ action: AIAction.NO_ACTION }],
            thought: 'An internal error occurred while contacting the AI.',
            response_message: `I'm having trouble processing that request right now. ${error instanceof Error ? error.message : ''}`
        };
        return emptyResponse;
    }
};

export const generateQuickReplies = async (email: { subject: string, body: string }): Promise<string[]> => {
    const systemInstruction = `You are an AI assistant helping a user to quickly reply to an email. Based on the email's subject and body, generate exactly 3 short, distinct, and appropriate one-sentence replies. The user is busy, so the replies should be concise and actionable. Return ONLY a JSON array of strings, with each string being a reply suggestion.

Example Input: { subject: "Lunch meeting", body: "Hey, are you free for lunch tomorrow to discuss the project?" }
Example Output: ["Sounds great, I'm available.", "I'm busy tomorrow, can we do next week?", "Yes, what time works for you?"]`;
    
    const replySchema = {
        type: Type.ARRAY,
        description: "An array of exactly 3 short reply suggestions.",
        items: {
            type: Type.STRING,
            description: 'A single, short reply suggestion.'
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: `Generate quick replies for this email:\nSubject: ${email.subject}\nBody: ${email.body}`}],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: replySchema,
                temperature: 0.7,
            },
        });
        
        const jsonText = response.text.trim();
        const replies = JSON.parse(jsonText) as string[];

        if (Array.isArray(replies) && replies.every(r => typeof r === 'string')) {
            return replies.slice(0, 3); // Ensure only 3 are returned
        } else {
            console.error("AI response for quick replies was not a string array:", replies);
            return [];
        }

    } catch (error) {
        console.error("Error generating quick replies:", error);
        return [];
    }
};

export const generateSummary = async (email: { subject: string, body: string }): Promise<string> => {
    const systemInstruction = `You are an AI assistant that summarizes emails. Create a single, concise sentence that captures the core point of the email. The summary should be very short and easy to read at a glance. Return ONLY a JSON object with a "summary" key.

Example Input: { subject: "Project Update", body: "Hi team, quick update on Project Phoenix. The new designs are in and I've attached them. Please review by EOD Friday. We are on track for the launch next month. Let me know of any blockers." }
Example Output: { "summary": "Review the new Project Phoenix designs by EOD Friday." }`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING }
        },
        required: ['summary']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: `Subject: ${email.subject}\n\n${email.body.substring(0, 1000)}` }],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2,
            },
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.summary;
    } catch (error) {
        console.error("Error generating summary:", error);
        return ""; // Return empty string on error
    }
};

export const categorizeEmail = async (email: { sender: string; subject: string; body: string }): Promise<EmailCategory> => {
    const systemInstruction = `You are an email categorization AI. Classify the email into one of three categories: 
- PRIMARY: Personal or important conversations, direct messages to the user.
- PROMOTIONS: Marketing, offers, newsletters, and other bulk mail.
- UPDATES: Notifications, bills, shipping updates, and other transactional or informational messages.
Return a single JSON object with a 'category' key.`;

    const categorySchema = {
        type: Type.OBJECT,
        properties: {
            category: {
                type: Type.STRING,
                enum: ['PRIMARY', 'PROMOTIONS', 'UPDATES']
            }
        },
        required: ['category']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: `Categorize this email:\nFrom: ${email.sender}\nSubject: ${email.subject}\nBody: ${email.body.substring(0, 300)}` }],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: categorySchema,
                temperature: 0,
            },
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.category as EmailCategory;
    } catch (error) {
        console.error("Error categorizing email:", error);
        return 'PRIMARY'; // Default to primary on error
    }
};

export const processSearchQuery = async (query: string): Promise<AISearchCriteria> => {
    const systemInstruction = `You are an AI search assistant for an email client. Convert the user's natural language query into a JSON object with search criteria.
Supported keys are:
- sender (string): The sender of the email.
- subject (string): Keywords in the subject line.
- keyword (string): Keywords in the email body.
- isUnread (boolean): True if the user wants only unread emails.

- If a user mentions a person or company, it's likely a 'sender'.
- If a user mentions a topic in quotes, it's likely a 'subject'.
- If a user asks for 'unread', 'unseen', or 'new' emails, set 'isUnread' to true.
- For generic terms, use 'keyword' to search the body.
- Only return keys for criteria explicitly mentioned by the user. Do not invent criteria.`;

    const searchSchema = {
        type: Type.OBJECT,
        properties: {
            sender: { type: Type.STRING, nullable: true },
            subject: { type: Type.STRING, nullable: true },
            keyword: { type: Type.STRING, nullable: true },
            isUnread: { type: Type.BOOLEAN, nullable: true },
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: `Convert this search query: "${query}"` }],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: searchSchema,
                temperature: 0,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AISearchCriteria;
    } catch (error) {
        console.error("Error processing search query:", error);
        // Fallback to a simple keyword search on error
        return { keyword: query };
    }
};

export const generateSuggestedActions = async (email: Email): Promise<string[]> => {
    const systemInstruction = `You are an AI assistant that suggests contextual actions for an email. Based on the email's content, suggest 3-5 relevant actions the user could take. The actions should be phrased as commands for another AI agent.

Examples:
- If the email is a newsletter, suggest "Unsubscribe from this newsletter".
- If it's a meeting invite, suggest "Accept meeting" or "Decline meeting".
- If it's a question, suggest "Answer this question".
- If it contains a link, suggest "Open link in browser".

Return ONLY a JSON array of strings.`;

    const schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: `From: ${email.sender}\nSubject: ${email.subject}\n\n${email.body.substring(0, 500)}` }],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7,
            },
        });
        const jsonText = response.text.trim();
        const actions = JSON.parse(jsonText) as string[];
        return actions.slice(0, 5);
    } catch (error) {
        console.error("Error generating suggested actions:", error);
        return [];
    }
};