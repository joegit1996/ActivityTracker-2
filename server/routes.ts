import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { completeTaskSchema, insertMilestoneSchema, insertAdminSchema } from "@shared/schema";
import { getLocalizedCampaign, getLocalizedMilestone, type SupportedLanguage } from "@shared/utils";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// JWT Secret - should be in environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// JWT Authentication middleware for admin routes
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, admin: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.admin = admin;
    next();
  });
};

// Rate limiting for milestone completion
const milestoneRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many completion attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware for API token validation
function validateApiToken(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const validToken = process.env.API_TOKEN || process.env.WEBHOOK_TOKEN || 'ea86ee11694aa30b0723961ef65b76a31418e23c1c5430fc66d7f1cf2a00585a';
  
  if (!token || token !== validToken) {
    return res.status(401).json({ error: "Unauthorized: Invalid API token" });
  }
  
  next();
}

// Input validation middleware
function validateInput(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      req.validatedData = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      next(error);
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
    next();
  });

  // Get user progress
  app.get("/api/progress/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Detect language from query parameter, referer, or default to English
      const language: SupportedLanguage = (req.query.lang as string) === 'ar' ? 'ar' : 'en';

      // Get active campaign
      const activeCampaign = await storage.getActiveCampaign();
      if (!activeCampaign) {
        return res.status(404).json({ error: "No active campaign found" });
      }

      // Get user completions for active campaign
      const completions = await storage.getUserCompletions(userId, activeCampaign.id);
      
      // Calculate which days are fully completed (all milestones for that day done)
      const fullyCompletedDays = new Set<number>();
      
      for (let day = 1; day <= activeCampaign.total_days; day++) {
        const dayMilestones = await storage.getMilestonesByDay(activeCampaign.id, day);
        const dayCompletions = completions.filter(c => c.day_number === day);
        
        // Check if ALL specific milestones for this day are completed
        const completedMilestoneIds = dayCompletions.map(c => c.milestone_id);
        const allMilestonesCompleted = dayMilestones.every(milestone => 
          completedMilestoneIds.includes(milestone.id)
        );
        
        if (dayMilestones.length > 0 && allMilestonesCompleted) {
          fullyCompletedDays.add(day);
        }
      }
      
      const completedDays = fullyCompletedDays.size;
      const currentDay = Math.min(completedDays + 1, activeCampaign.total_days);
      const percentage = Math.round((completedDays / activeCampaign.total_days) * 100);

      // Get current day milestones
      const currentDayMilestones = await storage.getMilestonesByDay(activeCampaign.id, currentDay);
      
      // Check which current day milestones are completed
      const tasksWithCompletion = await Promise.all(
        currentDayMilestones.map(async (milestone) => {
          const completed = await storage.isTaskCompleted(userId, milestone.id);
          const localizedMilestone = getLocalizedMilestone(milestone, language);
          return {
            id: milestone.id,
            title: localizedMilestone.title,
            description: localizedMilestone.description,
            completed,
            number: milestone.order_index + 1
          };
        })
      );

      // Get completed days for previous days display (only fully completed days)
      const previousDays = Array.from(fullyCompletedDays)
        .filter(day => day < currentDay)
        .sort((a, b) => b - a)
        .map(dayNumber => {
          const dayCompletions = completions.filter(c => c.day_number === dayNumber);
          const latestCompletion = dayCompletions.sort((a, b) => 
            new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
          )[0];
          
          return {
            number: dayNumber,
            completedAt: latestCompletion?.completed_at
          };
        });

      const localizedCampaign = getLocalizedCampaign(activeCampaign, language);
      
      res.json({
        campaign: localizedCampaign,
        progress: {
          currentDay,
          completedDays,
          percentage
        },
        streak: {
          currentDays: completedDays
        },
        tasks: tasksWithCompletion,
        previousDays,
        nextDay: currentDay < activeCampaign.total_days ? currentDay + 1 : null
      });

    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Complete milestone (secure webhook endpoint)
  app.post("/api/milestone/complete", 
    milestoneRateLimit,
    validateApiToken,
    validateInput(completeTaskSchema),
    async (req: any, res) => {
      try {
        const { user_id, campaign_id, day_number, milestone_id } = req.validatedData;

        // Auto-create user if they don't exist
        let user = await storage.getUser(user_id);
        if (!user) {
          user = await storage.createUser({ name: `User ${user_id}` });
        }

        // Verify active campaign
        const activeCampaign = await storage.getActiveCampaign();
        if (!activeCampaign || activeCampaign.id !== campaign_id) {
          return res.status(400).json({ error: "Invalid or inactive campaign" });
        }

        // Verify milestone exists and belongs to the campaign
        const milestone = await storage.getMilestone(milestone_id);
        if (!milestone || milestone.campaign_id !== campaign_id || milestone.day_number !== day_number) {
          return res.status(400).json({ error: "Invalid milestone" });
        }

        // Check if current day is correct
        const userCompletions = await storage.getUserCompletions(user_id, campaign_id);
        
        // Calculate which days are fully completed (all milestones for that day done)
        const fullyCompletedDays = new Set<number>();
        
        for (let day = 1; day <= activeCampaign.total_days; day++) {
          const dayMilestones = await storage.getMilestonesByDay(activeCampaign.id, day);
          const dayCompletions = userCompletions.filter(c => c.day_number === day);
          
          // Check if ALL specific milestones for this day are completed
          const completedMilestoneIds = dayCompletions.map(c => c.milestone_id);
          const allMilestonesCompleted = dayMilestones.every(milestone => 
            completedMilestoneIds.includes(milestone.id)
          );
          
          if (dayMilestones.length > 0 && allMilestonesCompleted) {
            fullyCompletedDays.add(day);
          }
        }
        
        const completedDays = fullyCompletedDays.size;
        const currentDay = Math.min(completedDays + 1, activeCampaign.total_days);

        if (day_number !== currentDay) {
          return res.status(400).json({ error: "Can only complete milestones for current day" });
        }

        // Check if already completed
        const alreadyCompleted = await storage.isTaskCompleted(user_id, milestone_id);
        if (alreadyCompleted) {
          return res.status(400).json({ error: "Milestone already completed" });
        }

        // Complete the milestone
        const completion = await storage.completeMilestone({
          user_id,
          campaign_id,
          day_number,
          milestone_id
        });

        // Get updated progress
        const updatedCompletions = await storage.getUserCompletions(user_id, campaign_id);
        const updatedCompletedDays = new Set(updatedCompletions.map(c => c.day_number)).size;
        const updatedPercentage = Math.round((updatedCompletedDays / activeCampaign.total_days) * 100);

        res.json({
          success: true,
          completion,
          progress: {
            currentDay: Math.min(updatedCompletedDays + 1, activeCampaign.total_days),
            completedDays: updatedCompletedDays,
            percentage: updatedPercentage
          }
        });

      } catch (error) {
        console.error("Error completing milestone:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  // Admin API endpoints
  
  // Campaigns CRUD
  app.get("/api/admin/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/campaigns", async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.updateCampaign(id, req.body);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCampaign(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Milestones CRUD
  app.get("/api/admin/campaigns/:campaignId/milestones", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const milestones = await storage.getMilestonesByCampaign(campaignId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/milestones", 
    validateInput(insertMilestoneSchema),
    async (req: any, res) => {
    try {
      const milestone = await storage.createMilestone(req.validatedData);
      res.json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/milestones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const milestone = await storage.updateMilestone(id, req.body);
      res.json(milestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/milestones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMilestone(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting milestone:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Completions data
  app.get("/api/admin/completions", async (req, res) => {
    try {
      const completions = await storage.getAllCompletions();
      res.json(completions);
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a user (for testing purposes)
  app.post("/api/users", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const user = await storage.createUser({ name });
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
