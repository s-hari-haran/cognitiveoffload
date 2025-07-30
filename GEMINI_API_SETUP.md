# How to Use the Standard Gemini API Key

This guide will help you set up the standard Gemini API for your Cognitive Offload application.

## Step 1: Get Your API Key

1. **Go to Google AI Studio**: Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. **Create API Key**: Click "Create API key in new project"

3. **Copy the Key**: Copy the generated API key to your clipboard

## Step 2: Configure Your .env File

1. **Open your project's .env file**

2. **Remove old Vertex AI variables** (if they exist):
   ```env
   # Remove these lines if they exist:
   # GOOGLE_APPLICATION_CREDENTIALS="./credentials/service-account-key.json"
   # GOOGLE_CLOUD_PROJECT_ID="your-project-id-here"
   ```

3. **Add the new Gemini API key variable**:
   ```env
   GEMINI_API_KEY="YOUR_API_KEY_HERE"
   ```

   Replace `YOUR_API_KEY_HERE` with the actual API key you copied from Google AI Studio.

## Step 3: Restart Your Server

1. **Stop your backend server** (Ctrl+C in the terminal)

2. **Restart the server**:
   ```bash
   npm run dev
   ```

3. **Verify it's working**: Your application will now use your Gemini API key for all summarization tasks.

## Example .env File

Your `.env` file should look something like this:

```env
# Database
DATABASE_URL="postgresql://username:password@host/database"

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/gmail/callback

# OAuth (Slack)
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:5000/api/auth/slack/callback

# Gemini API (NEW)
GEMINI_API_KEY="AIzaSyD...your-actual-api-key-here"

# Other variables
TEST_VAR=hello
```

## Troubleshooting

### Error: "GEMINI_API_KEY is not defined"
- Make sure you've added the `GEMINI_API_KEY` variable to your `.env` file
- Restart your server after making changes

### Error: "Invalid API key"
- Double-check that you copied the entire API key correctly
- Make sure there are no extra spaces or characters

### Error: "Rate limit exceeded"
- The free tier has rate limits
- Wait a few minutes and try again
- Consider upgrading to a paid plan for higher limits

## Benefits of Standard Gemini API

✅ **Simple setup** - Just one API key  
✅ **No complex credentials** - No service accounts or JSON files  
✅ **Immediate access** - Works right away  
✅ **Free tier available** - Generous free usage limits  
✅ **Easy billing** - Simple pay-as-you-go model  

## What Changed

- **Removed**: Vertex AI complexity (service accounts, credentials files, project IDs)
- **Added**: Simple API key authentication
- **Kept**: All the same AI functionality (summarization, analysis, sentiment)
- **Preserved**: Vertex AI code is commented out for future reference

Your application will work exactly the same, but with much simpler authentication! 