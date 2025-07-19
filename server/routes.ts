import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import { storage } from "./storage";
import { initializeWebSocket, wsService } from "./services/websocket";
import { analyzeWorkItem } from "./services/gemini";
import { oauthService } from "./services/oauth";
import { insertUserSchema, insertWorkItemSchema, updateWorkItemSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  initializeWebSocket(httpServer);

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
      
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // OAuth routes
  app.get('/api/auth/gmail', authenticateToken, async (req: any, res) => {
    const state = jwt.sign({ userId: req.user.userId }, JWT_SECRET);
    const authUrl = oauthService.generateGmailAuthUrl(state);
    res.json({ authUrl });
  });

  app.get('/api/auth/gmail/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ message: 'Missing code or state' });
      }

      const decoded = jwt.verify(state as string, JWT_SECRET) as any;
      const tokens = await oauthService.exchangeGmailCode(code as string);
      
      await storage.updateUser(decoded.userId, { gmailToken: tokens.accessToken });
      
      // Start processing Gmail emails
      setTimeout(async () => {
        await processGmailEmails(decoded.userId, tokens.accessToken);
      }, 1000);

      res.redirect('/#/dashboard?gmail=connected');
    } catch (error) {
      res.status(400).json({ message: 'OAuth callback failed' });
    }
  });

  app.get('/api/auth/slack', authenticateToken, async (req: any, res) => {
    const state = jwt.sign({ userId: req.user.userId }, JWT_SECRET);
    const authUrl = oauthService.generateSlackAuthUrl(state);
    res.json({ authUrl });
  });

  app.get('/api/auth/slack/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ message: 'Missing code or state' });
      }

      const decoded = jwt.verify(state as string, JWT_SECRET) as any;
      const tokens = await oauthService.exchangeSlackCode(code as string);
      
      await storage.updateUser(decoded.userId, { slackToken: tokens.accessToken });
      
      // Start processing Slack messages
      setTimeout(async () => {
        await processSlackMessages(decoded.userId, tokens.accessToken);
      }, 1000);

      res.redirect('/#/dashboard?slack=connected');
    } catch (error) {
      res.status(400).json({ message: 'OAuth callback failed' });
    }
  });

  // Work items routes
  app.get('/api/work-items', authenticateToken, async (req: any, res) => {
    try {
      const { classification } = req.query;
      let workItems;
      
      if (classification && classification !== 'all') {
        workItems = await storage.getWorkItemsByClassification(req.user.userId, classification);
      } else {
        workItems = await storage.getWorkItems(req.user.userId);
      }
      
      res.json(workItems);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch work items' });
    }
  });

  app.post('/api/work-items', authenticateToken, async (req: any, res) => {
    try {
      const workItemData = insertWorkItemSchema.parse({
        ...req.body,
        userId: req.user.userId
      });
      
      const workItem = await storage.createWorkItem(workItemData);
      
      // Broadcast to WebSocket clients
      wsService?.broadcastWorkItemCreated(workItem);
      
      res.json(workItem);
    } catch (error) {
      res.status(400).json({ message: 'Invalid work item data' });
    }
  });

  app.put('/api/work-items/:id', authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = updateWorkItemSchema.parse({ ...req.body, id });
      
      const workItem = await storage.updateWorkItem(updateData);
      if (!workItem) {
        return res.status(404).json({ message: 'Work item not found' });
      }
      
      // Broadcast to WebSocket clients
      wsService?.broadcastWorkItemUpdated(workItem);
      
      res.json(workItem);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update work item' });
    }
  });

  app.delete('/api/work-items/:id', authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWorkItem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Work item not found' });
      }
      
      // Broadcast to WebSocket clients
      wsService?.broadcastWorkItemDeleted(id);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete work item' });
    }
  });

  // Sync endpoint to manually trigger data processing
  app.post('/api/sync', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const promises = [];
      
      if (user.gmailToken) {
        promises.push(processGmailEmails(user.id, user.gmailToken));
      }
      
      if (user.slackToken) {
        promises.push(processSlackMessages(user.id, user.slackToken));
      }

      await Promise.all(promises);
      
      wsService?.broadcastSyncComplete();
      
      res.json({ message: 'Sync completed' });
    } catch (error) {
      res.status(500).json({ message: 'Sync failed' });
    }
  });

  return httpServer;
}

