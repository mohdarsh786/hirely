import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getEnv } from '../../env';

export abstract class GoogleIntegrationBase {
  protected oauth2Client: OAuth2Client;
  protected scopes: string[];

  constructor(scopes: string[]) {
    const env = getEnv();
    this.oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_OAUTH_CLIENT_ID,
      env.GOOGLE_OAUTH_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );
    this.scopes = scopes;
  }

  getAuthUrl(state: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      include_granted_scopes: true,
      state,
      prompt: 'consent'
    });
  }

  async getTokens(code: string) {
    const env = getEnv();
    console.log('[OAuth] getTokens called with redirect URI:', env.GOOGLE_REDIRECT_URI);
    console.log('[OAuth] Client ID prefix:', env.GOOGLE_OAUTH_CLIENT_ID?.substring(0, 20));
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async setCredentials(accessToken: string, refreshToken?: string | null) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined
    });

    if (refreshToken) {
    }
  }

  async checkAndRefreshToken(
    currentAccessToken: string,
    currentRefreshToken: string | null | undefined,
    expiryDate: Date | null
  ): Promise<{ accessToken: string; refreshToken?: string | null; expiryDate?: number } | null> {
    this.setCredentials(currentAccessToken, currentRefreshToken);

    // If no expiry date or expiring within 5 minutes, refresh
    const isExpiring = !expiryDate || expiryDate.getTime() - Date.now() < 5 * 60 * 1000;

    if (isExpiring && currentRefreshToken) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        return {
           accessToken: credentials.access_token!,
           refreshToken: credentials.refresh_token,
           expiryDate: credentials.expiry_date || undefined
        };
      } catch (err) {
        console.error('Failed to refresh token', err);
        throw new Error('Failed to refresh authentication token');
      }
    }
    return null;
  }

  async getUserProfile() {
    // Basic profile from oauth2 v2 to identify user uniformly
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return { email: data.email, id: data.id };
  }
}
