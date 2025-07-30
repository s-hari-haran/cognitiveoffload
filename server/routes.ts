import { insertUserSchema, insertWorkItemSchema, updateWorkItemSchema, WorkItem } from "@shared/schema";
import express, { type Request, Response } from "express";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { analyzeWorkItem } from "./services/gemini";
import { RealOAuthService } from "./services/oauth";
import { getWebSocketService, initializeWebSocket } from "./services/websocket";
import { storage } from "./storage";

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    [key: string]: any;
  };
}

const oauthService = new RealOAuthService();

// SECURITY FIX: Remove hardcoded JWT secret
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET environment variable not set - using development fallback');
  // Use a development fallback - in production this should be properly configured
  JWT_SECRET = 'dev-secret-key-change-in-production';
}

// Ensure JWT_SECRET is always a string for TypeScript
const JWT_SECRET_FINAL = JWT_SECRET as string;

const authenticateToken = (req: AuthenticatedRequest, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

// 🔧 UTILITY FUNCTIONS FOR SAFE DATE HANDLING
const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

const parseDateParam = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Invalid date parameter received:', dateStr);
      return undefined;
    }

    console.log('📅 Successfully parsed date parameter:', {
      original: dateStr,
      parsed: date.toISOString(),
      isValid: isValidDate(date)
    });

    return date;
  } catch (error: any) {
    console.error('❌ Error parsing date parameter:', dateStr, error);
    return undefined;
  }
};

const validateUser = (req: any): boolean => {
  if (!req.user || !req.user.userId) {
    console.warn('⚠️ Missing user in request:', {
      hasUser: !!req.user,
      userId: req.user?.userId,
      path: req.path
    });
    return false;
  }
  return true;
};

// 🔧 UTILITY FUNCTIONS FOR EMAIL PROCESSING
const validateEmailDate = (email: any, targetDate?: Date): boolean => {
  if (!email || !email.internalDate) {
    console.warn('⚠️ Email missing internalDate:', email?.id);
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
  } catch (error: any) {
    console.warn('⚠️ Error parsing email internalDate:', email.internalDate, 'for email:', email.id);
    return false;
  }

  if (isNaN(emailDate.getTime())) {
    console.warn('⚠️ Invalid email date:', email.internalDate, 'for email:', email.id);
    return false;
  }

  if (targetDate && isValidDate(targetDate)) {
    const emailStartOfDay = new Date(Date.UTC(emailDate.getUTCFullYear(), emailDate.getUTCMonth(), emailDate.getUTCDate()));
    const targetStartOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

    if (emailStartOfDay.getTime() !== targetStartOfDay.getTime()) {
      console.log('⏭️ Email date mismatch:', {
        emailId: email.id,
        emailDate: emailStartOfDay.toISOString(),
        targetDate: targetStartOfDay.toISOString(),
        emailDateUTC: emailDate.toISOString(),
        targetDateUTC: targetDate.toISOString(),
        rawInternalDate: email.internalDate
      });
      return false;
    }
  }

  return true;
};

