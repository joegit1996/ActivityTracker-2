import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { completeTaskSchema } from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";

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
  const validToken = process.env.API_TOKEN || process.env.WEBHOOK_TOKEN || 'default_secure_token';
  
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

      // Get active campaign
      const activeCampaign = await storage.getActiveCampaign();
      if (!activeCampaign) {
        return res.status(404).json({ error: "No active campaign found" });
      }

      // Get user completions for active campaign
      const completions = await storage.getUserCompletions(userId, activeCampaign.id);
      
      // Calculate progress
      const completedDays = new Set(completions.map(c => c.day_number)).size;
      const currentDay = Math.min(completedDays + 1, activeCampaign.total_days);
      const percentage = Math.round((completedDays / activeCampaign.total_days) * 100);

      // Get current day milestones
      const currentDayMilestones = await storage.getMilestonesByDay(activeCampaign.id, currentDay);
      
      // Check which current day milestones are completed
      const tasksWithCompletion = await Promise.all(
        currentDayMilestones.map(async (milestone) => {
          const completed = await storage.isTaskCompleted(userId, milestone.id);
          return {
            id: milestone.id,
            title: milestone.title,
            description: milestone.description,
            completed,
            number: milestone.order_index + 1
          };
        })
      );

      // Get completed days for previous days display
      const completedDayNumbers = Array.from(new Set(completions.map(c => c.day_number)))
        .filter(day => day < currentDay)
        .sort((a, b) => b - a);

      const previousDays = completedDayNumbers.map(dayNumber => {
        const dayCompletions = completions.filter(c => c.day_number === dayNumber);
        const latestCompletion = dayCompletions.sort((a, b) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )[0];
        
        return {
          number: dayNumber,
          completedAt: latestCompletion?.completed_at
        };
      });

      res.json({
        campaign: {
          id: activeCampaign.id,
          title: activeCampaign.title,
          description: activeCampaign.description,
          totalDays: activeCampaign.total_days,
          reward: {
            title: activeCampaign.reward_title,
            description: activeCampaign.reward_description
          }
        },
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
        const completedDays = new Set(userCompletions.map(c => c.day_number)).size;
        const currentDay = completedDays + 1;

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
