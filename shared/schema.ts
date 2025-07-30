import { boolean, index, integer, json, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password'),
  gmailToken: text('gmail_token'),
  slackToken: text('slack_token'),
  createdAt: timestamp('created_at').defaultNow()
});

export const workItems = pgTable('work_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  sourceType: text('source_type').notNull(), // "gmail", "slack", "notion", "jira", "drive"
  sourceId: text('source_id').notNull(),
  sourceUrl: text('source_url'),
  sourceDate: timestamp('source_date'), // Actual email/message date
  classification: text('classification').notNull(), // "urgent", "fyi", "ignore"
  summary: text('summary').notNull(),
  actionItems: json('action_items').$type<string[]>().default([]),
  sentiment: text('sentiment'), // "positive", "neutral", "negative"
  urgencyScore: integer('urgency_score'), // 1-5
  effortEstimate: text('effort_estimate'), // "quick", "medium", "long"
  deadline: text('deadline'), // "today", "this_week", "next_week", "no_deadline"
  contextTags: json('context_tags').$type<string[]>(),
  stakeholders: json('stakeholders').$type<string[]>(),
  businessImpact: text('business_impact'), // "high", "medium", "low"
  followUpNeeded: boolean('follow_up_needed').default(false),
  isCompleted: boolean('is_completed').default(false),
  isSnoozed: boolean('is_snoozed').default(false),
  snoozeUntil: timestamp('snooze_until'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  // Performance indexes for common queries
  userIdIdx: index('work_items_user_id_idx').on(table.userId),
  userIdUrgencyIdx: index('work_items_user_urgency_idx').on(table.userId, table.urgencyScore),
  userIdCreatedIdx: index('work_items_user_created_idx').on(table.userId, table.createdAt),
  sourceIdIdx: index('work_items_source_id_idx').on(table.userId, table.sourceType, table.sourceId),
  classificationIdx: index('work_items_classification_idx').on(table.userId, table.classification),
  isCompletedIdx: index('work_items_completed_idx').on(table.userId, table.isCompleted)
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
}).extend({
  password: z.string().optional(),
});

export const insertWorkItemSchema = createInsertSchema(workItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWorkItemSchema = insertWorkItemSchema.partial().extend({
  id: z.number(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWorkItem = z.infer<typeof insertWorkItemSchema>;
export type UpdateWorkItem = z.infer<typeof updateWorkItemSchema>;
export type WorkItem = typeof workItems.$inferSelect;
