# How to Authenticate Your Backend with Google Vertex AI

This guide will help you set up Google Vertex AI authentication for your Cognitive Offload application. This will allow you to use your $1,000 Google Cloud credits for AI processing.

## Prerequisites

- A Google Cloud account with billing enabled
- Access to the Google Cloud Console
- Your project already has the $1,000 credit for Gen App Builder (Vertex AI)

## Step 1: Enable the Vertex AI API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project from the dropdown at the top
3. Navigate to **APIs & Services** > **Library**
4. Search for "Vertex AI API"
5. Click on **Vertex AI API** and then click **Enable**
6. Wait for the API to be enabled (this may take a few minutes)

## Step 2: Create a Service Account

1. In the Google Cloud Console, go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Enter the following details:
   - **Service account name**: `gmail-summarizer-backend`
   - **Service account ID**: `gmail-summarizer-backend` (auto-generated)
   - **Description**: `Service account for Cognitive Offload AI processing`
4. Click **Create and Continue**

## Step 3: Assign the Correct IAM Role

1. In the **Grant this service account access to project** section:
2. Click **Select a role**
3. Search for "Vertex AI User"
4. Select **Vertex AI User** from the results
5. Click **Continue**
6. Click **Done**

## Step 4: Generate a JSON Key File

1. In the Service Accounts list, find your newly created service account
2. Click on the service account name
3. Go to the **Keys** tab
4. Click **Add Key** > **Create new key**
5. Select **JSON** as the key type
6. Click **Create**
7. The JSON key file will automatically download to your computer
8. **Important**: Keep this file secure and never commit it to version control

## Step 5: Configure Environment Variables

1. **Place the JSON key file** in your project directory:
   - Create a folder called `credentials` in your project root
   - Move the downloaded JSON key file to `credentials/service-account-key.json`
   - **Important**: Add `credentials/` to your `.gitignore` file

2. **Update your `.env` file** with the following variables:

```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS="./credentials/service-account-key.json"
GOOGLE_CLOUD_PROJECT_ID="your-project-id-here"

# Remove or comment out the old Gemini API key
# GOOGLE_API_KEY=your-old-api-key
# GEMINI_API_KEY=your-old-api-key
```

3. **Find your Project ID**:
   - In the Google Cloud Console, look at the top of the page
   - Your Project ID is displayed next to the project name
   - It looks something like: `my-project-123456`

4. **Update `.gitignore`** to ensure credentials are not committed:

```gitignore
# Add this line to your .gitignore file
credentials/
```

## Step 6: Test the Configuration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check the server logs for any authentication errors

3. Try processing a new email or Slack message to test the AI functionality

## Troubleshooting

### Common Issues:

1. **"GOOGLE_CLOUD_PROJECT_ID environment variable is required"**
   - Make sure you've added `GOOGLE_CLOUD_PROJECT_ID` to your `.env` file
   - Verify the project ID is correct

2. **"Could not load the default credentials"**
   - Check that `GOOGLE_APPLICATION_CREDENTIALS` points to the correct file path
   - Verify the JSON key file exists and is readable

3. **"Permission denied"**
   - Ensure the service account has the "Vertex AI User" role
   - Check that the Vertex AI API is enabled

4. **"API not enabled"**
   - Go back to Step 1 and ensure the Vertex AI API is enabled

### Verification Commands:

You can test your setup by running:

```bash
# Check if the credentials file exists
ls -la credentials/

# Verify environment variables are loaded
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $GOOGLE_CLOUD_PROJECT_ID
```

## Benefits of This Setup

- ✅ Uses your $1,000 Google Cloud credits
- ✅ More reliable than the free Gemini API
- ✅ Better rate limits and performance
- ✅ Enterprise-grade security
- ✅ Detailed usage monitoring in Google Cloud Console

## Next Steps

After completing this setup:

1. Monitor your usage in the Google Cloud Console
2. Set up billing alerts to avoid unexpected charges
3. Consider implementing caching to reduce API calls
4. Monitor the application logs for any AI processing errors

## Security Best Practices

- Never commit the service account key to version control
- Rotate the service account key periodically
- Use the principle of least privilege (only grant necessary permissions)
- Monitor API usage and costs regularly
- Set up billing alerts to avoid unexpected charges

---

**Note**: This setup will replace the current Gemini API calls with Google Vertex AI calls, which should resolve the rate limiting issues you were experiencing and allow you to use your Google Cloud credits effectively. 