// File: server/services/oauth.ts
// ENHANCED VERSION WITH PROPER TOKEN MANAGEMENT, RATE LIMITING, AND ERROR HANDLING

import fetch, { Response } from 'node-fetch';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Rate limiting state
let lastGmailRequest = 0;
let lastSlackRequest = 0;

// Secure token validation
function isTokenExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  // Add 5 minute buffer before expiry
  return new Date() > new Date(expiresAt.getTime() - 5 * 60 * 1000);
}

// Rate limiting helper
function enforceRateLimit(service: 'gmail' | 'slack'): Promise<void> {
  return new Promise((resolve) => {
    const now = Date.now();
    const lastRequest = service === 'gmail' ? lastGmailRequest : lastSlackRequest;
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
      setTimeout(resolve, delay);
    } else {
      resolve();
    }

    if (service === 'gmail') {
      lastGmailRequest = now;
    } else {
      lastSlackRequest = now;
    }
  });
}

// Secure fetch with timeout and retry logic
async function secureFetch(url: string, options: any, service: 'gmail' | 'slack'): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    await enforceRateLimit(service);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error(`Authentication failed for ${service} API`);
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT_DELAY * attempt;
          console.warn(`Rate limited by ${service} API, waiting ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (response.status >= 500) {
          if (attempt < MAX_RETRIES) {
            const delay = RATE_LIMIT_DELAY * attempt;
            console.warn(`${service} API server error, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        throw new Error(`${service} API error: ${response.status} ${response.statusText}`);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`${service} API request timed out`);
        }

        if (attempt === MAX_RETRIES) {
          throw error;
        }
      }
    }

    throw new Error(`Failed to fetch from ${service} API after ${MAX_RETRIES} attempts`);
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- CRITICAL FIX: VALIDATE SECRETS AT THE TOP ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Remove hardcoded fallback secrets for security
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn('⚠️ Google OAuth credentials not fully configured - Gmail features will be limited');
}

