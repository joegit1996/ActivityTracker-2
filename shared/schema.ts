import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  language: text("language").default("en").notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title_en: text("title_en").notNull(),
  title_ar: text("title_ar").notNull(),
  description_en: text("description_en").notNull(),
  description_ar: text("description_ar").notNull(),
  reward_title_en: text("reward_title_en").notNull(),
  reward_title_ar: text("reward_title_ar").notNull(),
  reward_description_en: text("reward_description_en").notNull(),
  reward_description_ar: text("reward_description_ar").notNull(),
  total_days: integer("total_days").notNull(),
  is_active: boolean("is_active").default(false),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").notNull(),
  day_number: integer("day_number").notNull(),
  title_en: text("title_en").notNull(),
  title_ar: text("title_ar").notNull(),
  description_en: text("description_en").notNull(),
  description_ar: text("description_ar").notNull(),
  order_index: integer("order_index").notNull().default(0),
});

export const milestone_completions = pgTable("milestone_completions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  campaign_id: integer("campaign_id").notNull(),
  day_number: integer("day_number").notNull(),
  milestone_id: integer("milestone_id").notNull(),
  completed_at: timestamp("completed_at").defaultNow().notNull(),
});

export const admin_users = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const campaignsRelations = relations(campaigns, ({ many }) => ({
  milestones: many(milestones),
  completions: many(milestone_completions),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [milestones.campaign_id],
    references: [campaigns.id],
  }),
  completions: many(milestone_completions),
}));

export const usersRelations = relations(users, ({ many }) => ({
  completions: many(milestone_completions),
}));

export const milestoneCompletionsRelations = relations(milestone_completions, ({ one }) => ({
  user: one(users, {
    fields: [milestone_completions.user_id],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [milestone_completions.campaign_id],
    references: [campaigns.id],
  }),
  milestone: one(milestones, {
    fields: [milestone_completions.milestone_id],
    references: [milestones.id],
  }),
}));

export const adminUsersRelations = relations(admin_users, ({ many }) => ({}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
});

export const insertMilestoneCompletionSchema = createInsertSchema(milestone_completions).omit({
  id: true,
  completed_at: true,
});

export const insertAdminUserSchema = createInsertSchema(admin_users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type MilestoneCompletion = typeof milestone_completions.$inferSelect;
export type InsertMilestoneCompletion = z.infer<typeof insertMilestoneCompletionSchema>;

export type AdminUser = typeof admin_users.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

// API schemas
export const completeTaskSchema = z.object({
  user_id: z.number(),
  campaign_id: z.number(),
  day_number: z.number(),
  milestone_id: z.number(),
});

export type CompleteTaskRequest = z.infer<typeof completeTaskSchema>;

// Auth schemas
export const adminLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
export type CreateAdminRequest = z.infer<typeof createAdminSchema>;
