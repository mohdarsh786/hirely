import { google } from 'googleapis';
import { GoogleIntegrationBase } from './base';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
];

export class DriveIntegration extends GoogleIntegrationBase {
  constructor() {
    super(SCOPES);
  }

  async listPdfFiles(query: string = '') {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    const q = "mimeType = 'application/pdf' and trashed = false";
    const res = await drive.files.list({
      q: query ? `${q} and name contains '${query}'` : q,
      fields: 'files(id, name, mimeType, modifiedTime)',
      pageSize: 20
    });
    return res.data.files || [];
  }

  async getFile(fileId: string) {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    const res = await drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' });
    return res.data;
  }
}

export const driveIntegration = new DriveIntegration();
