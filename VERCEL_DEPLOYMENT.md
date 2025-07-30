# 🚀 **Vercel Deployment Guide - Cognitive Offload**

## 📋 **Prerequisites**

Before deploying, make sure you have:

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
3. **Environment Variables** - You'll need to set these up

## 🔧 **Step 1: Prepare Your Repository**

### **1.1 Update Environment Variables**

Create a `.env.example` file to show what environment variables are needed:

```bash
# Database
DATABASE_URL=your_database_url_here

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Slack OAuth
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your_gemini_api_key

# Node Environment
NODE_ENV=production
```

### **1.2 Update OAuth Redirect URLs**

After deployment, you'll need to update your OAuth redirect URLs:

**Google OAuth:**
- Add: `https://your-app-name.vercel.app/api/auth/gmail/callback`

**Slack OAuth:**
- Add: `https://your-app-name.vercel.app/api/auth/slack/callback`

## 🚀 **Step 2: Deploy to Vercel**

### **2.1 Connect Your Repository**

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Select the repository containing your Cognitive Offload project**

### **2.2 Configure Project Settings**

**Framework Preset:** `Other`
**Root Directory:** `./` (leave as default)
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### **2.3 Set Environment Variables**

In the Vercel dashboard, go to **Settings > Environment Variables** and add:

```bash
# Database
DATABASE_URL=your_production_database_url

# JWT Secret (generate a strong one)
JWT_SECRET=your_strong_jwt_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Slack OAuth
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your_gemini_api_key

# Node Environment
NODE_ENV=production
```

### **2.4 Deploy**

Click **"Deploy"** and wait for the build to complete!

## 🗄️ **Step 3: Database Setup**

### **3.1 Free Database Options**

**Option A: Turso (Recommended - Free)**
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create cognitive-offload

# Get connection string
turso db tokens create cognitive-offload
```

**Option B: Neon (Free Tier)**
- Go to [neon.tech](https://neon.tech)
- Create free account
- Create new project
- Copy connection string

**Option C: Supabase (Free Tier)**
- Go to [supabase.com](https://supabase.com)
- Create free account
- Create new project
- Use PostgreSQL connection string

### **3.2 Run Database Migrations**

After getting your database URL, run migrations:

```bash
# Set your database URL
export DATABASE_URL="your_database_url"

# Run migrations
npm run db:migrate
```

## 🔧 **Step 4: OAuth Configuration**

### **4.1 Google OAuth Setup**

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Create a new project or select existing**
3. **Enable Gmail API**
4. **Go to Credentials > Create Credentials > OAuth 2.0 Client IDs**
5. **Add authorized redirect URIs:**
   - `https://your-app-name.vercel.app/api/auth/gmail/callback`
6. **Copy Client ID and Client Secret**

### **4.2 Slack OAuth Setup**

1. **Go to [api.slack.com/apps](https://api.slack.com/apps)**
2. **Create New App**
3. **Go to OAuth & Permissions**
4. **Add Redirect URLs:**
   - `https://your-app-name.vercel.app/api/auth/slack/callback`
5. **Copy Client ID and Client Secret**

## 🎯 **Step 5: Test Your Deployment**

### **5.1 Check Your App**

1. **Visit your Vercel URL:** `https://your-app-name.vercel.app`
2. **Test the landing page**
3. **Try signing up/logging in**
4. **Test Gmail connection**
5. **Test Slack connection**

### **5.2 Common Issues & Solutions**

**Issue: "Database connection failed"**
- Check your `DATABASE_URL` environment variable
- Ensure database is accessible from Vercel
- Run migrations: `npm run db:migrate`

**Issue: "OAuth redirect URI mismatch"**
- Update your OAuth app settings with the correct Vercel URL
- Make sure the callback URLs match exactly

**Issue: "Build failed"**
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

## 💰 **Free Tier Limits**

### **Vercel Free Tier:**
- ✅ **Unlimited deployments**
- ✅ **100GB bandwidth/month**
- ✅ **100GB storage**
- ✅ **Custom domains**
- ✅ **SSL certificates**
- ✅ **Edge functions**
- ⚠️ **Serverless function timeout: 10 seconds**
- ⚠️ **Cold starts may occur**

### **Database Free Tiers:**
- **Turso:** 1GB storage, unlimited requests
- **Neon:** 3GB storage, 10GB transfer/month
- **Supabase:** 500MB storage, 50MB transfer/month

## 🔄 **Step 6: Continuous Deployment**

### **6.1 Automatic Deployments**

Vercel automatically deploys when you push to your main branch:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically deploys!
```

### **6.2 Preview Deployments**

Every pull request gets a preview deployment:

1. **Create a feature branch**
2. **Make changes**
3. **Create pull request**
4. **Vercel creates preview URL**
5. **Test changes before merging**

## 📊 **Step 7: Monitoring & Analytics**

### **7.1 Vercel Analytics (Free)**

1. **Go to your project dashboard**
2. **Click "Analytics"**
3. **Enable analytics**
4. **View performance metrics**

### **7.2 Error Monitoring**

1. **Go to "Functions" tab**
2. **Check for any failed deployments**
3. **Monitor serverless function logs**

## 🎉 **Success!**

Your Cognitive Offload app is now live at:
`https://your-app-name.vercel.app`

### **Next Steps:**

1. **Test all features thoroughly**
2. **Set up custom domain (optional)**
3. **Configure monitoring**
4. **Share with your team!**

## 🆘 **Need Help?**

- **Vercel Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support:** Available in dashboard
- **Community:** [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**🎯 Your Cognitive Offload app is now deployed and ready to help users manage their information overload!** 