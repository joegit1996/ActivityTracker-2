import { 
  users, campaigns, milestones, milestone_completions,
  type User, type InsertUser,
  type Campaign, type InsertCampaign,
  type Milestone, type InsertMilestone,
  type MilestoneCompletion, type InsertMilestoneCompletion
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Campaigns
  getActiveCampaign(): Promise<Campaign | undefined>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;

  // Milestones
  getMilestonesByDay(campaignId: number, dayNumber: number): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;

  // Completions
  getUserCompletions(userId: number, campaignId: number): Promise<MilestoneCompletion[]>;
  getUserDayCompletions(userId: number, campaignId: number, dayNumber: number): Promise<MilestoneCompletion[]>;
  completeMilestone(completion: InsertMilestoneCompletion): Promise<MilestoneCompletion>;
  isTaskCompleted(userId: number, milestoneId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getActiveCampaign(): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.is_active, true));
    return campaign || undefined;
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async getMilestonesByDay(campaignId: number, dayNumber: number): Promise<Milestone[]> {
    return await db
      .select()
      .from(milestones)
      .where(
        and(
          eq(milestones.campaign_id, campaignId),
          eq(milestones.day_number, dayNumber)
        )
      )
      .orderBy(milestones.order_index);
  }

  async getMilestone(id: number): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone || undefined;
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db
      .insert(milestones)
      .values(insertMilestone)
      .returning();
    return milestone;
  }

  async getUserCompletions(userId: number, campaignId: number): Promise<MilestoneCompletion[]> {
    return await db
      .select()
      .from(milestone_completions)
      .where(
        and(
          eq(milestone_completions.user_id, userId),
          eq(milestone_completions.campaign_id, campaignId)
        )
      )
      .orderBy(desc(milestone_completions.completed_at));
  }

  async getUserDayCompletions(userId: number, campaignId: number, dayNumber: number): Promise<MilestoneCompletion[]> {
    return await db
      .select()
      .from(milestone_completions)
      .where(
        and(
          eq(milestone_completions.user_id, userId),
          eq(milestone_completions.campaign_id, campaignId),
          eq(milestone_completions.day_number, dayNumber)
        )
      );
  }

  async completeMilestone(insertCompletion: InsertMilestoneCompletion): Promise<MilestoneCompletion> {
    const [completion] = await db
      .insert(milestone_completions)
      .values(insertCompletion)
      .returning();
    return completion;
  }

  async isTaskCompleted(userId: number, milestoneId: number): Promise<boolean> {
    const [completion] = await db
      .select()
      .from(milestone_completions)
      .where(
        and(
          eq(milestone_completions.user_id, userId),
          eq(milestone_completions.milestone_id, milestoneId)
        )
      );
    return !!completion;
  }
}

export const storage = new DatabaseStorage();