// Helper functions for processing external data
async function processGmailEmails(userId: number, accessToken: string) {
  try {
    const emails = await oauthService.fetchGmailEmails(accessToken);
    
    for (const email of emails) {
      // Check if already processed
      const existingItem = await storage.getWorkItems(userId);
      const alreadyProcessed = existingItem.some(item => 
        item.sourceType === 'gmail' && item.sourceId === email.id
      );
      
      if (alreadyProcessed) continue;

      // Process with Gemini AI
      const aiResult = await analyzeWorkItem(`${email.subject}\n\n${email.body}`, 'gmail');
      
      const workItem = {
        userId,
        sourceType: 'gmail' as const,
        sourceId: email.id,
        sourceUrl: email.url,
        classification: aiResult.classification.toLowerCase().replace('🔥 ', '').replace('💡 ', '').replace('🗑 ', ''),
        summary: aiResult.summary,
        actionItems: aiResult.action_items,
        sentiment: aiResult.sentiment.toLowerCase(),
        urgencyScore: aiResult.urgency_score,
        effortEstimate: aiResult.effort_estimate.toLowerCase().split(' ')[0], // Extract "quick", "medium", "long"
        deadline: aiResult.deadline.toLowerCase().replace(' ', '_'),
        contextTags: aiResult.context_tags,
        stakeholders: aiResult.stakeholders,
        businessImpact: aiResult.business_impact.toLowerCase(),
        followUpNeeded: aiResult.follow_up_needed,
        isCompleted: false,
        isSnoozed: false,
      };

      const created = await storage.createWorkItem(workItem);
      wsService?.broadcastWorkItemCreated(created);
    }
  } catch (error) {
    console.error('Failed to process Gmail emails:', error);
  }
}

async function processSlackMessages(userId: number, accessToken: string) {
  try {
    const messages = await oauthService.fetchSlackMessages(accessToken);
    
    for (const message of messages) {
      // Check if already processed
      const existingItem = await storage.getWorkItems(userId);
      const alreadyProcessed = existingItem.some(item => 
        item.sourceType === 'slack' && item.sourceId === message.id
      );
      
      if (alreadyProcessed) continue;

      // Process with Gemini AI
      const aiResult = await analyzeWorkItem(`Channel: ${message.channel}\nFrom: ${message.user}\n\n${message.text}`, 'slack');
      
      const workItem = {
        userId,
        sourceType: 'slack' as const,
        sourceId: message.id,
        sourceUrl: message.url,
        classification: aiResult.classification.toLowerCase().replace('🔥 ', '').replace('💡 ', '').replace('🗑 ', ''),
        summary: aiResult.summary,
        actionItems: aiResult.action_items,
        sentiment: aiResult.sentiment.toLowerCase(),
        urgencyScore: aiResult.urgency_score,
        effortEstimate: aiResult.effort_estimate.toLowerCase().split(' ')[0],
        deadline: aiResult.deadline.toLowerCase().replace(' ', '_'),
        contextTags: aiResult.context_tags,
        stakeholders: aiResult.stakeholders,
        businessImpact: aiResult.business_impact.toLowerCase(),
        followUpNeeded: aiResult.follow_up_needed,
        isCompleted: false,
        isSnoozed: false,
      };

      const created = await storage.createWorkItem(workItem);
      wsService?.broadcastWorkItemCreated(created);
    }
  } catch (error) {
    console.error('Failed to process Slack messages:', error);
  }
}


