# Cognitive Offload - Data Flow & Backend Architecture

## 🏗️ **Overall System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   APIs          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 **Complete Data Flow**

### **1. User Authentication Flow**
```
User clicks "Connect Gmail" 
    ↓
Frontend calls `/api/auth/gmail/init`
    ↓
Backend generates JWT state token
    ↓
Backend creates Google OAuth URL with state
    ↓
Frontend opens Google OAuth URL
    ↓
User authorizes on Google
    ↓
Google redirects to `/api/auth/gmail/callback`
    ↓
Backend exchanges code for access token
    ↓
Backend creates/updates user in database
    ↓
Backend redirects to dashboard with user data
    ↓
Frontend stores token and updates state
```

### **2. Data Ingestion Flow**
```
User clicks "Sync" or automatic sync triggers
    ↓
Backend calls Gmail/Slack APIs with access token
    ↓
APIs return raw emails/messages
    ↓
Backend sends each item to Gemini AI for analysis
    ↓
Gemini returns structured analysis (classification, summary, etc.)
    ↓
Backend saves processed work items to database
    ↓
Backend broadcasts updates via WebSocket
    ↓
Frontend receives real-time updates
```

### **3. Real-time Updates Flow**
```
New work item created in database
    ↓
Backend WebSocket service broadcasts message
    ↓
All connected frontend clients receive update
    ↓
Frontend refreshes data and shows notification
```

## 📁 **File Structure & Responsibilities**

### **Frontend (client/src/)**
- **`App.tsx`** - Main app router and error boundary
- **`pages/dashboard.tsx`** - Main dashboard with work items display
- **`pages/auth.tsx`** - Authentication page with OAuth buttons
- **`context/AppContext.tsx`** - Global state management (user, tokens, services)
- **`hooks/useWebSocket.ts`** - Real-time WebSocket connection
- **`lib/queryClient.ts`** - API request handling and caching

### **Backend (server/)**
- **`index.ts`** - Main server entry point
- **`routes.ts`** - All API endpoints and route handlers
- **`services/oauth.ts`** - Gmail/Slack OAuth integration
- **`services/gemini.ts`** - AI analysis using Google Gemini
- **`services/websocket.ts`** - Real-time WebSocket server
- **`storage.ts`** - Database operations (users, work items)
- **`db.ts`** - Database connection and initialization

### **Shared (shared/)**
- **`schema.ts`** - Database schema definitions and types

## 🔧 **Key Components Explained**

### **1. OAuth Service (`server/services/oauth.ts`)**
**Purpose**: Handles all Gmail and Slack authentication
**What it does**:
- Generates OAuth URLs for Google/Slack
- Exchanges authorization codes for access tokens
- Fetches emails/messages from APIs
- Manages token refresh and expiry

**Key Methods**:
- `generateGmailAuthUrl()` - Creates Google OAuth URL
- `exchangeGmailCode()` - Exchanges code for token
- `fetchGmailEmails()` - Gets emails from Gmail API
- `fetchSlackMessages()` - Gets messages from Slack API

### **2. Gemini AI Service (`server/services/gemini.ts`)**
**Purpose**: Analyzes content using Google's Gemini AI
**What it does**:
- Takes raw email/message content
- Sends to Gemini AI for analysis
- Returns structured data (classification, summary, etc.)

**Key Methods**:
- `analyzeWorkItem()` - Main analysis function
- `parseAIResponse()` - Handles AI response parsing
- `sanitizeContent()` - Cleans input for AI

### **3. WebSocket Service (`server/services/websocket.ts`)**
**Purpose**: Real-time communication between backend and frontend
**What it does**:
- Maintains WebSocket connections
- Broadcasts updates to all connected clients
- Handles connection cleanup and heartbeat

### **4. Storage Service (`server/storage.ts`)**
**Purpose**: Database operations for users and work items
**What it does**:
- Creates/updates users
- Stores/retrieves work items
- Manages OAuth tokens

## 🚨 **Current Issues & Error Points**

### **1. Google OAuth Errors**
**Problem**: 500 errors when trying to connect Gmail
**Root Cause**: Google OAuth credentials not configured in environment
**Files Involved**:
- `server/services/oauth.ts` (lines 117-122)
- `server/routes.ts` (lines 88-95)

**Error Flow**:
```
Frontend calls /api/auth/gmail/init
    ↓
Backend tries to generate OAuth URL
    ↓
OAuth service checks for GOOGLE_CLIENT_ID
    ↓
Environment variable is missing
    ↓
Service throws "Google OAuth not configured"
    ↓
Backend returns 500 error
```

### **2. JWT Secret Issues**
**Problem**: JWT signing failures
**Root Cause**: JWT_SECRET environment variable issues
**Files Involved**:
- `server/routes.ts` (lines 12-18)

### **3. WebSocket Connection Issues**
**Problem**: `localhost:undefined` WebSocket URL
**Root Cause**: Improper host detection in frontend
**Files Involved**:
- `client/src/hooks/useWebSocket.ts` (lines 17-22)

## 🔍 **Environment Variables Required**

### **Required for OAuth**:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/gmail/callback
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:5000/api/auth/slack/callback
```

### **Required for AI**:
```
GEMINI_API_KEY=your_gemini_api_key
```

### **Required for Database**:
```
DATABASE_URL=your_postgresql_connection_string
```

### **Required for Security**:
```
JWT_SECRET=your_jwt_secret_key
```

## 🛠️ **How to Fix Current Issues**

### **1. Fix Google OAuth**
1. Set up Google OAuth credentials in Google Cloud Console
2. Add credentials to `.env` file
3. Restart server

### **2. Fix JWT Issues**
1. Add `JWT_SECRET` to `.env` file
2. Restart server

### **3. Fix WebSocket**
1. The WebSocket URL fix is already applied
2. Refresh browser to apply changes

## 📊 **Data Processing Pipeline**

```
Raw Email/Message
    ↓
Content Sanitization (remove HTML, limit length)
    ↓
Gemini AI Analysis
    ↓
JSON Response Parsing
    ↓
Data Validation & Normalization
    ↓
Database Storage
    ↓
WebSocket Broadcast
    ↓
Frontend Update
```

## 🔄 **Error Handling Strategy**

### **1. OAuth Errors**
- Check environment variables
- Validate OAuth credentials
- Handle token expiry
- Implement retry logic

### **2. AI Analysis Errors**
- Sanitize input content
- Handle malformed AI responses
- Provide fallback analysis
- Log errors for debugging

### **3. Database Errors**
- Validate data before storage
- Handle duplicate entries
- Implement connection pooling
- Log database errors

### **4. WebSocket Errors**
- Implement reconnection logic
- Handle connection timeouts
- Clean up stale connections
- Provide user feedback

## 🎯 **Testing Checklist**

### **Authentication Flow**:
- [ ] Gmail OAuth URL generation
- [ ] Google callback processing
- [ ] User creation/update
- [ ] Token storage

### **Data Processing**:
- [ ] Email fetching from Gmail
- [ ] AI analysis with Gemini
- [ ] Database storage
- [ ] WebSocket broadcasting

### **Frontend Integration**:
- [ ] Real-time updates
- [ ] Error handling
- [ ] User feedback
- [ ] State management

This documentation provides a complete overview of how the system works and where the current issues are located. 