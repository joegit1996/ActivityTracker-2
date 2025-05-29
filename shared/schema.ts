import { pgTable, text, serial, integer, boolean, timestamp, varchar, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey(),
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
  reward_code_en: text("reward_code_en"),
  reward_code_ar: text("reward_code_ar"),
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

// Admins table for authentication
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // bcrypt hashed password
  role: varchar("role", { length: 20 }).notNull().default("editor"), // superadmin, editor
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Campaign completions table - tracks users who completed entire campaigns
export const campaign_completions = pgTable("campaign_completions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id),
  completed_at: timestamp("completed_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserCampaign: unique("unique_user_campaign").on(table.user_id, table.campaign_id),
}));

// Relations
export const campaignsRelations = relations(campaigns, ({ many }) => ({
  milestones: many(milestones),
  completions: many(milestone_completions),
  campaignCompletions: many(campaign_completions),
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
  campaignCompletions: many(campaign_completions),
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

export const campaignCompletionsRelations = relations(campaign_completions, ({ one }) => ({
  user: one(users, {
    fields: [campaign_completions.user_id],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [campaign_completions.campaign_id],
    references: [campaigns.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);

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

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  created_at: true,
});

export const insertCampaignCompletionSchema = createInsertSchema(campaign_completions).omit({
  id: true,
  completed_at: true,
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

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type CampaignCompletion = typeof campaign_completions.$inferSelect;
export type InsertCampaignCompletion = z.infer<typeof insertCampaignCompletionSchema>;

// API schemas
export const completeTaskSchema = z.object({
  user_id: z.coerce.number(),
  campaign_id: z.coerce.number(),
  day_number: z.coerce.number(),
  milestone_id: z.coerce.number(),
});

export type CompleteTaskRequest = z.infer<typeof completeTaskSchema>;
