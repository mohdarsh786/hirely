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

  async listFolders() {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    const res = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)',
      pageSize: 50,
      orderBy: 'name'
    });
    return res.data.files || [];
  }

  async listPdfFiles(folderId?: string) {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    let q = "mimeType = 'application/pdf' and trashed = false";
    if (folderId) {
      q += ` and '${folderId}' in parents`;
    }
    const res = await drive.files.list({
      q,
      fields: 'files(id, name, mimeType, modifiedTime)',
      pageSize: 50
    });
    return res.data.files || [];
  }

  async getFile(fileId: string) {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    
    // Add timeout for file download
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const res = await drive.files.get({
        fileId,
        alt: 'media'
      }, { 
        responseType: 'arraybuffer',
        signal: controller.signal as any
      });
      return res.data;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const driveIntegration = new DriveIntegration();
