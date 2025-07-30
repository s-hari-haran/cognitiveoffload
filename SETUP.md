# Cognitive Offload - Setup Guide

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_GvISQKB7m9Lf@ep-icy-violet-aec93fze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Google OAuth (Gmail API)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/gmail/callback

# Slack OAuth
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:5000/api/auth/slack/callback

# AI Service (Google Gemini or OpenAI)
GOOGLE_API_KEY=your-google-gemini-api-key
# OR
OPENAI_API_KEY=your-openai-api-key

# Test variable
TEST_VAR=hello
```

## OAuth Setup Instructions

### Google OAuth (Gmail)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:5000/api/auth/gmail/callback` to authorized redirect URIs
6. Copy Client ID and Client Secret to your `.env` file

### Slack OAuth (REQUIRED FOR FULL FUNCTIONALITY)
1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it "Cognitive Offload" and select your workspace
4. Click "Create App"

#### Configure OAuth Settings:
1. In your Slack app, go to "OAuth & Permissions" in the left sidebar
2. Under "Redirect URLs", add: `http://localhost:5000/api/auth/slack/callback`
3. Under "Scopes" → "Bot Token Scopes", add:
   - `channels:read`
   - `channels:history` 
   - `users:read`
4. Save the changes

#### Get Your Credentials:
1. In "OAuth & Permissions", you'll see:
   - **Client ID** (starts with `1234567890.1234567890`)
   - **Client Secret** (you'll need to click "Show" to see it)
2. Copy these to your `.env` file

#### Install App to Workspace:
1. Go to "Install App" in the left sidebar
2. Click "Install to Workspace"
3. Authorize the app

## Demo Mode

If you don't have OAuth credentials set up, the application will run in demo mode:
- Authentication will create demo accounts
- Service connections will be simulated
- All functionality will work with mock data

## Running the Application

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open http://localhost:5000 in your browser

## Features

- **Authentication**: Google OAuth or email/password
- **Service Integration**: Gmail and Slack (with demo fallback)
- **AI Processing**: Intelligent classification of messages
- **Dashboard**: Three-column layout (Urgent, FYI, Ignore)
- **Date Filtering**: Filter items by date
- **Context Panel**: View related information
- **Real-time Updates**: WebSocket integration 