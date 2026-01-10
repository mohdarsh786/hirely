import { google } from 'googleapis';
import { GoogleIntegrationBase } from './base';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
];

export class GmailIntegration extends GoogleIntegrationBase {
  constructor() {
    super(SCOPES);
  }

  async listMessages(query: string = '') {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `${query} has:attachment filename:pdf`,
      maxResults: 20
    });
    return res.data.messages || [];
  }

  async getMessage(messageId: string) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId
    });
    return res.data;
  }

  async getAttachment(messageId: string, attachmentId: string) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const res = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId
    });
    return res.data;
  }
}

export const gmailIntegration = new GmailIntegration();
