import { 
  users, campaigns, milestones, milestone_completions, admins,
  type User, type InsertUser,
  type Campaign, type InsertCampaign,
  type Milestone, type InsertMilestone,
  type MilestoneCompletion, type InsertMilestoneCompletion,
  type Admin, type InsertAdmin
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithId(id: number, name: string): Promise<User>;

  // Campaigns
  getActiveCampaign(): Promise<Campaign | undefined>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  getAllCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign>;
  deleteCampaign(id: number): Promise<void>;

  // Milestones
  getMilestonesByDay(campaignId: number, dayNumber: number): Promise<Milestone[]>;
  getMilestonesByCampaign(campaignId: number): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, milestone: Partial<InsertMilestone>): Promise<Milestone>;
  deleteMilestone(id: number): Promise<void>;

  // Completions
  getUserCompletions(userId: number, campaignId: number): Promise<MilestoneCompletion[]>;
  getUserDayCompletions(userId: number, campaignId: number, dayNumber: number): Promise<MilestoneCompletion[]>;
  getAllCompletions(): Promise<MilestoneCompletion[]>;
  completeMilestone(completion: InsertMilestoneCompletion): Promise<MilestoneCompletion>;
  isTaskCompleted(userId: number, milestoneId: number): Promise<boolean>;

  // Admins
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdmin(id: number): Promise<Admin | undefined>;
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

  async createUserWithId(id: number, name: string): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ id, name, language: "en" })
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

  async getAllCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.id));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaign(id: number, updateData: Partial<InsertCampaign>): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: number): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
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

  async getMilestonesByCampaign(campaignId: number): Promise<Milestone[]> {
    return await db
      .select()
      .from(milestones)
      .where(eq(milestones.campaign_id, campaignId))
      .orderBy(milestones.day_number, milestones.order_index);
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

  async updateMilestone(id: number, updateData: Partial<InsertMilestone>): Promise<Milestone> {
    const [milestone] = await db
      .update(milestones)
      .set(updateData)
      .where(eq(milestones.id, id))
      .returning();
    return milestone;
  }

  async deleteMilestone(id: number): Promise<void> {
    await db.delete(milestones).where(eq(milestones.id, id));
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

  async getAllCompletions(): Promise<MilestoneCompletion[]> {
    return await db
      .select()
      .from(milestone_completions)
      .orderBy(desc(milestone_completions.completed_at));
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

  // Admin authentication methods
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username));
    return admin || undefined;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db
      .insert(admins)
      .values(insertAdmin)
      .returning();
    return admin;
  }

  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, id));
    return admin || undefined;
  }
}

export const storage = new DatabaseStorage();
