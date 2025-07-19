import { users, workItems, type User, type InsertUser, type WorkItem, type InsertWorkItem, type UpdateWorkItem } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Work item methods
  getWorkItems(userId: number): Promise<WorkItem[]>;
  getWorkItem(id: number): Promise<WorkItem | undefined>;
  createWorkItem(workItem: InsertWorkItem): Promise<WorkItem>;
  updateWorkItem(updates: UpdateWorkItem): Promise<WorkItem | undefined>;
  deleteWorkItem(id: number): Promise<boolean>;
  getWorkItemsByClassification(userId: number, classification: string): Promise<WorkItem[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workItems: Map<number, WorkItem>;
  private currentUserId: number;
  private currentWorkItemId: number;

  constructor() {
    this.users = new Map();
    this.workItems = new Map();
    this.currentUserId = 1;
    this.currentWorkItemId = 1;
    
    // Add sample work items for testing
    this.initSampleData();
  }

  private initSampleData() {
    const now = new Date();
    const sampleItems = [
      {
        userId: 1,
        sourceType: 'gmail' as const,
        sourceId: 'sample-urgent-1',
        sourceUrl: 'https://mail.google.com/mail/u/0/#inbox/sample-urgent-1',
        classification: 'urgent',
        summary: 'Client presentation deadline moved to tomorrow - requires immediate deck revision',
        actionItems: ['Update financial projections', 'Revise timeline slide', 'Coordinate with design team'],
        sentiment: 'negative',
        urgencyScore: 5,
        effortEstimate: 'long',
        deadline: 'today',
        contextTags: ['client-work', 'presentation', 'design'],
        stakeholders: ['client@company.com', 'design@team.com'],
        businessImpact: 'high',
        followUpNeeded: true,
        isCompleted: false,
        isSnoozed: false,
        snoozeUntil: null,
      },
      {
        userId: 1,
        sourceType: 'slack' as const,
        sourceId: 'sample-fyi-1',
        sourceUrl: 'https://slack.com/archives/C123/p1234567890',
        classification: 'fyi',
        summary: 'New security protocols implemented across all development environments',
        actionItems: ['Review new authentication requirements', 'Update local development setup'],
        sentiment: 'neutral',
        urgencyScore: 2,
        effortEstimate: 'medium',
        deadline: 'this_week',
        contextTags: ['security', 'development', 'compliance'],
        stakeholders: ['security@company.com'],
        businessImpact: 'medium',
        followUpNeeded: false,
        isCompleted: false,
        isSnoozed: false,
        snoozeUntil: null,
      },
      {
        userId: 1,
        sourceType: 'gmail' as const,
        sourceId: 'sample-ignore-1',
        sourceUrl: null,
        classification: 'ignore',
        summary: 'Marketing newsletter about upcoming webinar series',
        actionItems: [],
        sentiment: 'neutral',
        urgencyScore: 1,
        effortEstimate: 'quick',
        deadline: 'no_deadline',
        contextTags: ['marketing', 'newsletter'],
        stakeholders: [],
        businessImpact: 'low',
        followUpNeeded: false,
        isCompleted: false,
        isSnoozed: false,
        snoozeUntil: null,
      }
    ];

    sampleItems.forEach(item => {
      const id = this.currentWorkItemId++;
      const workItem: WorkItem = {
        ...item,
        id,
        sourceUrl: item.sourceUrl,
        actionItems: item.actionItems,
        contextTags: item.contextTags,
        stakeholders: item.stakeholders,
        createdAt: now,
        updatedAt: now,
      };
      this.workItems.set(id, workItem);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      gmailToken: null,
      slackToken: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Work item methods
  async getWorkItems(userId: number): Promise<WorkItem[]> {
    return Array.from(this.workItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => {
        // Sort by urgency score (higher first), then by created date (newer first)
        if (a.urgencyScore !== b.urgencyScore) {
          return (b.urgencyScore || 0) - (a.urgencyScore || 0);
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }

  async getWorkItem(id: number): Promise<WorkItem | undefined> {
    return this.workItems.get(id);
  }

  async createWorkItem(insertWorkItem: InsertWorkItem): Promise<WorkItem> {
    const id = this.currentWorkItemId++;
    const now = new Date();
    const workItem: WorkItem = {
      id,
      userId: insertWorkItem.userId,
      sourceType: insertWorkItem.sourceType,
      sourceId: insertWorkItem.sourceId,
      sourceUrl: insertWorkItem.sourceUrl || null,
      classification: insertWorkItem.classification,
      summary: insertWorkItem.summary,
      actionItems: Array.isArray(insertWorkItem.actionItems) ? insertWorkItem.actionItems : null,
      sentiment: insertWorkItem.sentiment || null,
      urgencyScore: insertWorkItem.urgencyScore || null,
      effortEstimate: insertWorkItem.effortEstimate || null,
      deadline: insertWorkItem.deadline || null,
      contextTags: Array.isArray(insertWorkItem.contextTags) ? insertWorkItem.contextTags : null,
      stakeholders: Array.isArray(insertWorkItem.stakeholders) ? insertWorkItem.stakeholders : null,
      businessImpact: insertWorkItem.businessImpact || null,
      followUpNeeded: insertWorkItem.followUpNeeded || false,
      isCompleted: insertWorkItem.isCompleted || false,
      isSnoozed: insertWorkItem.isSnoozed || false,
      snoozeUntil: insertWorkItem.snoozeUntil || null,
      createdAt: now,
      updatedAt: now,
    };
    this.workItems.set(id, workItem);
    return workItem;
  }

  async updateWorkItem(updates: UpdateWorkItem): Promise<WorkItem | undefined> {
    const { id, ...updateData } = updates;
    const workItem = this.workItems.get(id);
    if (!workItem) return undefined;

    const updatedWorkItem: WorkItem = {
      ...workItem,
      ...updateData,
      updatedAt: new Date(),
    };
    this.workItems.set(id, updatedWorkItem);
    return updatedWorkItem;
  }

  async deleteWorkItem(id: number): Promise<boolean> {
    return this.workItems.delete(id);
  }

  async getWorkItemsByClassification(userId: number, classification: string): Promise<WorkItem[]> {
    return Array.from(this.workItems.values())
      .filter(item => item.userId === userId && item.classification === classification)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
}

export const storage = new MemStorage();