export class RealOAuthService {
  // 🔧 UTILITY FUNCTIONS FOR SAFE DATE HANDLING
  private isValidDate(date: any): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
  }

  private validateEmail(email: any): boolean {
    if (!email || typeof email !== 'object') {
      console.warn('⚠️ validateEmail: Invalid email object:', typeof email);
      return false;
    }

    if (!email.id || typeof email.id !== 'string') {
      console.warn('⚠️ validateEmail: Missing or invalid email.id:', email.id);
      return false;
    }

    if (!email.internalDate) {
      console.warn('⚠️ validateEmail: Missing email.internalDate for:', email.id);
      return false;
    }

    // Gmail internalDate is a string timestamp in milliseconds
    let emailDate: Date;
    try {
      const timestamp = parseInt(email.internalDate);
      if (isNaN(timestamp)) {
        // Fallback: try parsing as date string
        emailDate = new Date(email.internalDate);
      } else {
        // Parse as timestamp (Gmail format)
        emailDate = new Date(timestamp);
      }
    } catch (error) {
      console.warn('⚠️ validateEmail: Error parsing internalDate for:', email.id, 'value:', email.internalDate);
      return false;
    }

    if (isNaN(emailDate.getTime())) {
      console.warn('⚠️ validateEmail: Invalid date from internalDate for:', email.id, 'value:', email.internalDate);
      return false;
    }

    return true;
  }
  private gmailConfig: OAuthConfig;

  constructor() {
    // Check if required environment variables are set
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      console.warn('⚠️ Google OAuth credentials not configured - using limited functionality');
    }

    this.gmailConfig = {
      clientId: GOOGLE_CLIENT_ID || '',
      clientSecret: GOOGLE_CLIENT_SECRET || '',
      redirectUri: GOOGLE_REDIRECT_URI || '',
    };
  }

  generateGmailAuthUrl(state: string): string {
    if (!this.gmailConfig.clientId) {
      throw new Error('Google OAuth not configured - cannot generate auth URL');
    }

    const params = new URLSearchParams({
      client_id: this.gmailConfig.clientId,
      redirect_uri: this.gmailConfig.redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email openid",
      state,
      access_type: "offline",
      prompt: "consent"
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeGmailCode(code: string): Promise<OAuthTokens> {
    if (!this.gmailConfig.clientId || !this.gmailConfig.clientSecret) {
      throw new Error('Google OAuth not configured');
    }

    const params = new URLSearchParams({
      code,
      client_id: this.gmailConfig.clientId,
      client_secret: this.gmailConfig.clientSecret,
      redirect_uri: this.gmailConfig.redirectUri,
      grant_type: "authorization_code"
    });

    try {
      const resp = await secureFetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }, 'gmail');

      const data = await resp.json() as any;

      if (!data.access_token) {
        console.error("[GMAIL OAUTH] No access_token in response:", data);
        throw new Error("No access_token in token response");
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      };
    } catch (error) {
      console.error("[GMAIL OAUTH] Failed to exchange code:", error);
      throw new Error(`Gmail OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refreshGmailToken(refreshToken: string): Promise<OAuthTokens> {
    if (!this.gmailConfig.clientId || !this.gmailConfig.clientSecret) {
      throw new Error('Google OAuth not configured');
    }

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.gmailConfig.clientId,
      client_secret: this.gmailConfig.clientSecret,
      grant_type: "refresh_token"
    });

    try {
      const resp = await secureFetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }, 'gmail');

      const data = await resp.json() as any;

      if (!data.access_token) {
        throw new Error("No access_token in refresh response");
      }

      return {
        accessToken: data.access_token,
        refreshToken: refreshToken, // Keep the original refresh token
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      };
    } catch (error) {
      console.error("[GMAIL OAUTH] Failed to refresh token:", error);
      throw new Error(`Gmail token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchGmailEmails(accessToken: string, expiresAt?: Date, targetDate?: Date): Promise<any[]> {
    console.log(`📧 Fetching Gmail emails`, {
      hasToken: !!accessToken,
      expiresAt: expiresAt?.toISOString(),
      targetDate: targetDate?.toISOString(),
      hasValidTargetDate: targetDate ? this.isValidDate(targetDate) : false
    });

    try {
      // 🔧 VALIDATE ACCESS TOKEN
      if (!accessToken || typeof accessToken !== 'string') {
        console.warn('⚠️ Invalid access token provided to fetchGmailEmails');
        return [];
      }

      // 🔧 VALIDATE TARGET DATE
      if (targetDate && !this.isValidDate(targetDate)) {
        console.warn('⚠️ Invalid target date provided to fetchGmailEmails:', targetDate);
        return [];
      }

      // 🔧 CHECK TOKEN EXPIRY
      if (expiresAt && expiresAt < new Date()) {
        console.warn('⚠️ Gmail access token has expired:', expiresAt.toISOString());
        // Note: In production, you would refresh the token here
      }

      let queryParams = 'maxResults=50';

      // 🔧 SAFE DATE FILTERING AT GMAIL API LEVEL
      if (targetDate && this.isValidDate(targetDate)) {
        // Gmail API expects YYYY/MM/DD format, not ISO strings
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const dateString = `${year}/${month}/${day}`;

        // Get next day for "before" parameter
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextYear = nextDay.getFullYear();
        const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
        const nextDayStr = String(nextDay.getDate()).padStart(2, '0');
        const nextDayString = `${nextYear}/${nextMonth}/${nextDayStr}`;

        console.log(`📅 Gmail API date filtering:`, {
          targetDate: targetDate.toISOString(),
          dateString,
          nextDayString,
          year,
          month,
          day
        });

        // Gmail API uses "after:YYYY/MM/DD before:YYYY/MM/DD" format for date range
        queryParams += `&q=after:${dateString} before:${nextDayString}`;
      }

      const response = await secureFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
        'gmail'
      );

      if (!response.ok) {
        console.error('❌ Gmail API error:', response.status, response.statusText);
        return [];
      }

      const data = await response.json() as any;
      console.log(` Gmail API response: ${data.messages?.length || 0} messages found`);

      // 🔧 VALIDATE API RESPONSE
      if (!data.messages || !Array.isArray(data.messages)) {
        console.warn('⚠️ Gmail API returned invalid messages array:', data.messages);
        return [];
      }

      // 🔧 PROCESS EACH EMAIL WITH VALIDATION
      const emails = [];
      for (const message of data.messages) {
        try {
          if (!message?.id) {
            console.warn('⚠️ Invalid message object from Gmail API:', message);
            continue;
          }

          const email = await this.fetchGmailEmail(accessToken, message.id);
          if (email && this.validateEmail(email)) {
            emails.push(email);
          } else {
            console.warn('⚠️ Invalid email data for message:', message.id);
          }
        } catch (error) {
          console.error('❌ Error fetching email:', message.id, error);
        }
      }

      console.log(` Processed ${emails.length} valid emails from Gmail API`);
      return emails;

    } catch (error) {
      console.error('❌ Gmail API request failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        hasToken: !!accessToken,
        targetDate: targetDate?.toISOString()
      });
      return [];
    }
  }

  // 🔧 FETCH INDIVIDUAL GMAIL EMAIL
  async fetchGmailEmail(accessToken: string, messageId: string): Promise<any> {
    try {
      const response = await secureFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
        'gmail'
      );

      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch Gmail message ${messageId}: ${response.status}`);
        return null;
      }

      const messageData = await response.json() as any;
      const headers = messageData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';

      // Use Gmail's internalDate timestamp for accurate date filtering
      // Gmail returns internalDate as a string timestamp in milliseconds
      let internalDate = messageData.internalDate;
      if (!internalDate) {
        // If no internalDate, use current timestamp in milliseconds as string
        internalDate = Date.now().toString();
        console.warn(`⚠️ No internalDate for message ${messageId}, using current timestamp`);
      }

      // Extract body with better error handling
      let body = '';
      try {
        if (messageData.payload?.body?.data) {
          body = Buffer.from(messageData.payload.body.data, 'base64').toString();
        } else if (messageData.payload?.parts) {
          const textPart = messageData.payload.parts.find((part: any) => part.mimeType === 'text/plain');
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString();
          }
        }
      } catch (decodeError) {
        console.warn(`⚠️ Failed to decode Gmail message body for ${messageId}:`, decodeError);
        body = 'Message content unavailable';
      }

      return {
        id: messageId,
        subject,
        from,
        body,
        internalDate: internalDate,
        url: `https://mail.google.com/mail/u/0/#inbox/${messageId}`,
      };
    } catch (error) {
      console.error(`❌ Error fetching Gmail message ${messageId}:`, error);
      return null;
    }
  }

  async fetchGmailProfile(accessToken: string): Promise<{ email: string; name: string }> {
    try {
      const response = await secureFetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }, 'gmail');

      const data = await response.json() as any;
      return {
        email: data.email || 'unknown@example.com',
        name: data.name || data.email?.split('@')[0] || 'Unknown User',
      };
    } catch (error) {
      console.error('Failed to fetch Gmail profile:', error);
      throw error;
    }
  }

  // Slack OAuth methods
  generateSlackAuthUrl(state: string): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/auth/slack/callback';

    if (!clientId) {
      throw new Error('Slack OAuth not configured - cannot generate auth URL');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'channels:read,channels:history,users:read',
      redirect_uri: redirectUri,
      state,
      response_type: 'code'
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async exchangeSlackCode(code: string): Promise<OAuthTokens> {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/auth/slack/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Slack OAuth not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    try {
      const resp = await secureFetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }, 'slack');

      const data = await resp.json() as any;

      if (!data.ok) {
        throw new Error(`Slack OAuth error: ${data.error}`);
      }

      if (!data.access_token) {
        console.error('[SLACK OAUTH] No access_token in response:', data);
        throw new Error('No access_token in token response');
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      };
    } catch (error) {
      console.error('[SLACK OAUTH] Failed to exchange code:', error);
      throw new Error(`Slack OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchSlackMessages(accessToken: string, expiresAt?: Date, targetDate?: Date): Promise<any[]> {
    try {
      // Check if token is expired
      if (isTokenExpired(expiresAt)) {
        throw new Error('Slack access token is expired');
      }

      console.log('💬 Fetching Slack messages', {
        hasTargetDate: !!targetDate,
        targetDate: targetDate?.toISOString(),
        hasValidTargetDate: targetDate ? this.isValidDate(targetDate) : false
      });

      // Get user's channels
      const channelsResp = await secureFetch('https://slack.com/api/conversations.list', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }, 'slack');

      const channelsData = await channelsResp.json() as any;

      if (!channelsData.ok) {
        throw new Error(`Slack API error: ${channelsData.error}`);
      }

      const channels = channelsData.channels || [];
      const messages: any[] = [];

      // Get messages from first few channels (for demo)
      for (const channel of channels.slice(0, 3)) {
        try {
          const messagesResp = await secureFetch(`https://slack.com/api/conversations.history?channel=${channel.id}&limit=5`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }, 'slack');

          if (messagesResp.ok) {
            const messagesData = await messagesResp.json() as any;
            if (messagesData.ok && messagesData.messages) {
              // 🔧 FILTER MESSAGES BY DATE IF TARGET DATE IS PROVIDED
              const filteredMessages = messagesData.messages.filter((msg: any) => {
                if (!targetDate || !this.isValidDate(targetDate)) {
                  return true; // No date filter, include all messages
                }

                try {
                  // Parse Slack timestamp (in seconds) to Date
                  const timestamp = parseInt(msg.ts);
                  if (isNaN(timestamp)) {
                    console.warn('⚠️ Invalid Slack timestamp:', msg.ts);
                    return false;
                  }

                  const messageDate = new Date(timestamp * 1000);
                  if (isNaN(messageDate.getTime())) {
                    console.warn('⚠️ Invalid message date from timestamp:', msg.ts);
                    return false;
                  }

                  // Compare dates at UTC day level
                  const messageStartOfDay = new Date(Date.UTC(messageDate.getUTCFullYear(), messageDate.getUTCMonth(), messageDate.getUTCDate()));
                  const targetStartOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

                  const isSameDay = messageStartOfDay.getTime() === targetStartOfDay.getTime();

                  if (!isSameDay) {
                    console.log('⏭️ Slack message date mismatch:', {
                      messageId: msg.ts,
                      messageDate: messageStartOfDay.toISOString(),
                      targetDate: targetStartOfDay.toISOString(),
                      messageDateUTC: messageDate.toISOString(),
                      targetDateUTC: targetDate.toISOString()
                    });
                  }

                  return isSameDay;
                } catch (error) {
                  console.warn('⚠️ Error parsing Slack message date:', error);
                  return false;
                }
              });

              console.log(`💬 Channel ${channel.name}: ${filteredMessages.length} messages match target date out of ${messagesData.messages.length} total`);

              messages.push(...filteredMessages.map((msg: any) => ({
                id: msg.ts,
                text: msg.text || '',
                user: msg.user || 'unknown',
                channel: channel.name || 'unknown',
                timestamp: new Date(Number(msg.ts) * 1000),
                url: `https://slack.com/app_redirect?channel=${channel.id}&message_ts=${msg.ts}`,
              })));
            }
          }
        } catch (error) {
          console.error(`Failed to fetch messages from channel ${channel.name}:`, error);
        }
      }

      console.log(`💬 Total Slack messages fetched: ${messages.length}`);
      return messages;
    } catch (error) {
      console.error('Failed to fetch Slack messages:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }
}

export const oauthService = new RealOAuthService();