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

export class MockOAuthService {
  private gmailConfig: OAuthConfig;
  private slackConfig: OAuthConfig;

  constructor() {
    this.gmailConfig = {
      clientId: process.env.GMAIL_CLIENT_ID || "mock_gmail_client_id",
      clientSecret: process.env.GMAIL_CLIENT_SECRET || "mock_gmail_secret",
      redirectUri: process.env.GMAIL_REDIRECT_URI || "http://localhost:5000/api/auth/gmail/callback"
    };

    this.slackConfig = {
      clientId: process.env.SLACK_CLIENT_ID || "mock_slack_client_id",
      clientSecret: process.env.SLACK_CLIENT_SECRET || "mock_slack_secret",
      redirectUri: process.env.SLACK_REDIRECT_URI || "http://localhost:5000/api/auth/slack/callback"
    };
  }

  generateGmailAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.gmailConfig.clientId,
      redirect_uri: this.gmailConfig.redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      state,
      access_type: "offline",
      prompt: "consent"
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  generateSlackAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.slackConfig.clientId,
      redirect_uri: this.slackConfig.redirectUri,
      response_type: "code",
      scope: "channels:read,chat:write,users:read",
      state
    });

    return `https://slack.com/oauth/v2/authorize?${params}`;
  }

  async exchangeGmailCode(code: string): Promise<OAuthTokens> {
    // In a real implementation, this would make an HTTP request to Google's token endpoint
    // For now, return mock tokens for development
    return {
      accessToken: `mock_gmail_token_${Date.now()}`,
      refreshToken: `mock_gmail_refresh_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour
    };
  }

  async exchangeSlackCode(code: string): Promise<OAuthTokens> {
    // In a real implementation, this would make an HTTP request to Slack's token endpoint
    // For now, return mock tokens for development
    return {
      accessToken: `mock_slack_token_${Date.now()}`,
      refreshToken: `mock_slack_refresh_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour
    };
  }

  async fetchGmailEmails(accessToken: string): Promise<any[]> {
    // Mock Gmail email data for development
    return [
      {
        id: "gmail_1",
        subject: "Client presentation needs final slides by 3PM today",
        from: "sarah.johnson@company.com",
        body: "Hi team, we need to finalize the client presentation slides by 3PM today for the board meeting. Please review sections 3-5 and update financial projections. This is urgent!",
        receivedAt: new Date(),
        url: "https://mail.google.com/mail/u/0/#inbox/mock_thread_1"
      },
      {
        id: "gmail_2",
        subject: "Weekly team sync notes and upcoming sprint planning",
        from: "team@company.com",
        body: "Here are the notes from our weekly sync. Sprint 23 completed successfully, new testing framework adopted. Team retrospective scheduled for next Tuesday.",
        receivedAt: new Date(Date.now() - 86400000), // 1 day ago
        url: "https://mail.google.com/mail/u/0/#inbox/mock_thread_2"
      }
    ];
  }

  async fetchSlackMessages(accessToken: string): Promise<any[]> {
    // Mock Slack message data for development
    return [
      {
        id: "slack_1",
        channel: "#engineering-urgent",
        user: "mike.kumar",
        text: "Production server down - need immediate database rollback assistance. This is critical!",
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        url: "https://workspace.slack.com/archives/C123456/p1234567890"
      },
      {
        id: "slack_2",
        channel: "#product-updates",
        user: "product.manager",
        text: "Q1 product roadmap updated with new feature priorities. Mobile app prioritized for Q1, AI features moved to Q2.",
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        url: "https://workspace.slack.com/archives/C789012/p1234567891"
      }
    ];
  }
}

export const oauthService = new MockOAuthService();
