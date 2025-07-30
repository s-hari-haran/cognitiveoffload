import type { InsertUser, InsertWorkItem, UpdateWorkItem, User, WorkItem } from '@shared/schema';
import { users, workItems } from '@shared/schema';
import { and, desc, eq, gte, isNotNull, isNull, lt, or } from 'drizzle-orm';
import { db } from './db';

// Simple in-memory cache for work items
const workItemsCache = new Map<string, { data: WorkItem[]; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds

function getCacheKey(userId: number, options: any): string {
  const { limit, offset, classification, isCompleted, startDate, endDate } = options;
  return `${userId}-${limit || 50}-${offset || 0}-${classification || 'all'}-${isCompleted === undefined ? 'all' : isCompleted}-${startDate ? startDate.toISOString() : 'all'}-${endDate ? endDate.toISOString() : 'all'}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

// 🔧 UTILITY FUNCTIONS FOR SAFE DATE HANDLING
const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

const validateWorkItem = (item: any): boolean => {
  if (!item || typeof item !== 'object') {
    return false;
  }

  if (!item.id || typeof item.id !== 'number') {
    return false;
  }

  if (!item.userId || typeof item.userId !== 'number') {
    return false;
  }

  return true;
};

const buildDateFilters = (startDate?: Date, endDate?: Date, includeNullDates: boolean = false) => {
  const filters = [];

  // If both dates are provided, filter items within the date range
  if (startDate && isValidDate(startDate) && endDate && isValidDate(endDate)) {
    console.log('📅 Adding date range filter:', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      includeNullDates
    });

    if (includeNullDates) {
      // Items with NULL sourceDate OR items within the specified date range
      filters.push(
        or(
          isNull(workItems.sourceDate),
          and(
            gte(workItems.sourceDate, startDate),
            lt(workItems.sourceDate, endDate)
          )
        )
      );
    } else {
      // Only items within the specified date range (FAST: can use index)
      filters.push(
        and(
          isNotNull(workItems.sourceDate),
          gte(workItems.sourceDate, startDate),
          lt(workItems.sourceDate, endDate)
        )
      );
    }
  } else if (startDate && isValidDate(startDate)) {
    console.log('📅 Adding start date filter:', startDate.toISOString());

    // Check if this is a "today" filter (same day as current date)
    const today = new Date();
    const isTodayFilter = startDate.toDateString() === today.toDateString();
    
    // Check if this is a "recent" filter (within last 7 days)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const isRecentFilter = startDate.getTime() >= sevenDaysAgo.getTime() && startDate.getTime() <= today.getTime();
    
    if (isTodayFilter) {
      console.log('📅 Today filter detected - including items processed today');
      // For today filter, also include items that were created today (processed today)
      // even if their sourceDate is from an earlier date
      filters.push(
        or(
          // Items with sourceDate from today
          and(
            isNotNull(workItems.sourceDate),
            gte(workItems.sourceDate, startDate),
            lt(workItems.sourceDate, new Date(startDate.getTime() + 24 * 60 * 60 * 1000))
          ),
          // OR items that were created today (processed today)
          and(
            gte(workItems.createdAt, startDate),
            lt(workItems.createdAt, new Date(startDate.getTime() + 24 * 60 * 60 * 1000))
          )
        )
      );
    } else if (isRecentFilter) {
      console.log('📅 Recent filter detected - including items from last 7 days');
      // For recent filter, include items from the last 7 days
      const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // End of today
      filters.push(
        or(
          // Items with sourceDate from recent period
          and(
            isNotNull(workItems.sourceDate),
            gte(workItems.sourceDate, startDate),
            lt(workItems.sourceDate, endDate)
          ),
          // OR items that were created in recent period
          and(
            gte(workItems.createdAt, startDate),
            lt(workItems.createdAt, endDate)
          )
        )
      );
    } else {
      if (includeNullDates) {
        // Items with NULL sourceDate OR items after startDate
        filters.push(
          or(
            isNull(workItems.sourceDate),
            gte(workItems.sourceDate, startDate)
          )
        );
      } else {
        // Only items after startDate
        filters.push(
          and(
            isNotNull(workItems.sourceDate),
            gte(workItems.sourceDate, startDate)
          )
        );
      }
    }
  } else if (endDate && isValidDate(endDate)) {
    console.log('📅 Adding end date filter:', endDate.toISOString());
    if (includeNullDates) {
      // Items with NULL sourceDate OR items before endDate
      filters.push(
        or(
          isNull(workItems.sourceDate),
          lt(workItems.sourceDate, endDate)
        )
      );
    } else {
      // Only items before endDate
      filters.push(
        and(
          isNotNull(workItems.sourceDate),
          lt(workItems.sourceDate, endDate)
        )
      );
    }
  }

  return filters;
};

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Work item methods
  getWorkItems(userId: number, options?: {
    limit?: number;
    offset?: number;
    classification?: string;
    isCompleted?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<WorkItem[]>;
  getWorkItem(id: number): Promise<WorkItem | undefined>;
  getWorkItemBySourceId(userId: number, sourceType: string, sourceId: string): Promise<WorkItem | undefined>;
  createWorkItem(workItem: InsertWorkItem): Promise<WorkItem>;
  updateWorkItem(updates: UpdateWorkItem): Promise<WorkItem | undefined>;
  deleteWorkItem(id: number): Promise<boolean>;
  getWorkItemsByClassification(userId: number, classification: string): Promise<WorkItem[]>;

  // Cache management
  clearWorkItemsCache(userId: number): void;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error('❌ Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      console.log('✅ User created:', user.id);
      return user;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return user || undefined;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return undefined;
    }
  }

  // Work item methods
  async getWorkItems(userId: number, options: {
    limit?: number;
    offset?: number;
    classification?: string;
    isCompleted?: boolean;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<WorkItem[]> {

    try {
      // 🔧 VALIDATE INPUT PARAMETERS
      if (!userId || isNaN(userId) || userId <= 0) {
        console.warn('⚠️ Invalid userId provided to getWorkItems:', userId);
        return [];
      }

      // 🔧 VALIDATE DATE OPTIONS
      if (options.startDate && !isValidDate(options.startDate)) {
        console.warn('⚠️ Invalid startDate provided:', options.startDate);
        options.startDate = undefined;
      }

      if (options.endDate && !isValidDate(options.endDate)) {
        console.warn('⚠️ Invalid endDate provided:', options.endDate);
        options.endDate = undefined;
      }

      // 🔧 VALIDATE DATE RANGE
      if (options.startDate && options.endDate && options.startDate >= options.endDate) {
        console.warn('⚠️ Invalid date range in getWorkItems:', {
          startDate: options.startDate.toISOString(),
          endDate: options.endDate.toISOString()
        });
        return [];
      }

      const cacheKey = getCacheKey(userId, options);
      const cached = workItemsCache.get(cacheKey);

      if (cached && isCacheValid(cached.timestamp)) {
        console.log(` Cache hit for user ${userId}, returned ${cached.data.length} items in 0ms`);
        return cached.data;
      }

      console.log(`🔍 Database query starting for user ${userId} with options:`, {
        limit: options.limit,
        offset: options.offset,
        classification: options.classification,
        isCompleted: options.isCompleted,
        startDate: options.startDate?.toISOString(),
        endDate: options.endDate?.toISOString()
      });

      // 🔧 BUILD ALL WHERE CONDITIONS
      const whereConditions = [eq(workItems.userId, userId)];

      // Add classification filter
      if (options.classification && typeof options.classification === 'string') {
        whereConditions.push(eq(workItems.classification, options.classification));
      }

      // Add completion status filter
      if (options.isCompleted !== undefined && typeof options.isCompleted === 'boolean') {
        whereConditions.push(eq(workItems.isCompleted, options.isCompleted));
      }

      // Add date filters
      // PERFORMANCE OPTIMIZATION: Always exclude NULL dates for better index usage
      // We'll handle NULL sourceDate items separately if needed by the application
      const dateFilters = buildDateFilters(options.startDate, options.endDate, false); // Always exclude NULLs
      if (dateFilters && dateFilters.length > 0) {
        const validFilters = dateFilters.filter(f => f !== undefined);
        if (validFilters.length > 0) {
          whereConditions.push(...validFilters);
        }
      } else {
        // For general queries without date filters, still exclude NULL dates for performance
        // This means we only show items that have actual source dates
        whereConditions.push(isNotNull(workItems.sourceDate));
      }      // 🔧 BUILD QUERY WITH ALL CONDITIONS AND PAGINATION
      let queryBuilder: any = db.select().from(workItems).where(and(...whereConditions))
        .orderBy(desc(workItems.urgencyScore), desc(workItems.createdAt));

      // 🔧 APPLY PAGINATION
      if (options.limit && options.limit > 0) {
        queryBuilder = queryBuilder.limit(options.limit);
      }
      if (options.offset && options.offset >= 0) {
        queryBuilder = queryBuilder.offset(options.offset);
      }

      const startTime = Date.now();
      const items = await queryBuilder;
      const duration = Date.now() - startTime;

      console.log(`📊 Database query completed in ${duration}ms for user ${userId}, returned ${items.length} items`);

      if (duration > 2000) {
        console.warn(`⚠️ Slow query detected: ${duration}ms for ${items.length} items`);
      }

      // 🔧 VALIDATE RETURNED ITEMS
      const validItems = items.filter((item: any) => {
        if (!validateWorkItem(item)) {
          console.warn('⚠️ Invalid work item returned from database:', item);
          return false;
        }
        return true;
      });

      if (validItems.length !== items.length) {
        console.warn(`⚠️ Filtered out ${items.length - validItems.length} invalid items from database results`);
      }

      // 🔧 CACHE VALID RESULTS
      workItemsCache.set(cacheKey, { data: validItems, timestamp: Date.now() });

      console.log(`📊 Returning ${validItems.length} valid work items for user ${userId}`);
      return validItems;

    } catch (error) {
      console.error('❌ Database query failed in getWorkItems:', error);
      console.error('❌ Error details:', {
        userId,
        options,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  }

  // Clear cache when work items are modified
  clearWorkItemsCache(userId: number): void {
    const keysToDelete = Array.from(workItemsCache.keys()).filter(key => key.startsWith(`${userId}-`));
    keysToDelete.forEach(key => workItemsCache.delete(key));
    console.log(`🗑️ Cleared cache for user ${userId} (${keysToDelete.length} entries)`);
  }

  async getWorkItem(id: number): Promise<WorkItem | undefined> {
    try {
      const [item] = await db.select().from(workItems).where(eq(workItems.id, id));
      return item || undefined;
    } catch (error) {
      console.error('❌ Error getting work item:', error);
      return undefined;
    }
  }

  async getWorkItemBySourceId(userId: number, sourceType: string, sourceId: string): Promise<WorkItem | undefined> {
    try {
      const [item] = await db.select().from(workItems).where(and(eq(workItems.userId, userId), eq(workItems.sourceType, sourceType), eq(workItems.sourceId, sourceId)));
      return item || undefined;
    } catch (error) {
      console.error('❌ Error getting work item by source ID:', error);
      return undefined;
    }
  }

  async createWorkItem(insertWorkItem: InsertWorkItem): Promise<WorkItem> {
    try {
      const [item] = await db
        .insert(workItems)
        .values(insertWorkItem)
        .returning();
      console.log('✅ Work item created:', item.id);

      // Clear cache for this user since we added a new item
      this.clearWorkItemsCache(insertWorkItem.userId);

      return item;
    } catch (error) {
      console.error('❌ Error creating work item:', error);
      throw error;
    }
  }

  async updateWorkItem(updates: UpdateWorkItem): Promise<WorkItem | undefined> {
    try {
      const { id, ...updateData } = updates;
      const [item] = await db
        .update(workItems)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(workItems.id, id))
        .returning();

      if (item) {
        // Clear cache for this user since we modified an item
        this.clearWorkItemsCache(item.userId);
      }

      return item || undefined;
    } catch (error) {
      console.error('❌ Error updating work item:', error);
      return undefined;
    }
  }

  async deleteWorkItem(id: number): Promise<boolean> {
    try {
      // Get the item first to know the userId for cache clearing
      const [item] = await db.select().from(workItems).where(eq(workItems.id, id));

      const result = await db.delete(workItems).where(eq(workItems.id, id));
      const deleted = (result.rowCount || 0) > 0;

      if (deleted && item) {
        // Clear cache for this user since we deleted an item
        this.clearWorkItemsCache(item.userId);
      }

      return deleted;
    } catch (error) {
      console.error('❌ Error deleting work item:', error);
      return false;
    }
  }

  async getWorkItemsByClassification(userId: number, classification: string): Promise<WorkItem[]> {
    try {
      const items = await db
        .select()
        .from(workItems)
        .where(and(eq(workItems.userId, userId), eq(workItems.classification, classification)));
      return items;
    } catch (error) {
      console.error('❌ Error getting work items by classification:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
