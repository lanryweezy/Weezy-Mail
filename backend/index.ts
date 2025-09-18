import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const TOKEN_PATH = path.join(__dirname, 'tokens.json');

// --- Token Storage Helper Functions ---
// This is a simple file-based store for demonstration.
// For a real production app, use a secure database and encrypt tokens.
const saveTokens = async (tokens: any) => {
    try {
        const data = JSON.stringify(tokens);
        await fs.writeFile(TOKEN_PATH, data);
        console.log('Tokens stored to', TOKEN_PATH);
    } catch (err) {
        console.error('Error saving tokens:', err);
    }
};

const readTokens = async (): Promise<any | null> => {
    try {
        const data = await fs.readFile(TOKEN_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // If the file doesn't exist, it's not an error, just means no tokens yet.
        if (err.code === 'ENOENT') {
            return null;
        }
        console.error('Error reading tokens:', err);
        return null;
    }
};


const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `http://localhost:${port}/api/auth/google/callback`
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

app.get('/api/auth/google', (req: Request, res: Response) => {
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
  });
  res.redirect(authorizationUrl);
});

app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    await saveTokens(tokens);

    console.log('Successfully authenticated with Google and received tokens.');
    res.redirect('/');

  } catch (error) {
    console.error('Error authenticating with Google:', error);
    res.status(500).send('Authentication failed');
  }
});

// Endpoint to check the current authentication status
app.get('/api/auth/status', async (req: Request, res: Response) => {
    const tokens = await readTokens();
    if (tokens) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
});

const getBody = (parts: any[]): string => {
    for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf8');
        }
        if (part.parts) {
            const body = getBody(part.parts);
            if (body) return body;
        }
    }
    return '';
};

app.get('/api/emails', async (req: Request, res: Response) => {
    const tokens = await readTokens();
    if (!tokens) {
        return res.status(401).json({ error: 'Not authenticated. No tokens found.' });
    }

    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
    );
    auth.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth });

    try {
        const listResponse = await gmail.users.messages.list({
            userId: 'me',
            labelIds: ['INBOX'],
            maxResults: 20,
        });

        const messages = listResponse.data.messages;
        if (!messages || messages.length === 0) {
            return res.json([]);
        }

        const emailPromises = messages.map(async (message) => {
            if (!message.id) return null;
            const msgResponse = await gmail.users.messages.get({ userId: 'me', id: message.id, format: 'full' });
            const payload = msgResponse.data.payload;
            if (!payload?.headers) return null;

            const getHeader = (name: string) => payload.headers?.find(h => h.name === name)?.value || '';

            const fromHeader = getHeader('From');
            const senderMatch = fromHeader.match(/(.*) <(.*)>/);
            const senderName = senderMatch ? senderMatch[1].replace(/"/g, '') : fromHeader;
            const senderEmail = senderMatch ? senderMatch[2] : fromHeader;

            let body = '';
            if (payload.parts) {
                body = getBody(payload.parts);
            } else if (payload.body?.data) {
                body = Buffer.from(payload.body.data, 'base64').toString('utf8');
            }

            return {
                id: msgResponse.data.id,
                sender: senderName,
                sender_email: senderEmail,
                subject: getHeader('Subject'),
                body: body,
                timestamp: new Date(getHeader('Date')).toISOString(),
                status: msgResponse.data.labelIds?.includes('UNREAD') ? 'UNREAD' : 'READ',
                category: msgResponse.data.labelIds?.includes('CATEGORY_PROMOTIONS') ? 'PROMOTIONS' : msgResponse.data.labelIds?.includes('CATEGORY_UPDATES') ? 'UPDATES' : 'PRIMARY',
            };
        });

        const emails = (await Promise.all(emailPromises)).filter(e => e !== null);
        res.json(emails);

    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
