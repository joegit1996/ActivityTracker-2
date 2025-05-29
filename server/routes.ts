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

// In-memory token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set<string>();

// JWT Authentication middleware for admin routes
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    return res.status(403).json({ error: 'Token has been invalidated' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, admin: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Check token expiration for session timeout
    const currentTime = Math.floor(Date.now() / 1000);
    if (admin.exp && admin.exp < currentTime) {
      return res.status(403).json({ error: 'Session expired' });
    }
    
    req.admin = admin;
    req.token = token; // Store token for potential blacklisting
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

  // Admin Authentication Routes

  // POST /api/admin/login - Admin login endpoint
  app.post('/api/admin/login', validateInput(z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required")
  })), async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find admin by username
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: admin.id, 
          username: admin.username, 
          role: admin.role 
        },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      // Return token and admin info (without password)
      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/admin/me - Get current admin info from token
  app.get('/api/admin/me', authenticateToken, async (req, res) => {
    try {
      const admin = await storage.getAdmin(req.admin.id);
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      // Return admin info without password
      res.json({
        id: admin.id,
        username: admin.username,
        role: admin.role
      });
    } catch (error) {
      console.error('Get admin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/admin/logout - Logout admin and blacklist token
  app.post('/api/admin/logout', authenticateToken, (req: any, res) => {
    try {
      // Add token to blacklist
      const token = req.token;
      if (token) {
        tokenBlacklist.add(token);
      }
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET user progress for specific campaign
  app.get("/api/progress/:userId/:campaignId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const campaignId = parseInt(req.params.campaignId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      // Detect language from query parameter, referer, or default to English
      const language: SupportedLanguage = (req.query.lang as string) === 'ar' ? 'ar' : 'en';

      // Get specified campaign
      const activeCampaign = await storage.getCampaign(campaignId);
      if (!activeCampaign) {
        return res.status(404).json({ error: `Campaign with ID ${campaignId} not found` });
      }

      // Get user completions for specified campaign
      const completions = await storage.getUserCompletions(userId, activeCampaign.id);
      
      // Calculate progress
      const totalMilestones = await storage.getMilestonesByCampaign(activeCampaign.id);
      const completedMilestones = completions.length;
      
      // Find current day (first day with incomplete milestones)
      let currentDay = 1;
      for (let day = 1; day <= activeCampaign.total_days; day++) {
        const dayMilestones = await storage.getMilestonesByDay(activeCampaign.id, day);
        const dayCompletions = await storage.getUserDayCompletions(userId, activeCampaign.id, day);
        
        if (dayCompletions.length < dayMilestones.length) {
          currentDay = day;
          break;
        }
        if (day === activeCampaign.total_days) {
          currentDay = day + 1; // All days completed
        }
      }
      
      // Calculate completed days
      let completedDays = 0;
      for (let day = 1; day < currentDay && day <= activeCampaign.total_days; day++) {
        const dayMilestones = await storage.getMilestonesByDay(activeCampaign.id, day);
        const dayCompletions = await storage.getUserDayCompletions(userId, activeCampaign.id, day);
        
        if (dayCompletions.length === dayMilestones.length && dayMilestones.length > 0) {
          completedDays++;
        }
      }
      
      const percentage = Math.round((completedDays / activeCampaign.total_days) * 100);
      
      // Get current day tasks if not completed
      const currentDayMilestones = currentDay <= activeCampaign.total_days 
        ? await storage.getMilestonesByDay(activeCampaign.id, currentDay)
        : [];
      
      const currentDayCompletions = currentDay <= activeCampaign.total_days
        ? await storage.getUserDayCompletions(userId, activeCampaign.id, currentDay)
        : [];
      
      const tasksWithCompletion = currentDayMilestones.map((milestone, index) => {
        const isCompleted = currentDayCompletions.some(completion => completion.milestone_id === milestone.id);
        const localizedMilestone = getLocalizedMilestone(milestone, language);
        
        return {
          id: milestone.id,
          title: localizedMilestone.title,
          description: localizedMilestone.description,
          completed: isCompleted,
          number: index + 1
        };
      });
      
      // Get previous completed days
      const previousDays = [];
      for (let day = 1; day < currentDay && day <= activeCampaign.total_days; day++) {
        const dayMilestones = await storage.getMilestonesByDay(activeCampaign.id, day);
        const dayCompletions = await storage.getUserDayCompletions(userId, activeCampaign.id, day);
        
        if (dayCompletions.length === dayMilestones.length && dayMilestones.length > 0) {
          // Find the latest completion time for this day
          const latestCompletion = dayCompletions.reduce((latest, completion) => {
            return new Date(completion.completed_at) > new Date(latest.completed_at) ? completion : latest;
          });
          
          previousDays.push({
            number: day,
            completedAt: latestCompletion.completed_at
          });
        }
      }
      
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

  // Get user progress for active campaign
  app.get("/api/progress/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Detect language from query parameter, referer, or default to English
      const language: SupportedLanguage = (req.query.lang as string) === 'ar' ? 'ar' : 'en';

      // Get active campaign (fallback for legacy route)
      const activeCampaign = await storage.getActiveCampaign();
      if (!activeCampaign) {
        return res.status(404).json({ error: "No active campaign found" });
      }

      // Get user completions for the active campaign
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

        // Auto-create user if they don't exist (using exact user_id)
        let user = await storage.getUser(user_id);
        if (!user) {
          user = await storage.createUserWithId(user_id, `User ${user_id}`);
        }

        // Verify campaign exists and is active
        const campaign = await storage.getCampaign(campaign_id);
        if (!campaign) {
          return res.status(400).json({ error: "Campaign not found" });
        }
        if (!campaign.is_active) {
          return res.status(400).json({ error: "Campaign is not active" });
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
        
        for (let day = 1; day <= campaign.total_days; day++) {
          const dayMilestones = await storage.getMilestonesByDay(campaign.id, day);
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
        const currentDay = Math.min(completedDays + 1, campaign.total_days);

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

        // Get updated progress - recalculate fully completed days
        const updatedCompletions = await storage.getUserCompletions(user_id, campaign_id);
        const updatedFullyCompletedDays = new Set<number>();
        
        for (let day = 1; day <= campaign.total_days; day++) {
          const dayMilestones = await storage.getMilestonesByDay(campaign.id, day);
          const dayCompletions = updatedCompletions.filter(c => c.day_number === day);
          
          // Check if ALL specific milestones for this day are completed
          const completedMilestoneIds = dayCompletions.map(c => c.milestone_id);
          const allMilestonesCompleted = dayMilestones.every(milestone => 
            completedMilestoneIds.includes(milestone.id)
          );
          
          if (dayMilestones.length > 0 && allMilestonesCompleted) {
            updatedFullyCompletedDays.add(day);
          }
        }
        
        const updatedCompletedDays = updatedFullyCompletedDays.size;
        const updatedPercentage = Math.round((updatedCompletedDays / campaign.total_days) * 100);

        // Check if user completed entire campaign
        if (updatedPercentage === 100 && updatedCompletedDays === campaign.total_days) {
          // Check if already marked as campaign completer
          const alreadyCompleted = await storage.isCampaignCompleted(user_id, campaign_id);
          if (!alreadyCompleted) {
            // Mark user as campaign completer
            await storage.markCampaignComplete(user_id, campaign_id);
          }
        }

        res.json({
          success: true,
          completion,
          progress: {
            currentDay: Math.min(updatedCompletedDays + 1, campaign.total_days),
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

  // Admin Management endpoints - All protected with JWT authentication
  
  // Campaigns CRUD
  app.get("/api/admin/campaigns", authenticateToken, async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/campaigns", authenticateToken, async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/campaigns/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.updateCampaign(id, req.body);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/campaigns/:id", authenticateToken, async (req, res) => {
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
  app.get("/api/admin/campaigns/:campaignId/milestones", authenticateToken, async (req, res) => {
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
    authenticateToken,
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

  app.put("/api/admin/milestones/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const milestone = await storage.updateMilestone(id, req.body);
      res.json(milestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/milestones/:id", authenticateToken, async (req, res) => {
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
  app.get("/api/admin/completions", authenticateToken, async (req, res) => {
    try {
      const completions = await storage.getAllCompletions();
      res.json(completions);
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Campaign completions data
  app.get("/api/admin/campaign-completions", authenticateToken, async (req, res) => {
    try {
      const completions = await storage.getAllCampaignCompletions();
      res.json(completions);
    } catch (error) {
      console.error("Error fetching campaign completions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/campaign-completions/:campaignId", authenticateToken, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      const completions = await storage.getCampaignCompletions(campaignId);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching campaign completions:", error);
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