const validateEmailContent = (email: any): boolean => {
  if (!email) {
    console.warn('⚠️ Email object is null/undefined:', email?.id);
    return false;
  }

  // Allow emails with empty body - some automated emails might have minimal content
  if (!email.body || email.body === 'Message content unavailable') {
    console.log('📧 Email has minimal/no body content, but allowing processing:', email.id);
    // Set a default body so processing can continue
    email.body = email.subject || 'No content available';
  }

  return true;
};

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Create HTTP server without listening
  const server = new Server(app);

  // Initialize WebSocket service
  initializeWebSocket(server);

  // Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Debug endpoint for checking database content (no auth required for debugging)
  app.get("/api/debug/db", async (req: Request, res: Response) => {
    try {
      console.log('🔍 Debug: Checking database content');

      // Get all work items for all users to see what's in the database
      const allItems = await storage.getWorkItems(1, { limit: 20 }); // Get first 20 items for user 1

      // Group by source type
      const bySourceType = allItems.reduce((acc: any, item: any) => {
        acc[item.sourceType] = (acc[item.sourceType] || 0) + 1;
        return acc;
      }, {});

      // Group by date
      const byDate = allItems.reduce((acc: any, item: any) => {
        const dateKey = item.sourceDate ? new Date(item.sourceDate).toDateString() : 'No Date';
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {});

      // Get sample items with their dates
      const sampleItems = allItems.slice(0, 10).map(item => ({
        id: item.id,
        sourceType: item.sourceType,
        sourceDate: item.sourceDate,
        sourceDateFormatted: item.sourceDate ? new Date(item.sourceDate).toLocaleString() : 'No Date',
        summary: item.summary?.substring(0, 50) + '...',
        createdAt: item.createdAt
      }));

      res.json({
        totalItems: allItems.length,
        bySourceType,
        byDate,
        sampleItems,
        message: "Database debug info"
      });
    } catch (error: any) {
      console.error('❌ Debug db endpoint error:', error);
      res.status(500).json({ error: 'Debug endpoint failed', message: error.message });
    }
  });

  // Debug endpoint for detailed date analysis
  app.get("/api/debug/dates", async (req: Request, res: Response) => {
    try {
      console.log('🔍 Debug: Detailed date analysis');

      // Get all work items for all users to see what's in the database
      const allItems = await storage.getWorkItems(1, { limit: 50 }); // Get more items for detailed analysis

      // Group by detailed date analysis
      const detailedByDate = allItems.reduce((acc: any, item: any) => {
        if (item.sourceDate) {
          const date = new Date(item.sourceDate);
          const dateKey = date.toDateString();
          const isoKey = date.toISOString().split('T')[0];

          if (!acc[dateKey]) {
            acc[dateKey] = {
              count: 0,
              items: [],
              isoDate: isoKey,
              utcMidnight: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString()
            };
          }

          acc[dateKey].count++;
          acc[dateKey].items.push({
            id: item.id,
            sourceType: item.sourceType,
            sourceDate: item.sourceDate,
            summary: item.summary?.substring(0, 50) + '...',
            createdAt: item.createdAt
          });
        }
        return acc;
      }, {});

      res.json({
        totalItems: allItems.length,
        detailedByDate,
        specificDates: {
          'july24': allItems.filter(item => {
            if (!item.sourceDate) return false;
            const date = new Date(item.sourceDate);
            return date.getFullYear() === 2025 && date.getMonth() === 6 && date.getDate() === 24;
          }),
          'july25': allItems.filter(item => {
            if (!item.sourceDate) return false;
            const date = new Date(item.sourceDate);
            return date.getFullYear() === 2025 && date.getMonth() === 6 && date.getDate() === 25;
          })
        },
        message: "Detailed date analysis"
      });
    } catch (error: any) {
      console.error('❌ Debug dates endpoint error:', error);
      res.status(500).json({ error: 'Debug dates endpoint failed', message: error.message });
    }
  });  // Debug endpoint for testing calendar date filtering
  app.get("/api/debug/calendar", authenticateToken, async (req: any, res: Response) => {
    try {
      const { date } = req.query;
      const testDate = date ? new Date(date as string) : new Date();

      if (isNaN(testDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const startOfDay = new Date(Date.UTC(testDate.getUTCFullYear(), testDate.getUTCMonth(), testDate.getUTCDate()));
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Get work items for this date range
      const workItems = await storage.getWorkItems(req.user.userId, {
        startDate: startOfDay,
        endDate: endOfDay
      });

      // Also get items without date filtering for comparison
      const allItems = await storage.getWorkItems(req.user.userId, {});

      res.json({
        testDate: testDate.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        filteredItemsCount: workItems.length,
        totalItemsCount: allItems.length,
        filteredItems: workItems.slice(0, 3).map(item => ({
          id: item.id,
          summary: item.summary,
          sourceDate: item.sourceDate,
          sourceType: item.sourceType,
          classification: item.classification
        })),
        allItems: allItems.slice(0, 3).map(item => ({
          id: item.id,
          summary: item.summary,
          sourceDate: item.sourceDate,
          sourceType: item.sourceType,
          classification: item.classification
        }))
      });
    } catch (error: any) {
      console.error('❌ Debug calendar endpoint error:', error);
      res.status(500).json({ error: 'Debug calendar endpoint failed', message: error.message });
    }
  });

  // Debug endpoint for testing Gmail email fetching
  app.get("/api/debug/gmail", authenticateToken, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user?.gmailToken) {
        return res.status(400).json({ error: 'Gmail not connected' });
      }

      const { date } = req.query;
      const testDate = date ? new Date(date as string) : new Date();

      console.log('🔍 Debug Gmail fetch for date:', testDate.toISOString());

      // Fetch emails directly from Gmail API
      const emails = await oauthService.fetchGmailEmails(user.gmailToken, undefined, testDate);

      res.json({
        testDate: testDate.toISOString(),
        emailsFound: emails.length,
        emails: emails.slice(0, 5).map(email => ({
          id: email.id,
          subject: email.subject,
          from: email.from,
          date: email.internalDate,
          bodyLength: email.body?.length || 0
        })),
        message: `Found ${emails.length} emails for ${testDate.toDateString()}`
      });
    } catch (error: any) {
      console.error('❌ Debug Gmail endpoint error:', error);
      res.status(500).json({ error: 'Debug Gmail endpoint failed', message: error.message });
    }
  });

  // Debug endpoint for testing Today feature
  app.get("/api/debug/today", authenticateToken, async (req: any, res: Response) => {
    try {
      const today = new Date();
      const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      console.log('🔍 Debug Today feature:', {
        today: today.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        userId: req.user.userId
      });

      const workItems = await storage.getWorkItems(req.user.userId, {
        startDate: startOfDay,
        endDate: endOfDay
      });

      res.json({
        today: today.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        workItemsCount: workItems.length,
        workItems: workItems.slice(0, 5) // Show first 5 items
      });
    } catch (error: any) {
      console.error('❌ Debug Today endpoint error:', error);
      res.status(500).json({ error: 'Debug endpoint failed' });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(validatedData);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET_FINAL, { expiresIn: "7d" });

      res.json({ user, token });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET_FINAL, { expiresIn: "7d" });
      res.json({ user, token });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  // OAuth initiation routes (no auth required)
  app.get("/api/auth/gmail/init", async (req: Request, res: Response) => {
    try {
      const state = jwt.sign({ temp: true }, JWT_SECRET_FINAL, { expiresIn: "10m" });
      const authUrl = oauthService.generateGmailAuthUrl(state);
      res.json({ authUrl });
    } catch (error: any) {
      console.error("Gmail auth URL generation error:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  app.get("/api/auth/slack/init", async (req: Request, res: Response) => {
    try {
      const state = jwt.sign({ temp: true }, JWT_SECRET_FINAL, { expiresIn: "10m" });
      const authUrl = oauthService.generateSlackAuthUrl(state);
      res.json({ authUrl });
    } catch (error: any) {
      console.error("Slack auth URL generation error:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  // OAuth callback routes
  app.get("/api/auth/gmail/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ message: "Missing code or state" });
      }

      console.log('🔍 Gmail callback - State:', state);

      const decoded = jwt.verify(state as string, JWT_SECRET_FINAL) as any;
      console.log('🔍 Gmail callback - Decoded:', decoded);

      const tokens = await oauthService.exchangeGmailCode(code as string);
      const profile = await oauthService.fetchGmailProfile(tokens.accessToken);

      let user;
      if (decoded.temp) {
        // New user - check if they exist by email
        user = await storage.getUserByEmail(profile.email);
        if (!user) {
          // Create new user
          user = await storage.createUser({
            email: profile.email,
            name: profile.name,
            password: `gmail_${Date.now()}` // Generate a password for Gmail users
          });
        }
      } else {
        // Existing user
        user = await storage.getUser(decoded.userId);
        if (!user) {
          return res.status(400).json({ message: "User not found" });
        }
      }

      // Update user's Gmail token
      await storage.updateUser(user.id, { gmailToken: tokens.accessToken });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET_FINAL, { expiresIn: "7d" });

      // Redirect to dashboard with user info - FIXED to use correct port 5000
      const userStr = encodeURIComponent(JSON.stringify(user));
      res.redirect(`http://localhost:5000/#/dashboard?token=${token}&user=${userStr}&gmail=connected`);
    } catch (error: any) {
      console.error("Gmail callback error:", error);
      res.status(400).json({ message: "Gmail authentication failed" });
    }
  });

  app.get("/api/auth/slack/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ message: "Missing code or state" });
      }

      const decoded = jwt.verify(state as string, JWT_SECRET_FINAL) as any;
      const tokens = await oauthService.exchangeSlackCode(code as string);

      let user;
      if (decoded.temp) {
        // For Slack, we'll create a generic user since we don't have email
        user = await storage.createUser({
          email: `slack_user_${Date.now()}@example.com`,
          name: "Slack User",
          password: `slack_${Date.now()}`
        });
      } else {
        user = await storage.getUser(decoded.userId);
        if (!user) {
          return res.status(400).json({ message: "User not found" });
        }
      }

      // Update user's Slack token
      await storage.updateUser(user.id, { slackToken: tokens.accessToken });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET_FINAL, { expiresIn: "7d" });

      // Redirect to dashboard with user info - FIXED to use correct port 5000
      const userStr = encodeURIComponent(JSON.stringify(user));
      res.redirect(`http://localhost:5000/#/dashboard?token=${token}&user=${userStr}&slack=connected`);
    } catch (error: any) {
      console.error("Slack callback error:", error);
      res.status(400).json({ message: "Slack authentication failed" });
    }
  });

  // Protected routes
  app.get("/api/auth/gmail", authenticateToken, async (req: any, res: Response) => {
    try {
      const state = jwt.sign({ userId: req.user.userId }, JWT_SECRET_FINAL, { expiresIn: "10m" });
      const authUrl = oauthService.generateGmailAuthUrl(state);
      res.json({ authUrl });
    } catch (error: any) {
      console.error("Gmail auth error:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  app.get("/api/auth/slack", authenticateToken, async (req: any, res: Response) => {
    try {
      const state = jwt.sign({ userId: req.user.userId }, JWT_SECRET_FINAL, { expiresIn: "10m" });
      const authUrl = oauthService.generateSlackAuthUrl(state);
      res.json({ authUrl });
    } catch (error: any) {
      console.error("Slack auth error:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  // Work items routes
  app.get("/api/work-items", authenticateToken, async (req: any, res: Response) => {
    const startTime = Date.now();

    try {
      // 🔧 VALIDATE USER AUTHENTICATION
      if (!validateUser(req)) {
        console.error('❌ Unauthorized access attempt to /api/work-items');
        return res.status(401).json({ message: 'User not authenticated' });
      }

      console.log(`📊 GET /api/work-items - Starting database query for user ${req.user.userId}`);

      // 🔧 SAFE PARAMETER EXTRACTION
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const classification = req.query.classification as string;
      const isCompleted = req.query.isCompleted === 'true';

      // 🔧 SAFE DATE PARAMETER PARSING
      const startDateStr = req.query.start as string;
      const endDateStr = req.query.end as string;

      const startDate = parseDateParam(startDateStr);
      const endDate = parseDateParam(endDateStr);

      console.log(`📊 Query parameters:`, {
        limit,
        offset,
        classification,
        isCompleted,
        startDateStr,
        endDateStr,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        hasValidStartDate: !!startDate,
        hasValidEndDate: !!endDate
      });

      // 🔧 VALIDATE DATE RANGE
      if (startDate && endDate && startDate >= endDate) {
        console.warn('⚠️ Invalid date range:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        return res.status(400).json({
          message: 'Invalid date range: start date must be before end date'
        });
      }

      // 🔧 ENHANCED DATABASE QUERY WITH ERROR HANDLING
      let workItems: WorkItem[] = [];
      try {
        workItems = await storage.getWorkItems(req.user.userId, {
          limit, offset, classification, isCompleted,
          startDate,
          endDate
        });

        console.log(`📊 Database query completed in ${Date.now() - startTime}ms, returned ${workItems.length} items`);

        // 🔧 VALIDATE RETURNED ITEMS
        const validItems = workItems.filter(item => {
          if (!item || !item.id) {
            console.warn('⚠️ Invalid work item returned from database:', item);
            return false;
          }
          return true;
        });

        if (validItems.length !== workItems.length) {
          console.warn(`⚠️ Filtered out ${workItems.length - validItems.length} invalid items`);
        }

        workItems = validItems;

      } catch (dbError) {
        console.error('❌ Database query failed:', dbError);
        return res.status(500).json({
          message: 'Database error occurred while fetching work items'
        });
      }

      // 🔧 ADD CACHE HEADERS
      res.set({
        'Cache-Control': 'private, max-age=30',
        'ETag': `"${workItems.length}-${Date.now()}"`
      });

      res.json(workItems);

    } catch (error: any) {
      console.error('❌ GET /api/work-items error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.userId,
        query: req.query
      });

      res.status(500).json({
        message: 'Failed to fetch work items',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/work-items", authenticateToken, async (req: any, res: Response) => {
    try {
      const validatedData = insertWorkItemSchema.parse({
        ...req.body,
        userId: req.user.userId
      });

      const workItem = await storage.createWorkItem(validatedData);

      // Broadcast to WebSocket clients
      const wsService = getWebSocketService();
      wsService?.broadcastWorkItemCreated(workItem);

      res.json(workItem);
    } catch (error: any) {
      console.error("Create work item error:", error);
      res.status(400).json({ message: "Failed to create work item" });
    }
  });

  app.put("/api/work-items/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateWorkItemSchema.parse({
        ...req.body,
        id
      });

      const workItem = await storage.updateWorkItem(validatedData);
      if (!workItem) {
        return res.status(404).json({ message: "Work item not found" });
      }

      // Broadcast to WebSocket clients
      const wsService = getWebSocketService();
      wsService?.broadcastWorkItemUpdated(workItem);

      res.json(workItem);
    } catch (error: any) {
      console.error("Update work item error:", error);
      res.status(400).json({ message: "Failed to update work item" });
    }
  });

  app.delete("/api/work-items/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWorkItem(id);

      if (!deleted) {
        return res.status(404).json({ message: "Work item not found" });
      }

      // Broadcast to WebSocket clients
      const wsService = getWebSocketService();
      wsService?.broadcastWorkItemDeleted(id);

      res.json({ message: "Work item deleted" });
    } catch (error: any) {
      console.error("Delete work item error:", error);
      res.status(500).json({ message: "Failed to delete work item" });
    }
  });

  // Sync routes
  app.post("/api/sync/gmail", authenticateToken, async (req: any, res: Response) => {
    try {
      console.log(`📧 Gmail sync requested for user ${req.user.userId}`);

      const user = await storage.getUser(req.user.userId);
      if (!user) {
        console.error(`❌ User ${req.user.userId} not found in database`);
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.gmailToken) {
        console.warn(`⚠️ User ${req.user.userId} has no Gmail token - need to connect Gmail first`);
        return res.status(400).json({
          message: "Gmail not connected. Please connect your Gmail account first.",
          error: "GMAIL_NOT_CONNECTED"
        });
      }

      console.log(`✅ User ${req.user.userId} has Gmail token, proceeding with sync`);

      // Extract targetDate from request body if provided
      const { targetDate } = req.body;
      let parsedTargetDate: Date | undefined;

      if (targetDate) {
        try {
          parsedTargetDate = new Date(targetDate);
          if (isNaN(parsedTargetDate.getTime())) {
            return res.status(400).json({ message: "Invalid targetDate format" });
          }

          // Log the exact UTC day range being used - FIXED to use UTC
          const startOfDay = new Date(Date.UTC(parsedTargetDate.getUTCFullYear(), parsedTargetDate.getUTCMonth(), parsedTargetDate.getUTCDate()));
          const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

          console.log(`📅 Gmail sync requested for date: ${parsedTargetDate.toDateString()}`);
          console.log(`📅 UTC day range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
          console.log(`📅 Local timezone: ${parsedTargetDate.getTimezoneOffset()} minutes offset`);
        } catch (error: any) {
          return res.status(400).json({ message: "Invalid targetDate format" });
        }
      }

      // Check for debug mode
      const debugMode = req.query.debug === 'true';
      if (debugMode) {
        console.log('🔍 DEBUG MODE ENABLED - Detailed logging will be shown');
      }

      const result = await processGmailEmails(user.id, user.gmailToken, parsedTargetDate, debugMode);

      // Broadcast sync complete with results
      const wsService = getWebSocketService();
      wsService?.broadcastSyncComplete();

      console.log(`✅ Gmail sync completed: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`);
      res.json({
        message: "Gmail sync completed",
        results: result
      });
    } catch (error: any) {
      console.error("❌ Gmail sync error:", error);

      // Provide more specific error messages
      let errorMessage = "Gmail sync failed";
      if (error instanceof Error) {
        if (error.message.includes('Authentication failed')) {
          errorMessage = "Gmail authentication failed. Please reconnect your Gmail account.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Gmail API rate limit exceeded. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      }

      res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/sync/slack", authenticateToken, async (req: any, res: Response) => {
    try {
      console.log(`💬 Slack sync requested for user ${req.user.userId}`);

      const user = await storage.getUser(req.user.userId);
      if (!user?.slackToken) {
        console.warn(`⚠️ User ${req.user.userId} has no Slack token - need to connect Slack first`);
        return res.status(400).json({
          message: "Slack not connected. Please connect your Slack account first.",
          error: "SLACK_NOT_CONNECTED"
        });
      }

      console.log(`✅ User ${req.user.userId} has Slack token, proceeding with sync`);

      // Extract targetDate from request body if provided
      const { targetDate } = req.body;
      let parsedTargetDate: Date | undefined;

      if (targetDate) {
        try {
          parsedTargetDate = new Date(targetDate);
          if (isNaN(parsedTargetDate.getTime())) {
            return res.status(400).json({ message: "Invalid targetDate format" });
          }

          // Log the exact UTC day range being used - FIXED to use UTC
          const startOfDay = new Date(Date.UTC(parsedTargetDate.getUTCFullYear(), parsedTargetDate.getUTCMonth(), parsedTargetDate.getUTCDate()));
          const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

          console.log(`📅 Slack sync requested for date: ${parsedTargetDate.toDateString()}`);
          console.log(`📅 UTC day range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
          console.log(`📅 Local timezone: ${parsedTargetDate.getTimezoneOffset()} minutes offset`);
        } catch (error: any) {
          return res.status(400).json({ message: "Invalid targetDate format" });
        }
      }

      const result = await processSlackMessages(user.id, user.slackToken, parsedTargetDate);

      // Broadcast sync complete with results
      const wsService = getWebSocketService();
      wsService?.broadcastSyncComplete();

      console.log(`✅ Slack sync completed: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`);
      res.json({
        message: "Slack sync completed",
        results: result
      });
    } catch (error: any) {
      console.error("❌ Slack sync error:", error);

      // Provide more specific error messages
      let errorMessage = "Slack sync failed";
      if (error instanceof Error) {
        if (error.message.includes('Authentication failed')) {
          errorMessage = "Slack authentication failed. Please reconnect your Slack account.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Slack API rate limit exceeded. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      }

      res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  return server;
}

async function processGmailEmails(userId: number, accessToken: string, targetDate?: Date, debugMode: boolean = false) {
  const startTime = Date.now();

  console.log(`📧 Processing Gmail emails for user ${userId}`, {
    targetDate: targetDate?.toISOString(),
    debugMode,
    hasValidTargetDate: targetDate ? isValidDate(targetDate) : false
  });

  try {
    // 🔧 VALIDATE INPUTS
    if (!userId || !accessToken) {
      console.warn('⚠️ Invalid inputs for email processing:', { userId, hasToken: !!accessToken });
      return { created: 0, skipped: 0, errors: 0 };
    }

    // 🔧 VALIDATE TARGET DATE
    if (targetDate && !isValidDate(targetDate)) {
      console.warn('⚠️ Invalid target date provided to processGmailEmails:', targetDate);
      return { created: 0, skipped: 0, errors: 0 };
    }

    const emails = await oauthService.fetchGmailEmails(accessToken, undefined, targetDate);

    if (!Array.isArray(emails) || emails.length === 0) {
      console.log(`📧 No emails found for date: ${targetDate?.toISOString() || 'all dates'}`);
      return { created: 0, skipped: 0, errors: 0 };
    }

    console.log(`📧 Processing ${emails.length} emails in batches`);

    // 🔧 FILTER VALID EMAILS
    const validEmails = emails.filter(email => {
      if (!validateEmailDate(email, targetDate)) {
        return false;
      }

      if (!validateEmailContent(email)) {
        return false;
      }

      return true;
    });

    console.log(`📧 Valid emails for processing: ${validEmails.length} out of ${emails.length} total`);

    if (validEmails.length === 0) {
      console.log('📧 No valid emails to process');
      return { created: 0, skipped: 0, errors: 0 };
    }

    // 🔧 PROCESS EMAILS IN BATCHES
    const BATCH_SIZE = 3;
    const batches = [];
    for (let i = 0; i < validEmails.length; i += BATCH_SIZE) {
      batches.push(validEmails.slice(i, i + BATCH_SIZE));
    }

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);

      const batchPromises = batch.map(async (email) => {
        try {
          console.log(`📧 Processing email: ${email.id}`, {
            subject: email.subject,
            from: email.from,
            date: email.internalDate,
            bodyLength: email.body?.length || 0
          });

          // 🔧 CHECK FOR DUPLICATES FIRST
          const existingItem = await storage.getWorkItemBySourceId(userId, 'gmail', email.id);
          if (existingItem) {
            console.log(`⏭️ Skipping duplicate email: ${email.id}`);
            return { status: 'skipped', reason: 'duplicate' };
          }

          // 🔧 AI ANALYSIS WITH ERROR HANDLING
          let analysis;
          try {
            analysis = await analyzeWorkItem(email.body, 'gmail');
            console.log(`🤖 AI analysis completed for email: ${email.id}`, {
              classification: analysis.classification,
              urgencyScore: analysis.urgency_score,
              summaryLength: analysis.summary?.length || 0
            });
          } catch (aiError: any) {
            console.error(`❌ AI analysis failed for email ${email.id}:`, aiError);
            return { status: 'error', reason: 'ai_analysis_failed', error: aiError.message };
          }

          // 🔧 PARSE EMAIL DATE PROPERLY
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
          } catch (error: any) {
            console.warn(`⚠️ Error parsing email date for ${email.id}:`, email.internalDate);
            return { status: 'error', reason: 'date_parse_error' };
          }

          if (isNaN(emailDate.getTime())) {
            console.warn(`⚠️ Invalid email date for ${email.id}:`, email.internalDate);
            return { status: 'error', reason: 'invalid_date' };
          }

          // 🔧 SAVE TO DATABASE WITH ERROR HANDLING
          let workItem;
          try {
            workItem = await storage.createWorkItem({
              userId,
              sourceType: 'gmail',
              sourceId: email.id,
              sourceDate: emailDate,
              summary: analysis.summary,
              classification: analysis.classification,
              urgencyScore: analysis.urgency_score,
              effortEstimate: analysis.effort_estimate,
              deadline: analysis.deadline,
              businessImpact: analysis.business_impact,
              sentiment: analysis.sentiment,
              actionItems: analysis.action_items,
              contextTags: analysis.context_tags,
              stakeholders: analysis.stakeholders,
              followUpNeeded: analysis.follow_up_needed,
              isCompleted: false
            });

            console.log(`✅ Created work item ${workItem.id} for email: ${email.subject}`);

            // 🔧 BROADCAST NEW WORK ITEM
            const wsService = getWebSocketService();
            if (wsService) {
              wsService.broadcastWorkItemCreated(workItem);
              wsService.broadcastSyncProgress({
                status: 'created',
                message: `Processed: ${email.subject}`,
                workItemId: workItem.id
              });
            }

            return { status: 'created', workItem };
          } catch (dbError: any) {
            console.error(`❌ Database save failed for email ${email.id}:`, dbError);
            return { status: 'error', reason: 'database_save_failed', error: dbError.message };
          }
        } catch (error: any) {
          console.error(`❌ Error processing email ${email.id}:`, error);
          return { status: 'error', reason: 'unknown', error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      // 🔧 LOG BATCH RESULTS
      const created = batchResults.filter(r => r.status === 'created').length;
      const skipped = batchResults.filter(r => r.status === 'skipped').length;
      const errors = batchResults.filter(r => r.status === 'error').length;

      console.log(`✅ Batch ${batchIndex + 1} completed: ${created} created, ${skipped} skipped, ${errors} errors`);

      totalCreated += created;
      totalSkipped += skipped;
      totalErrors += errors;
    }

    const totalTime = Date.now() - startTime;
    console.log(`📧 Gmail sync summary: ${totalCreated} new items created, ${totalSkipped} duplicates skipped, ${totalErrors} errors in ${totalTime}ms`);

    return { created: totalCreated, skipped: totalSkipped, errors: totalErrors };

  } catch (error: any) {
    console.error('❌ Email processing failed:', error);
    console.error('❌ Error details:', {
      userId,
      targetDate: targetDate?.toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return { created: 0, skipped: 0, errors: 1 };
  }
}

async function processSlackMessages(userId: number, accessToken: string, targetDate?: Date) {
  const startTime = Date.now();

  console.log(`💬 Processing Slack messages for user ${userId}`, {
    targetDate: targetDate?.toISOString(),
    hasValidTargetDate: targetDate ? isValidDate(targetDate) : false
  });

  try {
    // 🔧 VALIDATE INPUTS
    if (!userId || !accessToken) {
      console.warn('⚠️ Invalid inputs for Slack processing:', { userId, hasToken: !!accessToken });
      return { created: 0, skipped: 0, errors: 0 };
    }

    // 🔧 VALIDATE TARGET DATE
    if (targetDate && !isValidDate(targetDate)) {
      console.warn('⚠️ Invalid target date provided to processSlackMessages:', targetDate);
      return { created: 0, skipped: 0, errors: 0 };
    }

    // Get user to check token expiry
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Parse token expiry from user data
    let expiresAt: Date | undefined;
    if (user.slackToken) {
      try {
        // Assuming slackToken contains expiry info - you might need to adjust this based on your storage
        const tokenData = JSON.parse(user.slackToken);
        expiresAt = tokenData.expiresAt ? new Date(tokenData.expiresAt) : undefined;
      } catch (error: any) {
        console.warn('Failed to parse Slack token expiry, proceeding without expiry check');
      }
    }

    const messages = await oauthService.fetchSlackMessages(accessToken, expiresAt, targetDate);
    console.log(`💬 Fetched ${messages.length} Slack messages for user ${userId}`);

    if (!Array.isArray(messages) || messages.length === 0) {
      console.log(`💬 No Slack messages found for date: ${targetDate?.toISOString() || 'all dates'}`);
      return { created: 0, skipped: 0, errors: 0 };
    }

    // 🔧 FILTER VALID MESSAGES BY DATE
    const validMessages = messages.filter(message => {
      if (!message || !message.id || !message.text) {
        console.warn('⚠️ Invalid Slack message:', message);
        return false;
      }

      // 🔧 VALIDATE MESSAGE DATE
      if (targetDate && isValidDate(targetDate)) {
        try {
          // Parse Slack timestamp (in seconds) to Date
          const timestamp = parseInt(message.id);
          if (isNaN(timestamp)) {
            console.warn('⚠️ Invalid Slack timestamp:', message.id);
            return false;
          }

          const messageDate = new Date(timestamp * 1000);
          if (isNaN(messageDate.getTime())) {
            console.warn('⚠️ Invalid message date from timestamp:', message.id);
            return false;
          }

          // Compare dates at UTC day level
          const messageStartOfDay = new Date(Date.UTC(messageDate.getUTCFullYear(), messageDate.getUTCMonth(), messageDate.getUTCDate()));
          const targetStartOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

          if (messageStartOfDay.getTime() !== targetStartOfDay.getTime()) {
            console.log('⏭️ Slack message date mismatch:', {
              messageId: message.id,
              messageDate: messageStartOfDay.toISOString(),
              targetDate: targetStartOfDay.toISOString(),
              messageDateUTC: messageDate.toISOString(),
              targetDateUTC: targetDate.toISOString()
            });
            return false;
          }
        } catch (error: any) {
          console.warn('⚠️ Error parsing Slack message date:', error);
          return false;
        }
      }

      // 🔧 VALIDATE MESSAGE CONTENT
      if (!message.text || typeof message.text !== 'string' || message.text.trim().length === 0) {
        console.warn('⚠️ Slack message has empty content:', message.id);
        return false;
      }

      return true;
    });

    console.log(`💬 Valid Slack messages for processing: ${validMessages.length} out of ${messages.length} total`);

    if (validMessages.length === 0) {
      console.log('💬 No valid Slack messages to process');
      return { created: 0, skipped: 0, errors: 0 };
    }

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const message of validMessages) {
      try {
        // Check if this message has already been processed
        const existingWorkItem = await storage.getWorkItemBySourceId(userId, 'slack', message.id);

        if (existingWorkItem) {
          console.log(`⏭️ Skipping duplicate Slack message: ${message.text?.substring(0, 50)}... (TS: ${message.id})`);
          skippedCount++;
          continue;
        }

        console.log(`🆕 Processing new Slack message: ${message.text?.substring(0, 50)}... (TS: ${message.id})`);

        // Prepare content for AI analysis
        const content = message.text;

        const aiResult = await analyzeWorkItem(content, 'slack');

        // Parse and validate Slack timestamp
        let sourceDate: Date;
        try {
          // Slack timestamps are in seconds, convert to milliseconds
          const timestamp = parseInt(message.id);
          if (isNaN(timestamp)) {
            throw new Error('Invalid timestamp');
          }
          sourceDate = new Date(timestamp * 1000);
          if (isNaN(sourceDate.getTime())) {
            throw new Error('Invalid date from timestamp');
          }
        } catch (error: any) {
          console.warn(`Invalid Slack timestamp for ${message.id}, using current time:`, message.id);
          sourceDate = new Date();
        }

        const workItem = await storage.createWorkItem({
          userId,
          sourceType: 'slack',
          sourceId: message.id,
          sourceUrl: `https://slack.com/app_redirect?channel=${message.channel}&message_ts=${message.id}`,
          sourceDate: sourceDate,
          classification: aiResult.classification,
          summary: aiResult.summary,
          actionItems: aiResult.action_items,
          sentiment: aiResult.sentiment,
          urgencyScore: aiResult.urgency_score,
          effortEstimate: aiResult.effort_estimate,
          deadline: aiResult.deadline,
          contextTags: aiResult.context_tags,
          stakeholders: aiResult.stakeholders,
          businessImpact: aiResult.business_impact,
          followUpNeeded: aiResult.follow_up_needed
        });

        createdCount++;
        console.log(`✅ Created work item ${workItem.id} for Slack message`);

        // Broadcast new work item
        const wsService = getWebSocketService();
        wsService?.broadcastWorkItemCreated(workItem);
      } catch (error: any) {
        console.error(`❌ Failed to process Slack message ${message.id}:`, error);
        errorCount++;
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`📊 Slack sync summary: ${createdCount} new items created, ${skippedCount} duplicates skipped, ${errorCount} errors in ${totalTime}ms`);
    return { created: createdCount, skipped: skippedCount, errors: errorCount };
  } catch (error: any) {
    console.error('❌ Slack processing failed:', error);
    console.error('❌ Error details:', {
      userId,
      targetDate: targetDate?.toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return { created: 0, skipped: 0, errors: 1 };
  }
}
