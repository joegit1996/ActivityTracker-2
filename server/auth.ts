import bcrypt from "bcrypt";
import session from "express-session";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { AdminUser } from "@shared/schema";

const SALT_ROUNDS = 12;

// Session configuration
export function configureSession() {
  return session({
    secret: process.env.SESSION_SECRET || "your-super-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  });
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Authentication middleware
declare module "express-session" {
  interface SessionData {
    adminId?: number;
    adminUsername?: string;
  }
}

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
  validatedData?: any;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const admin = await storage.getAdminByUsername(req.session.adminUsername!);
    if (!admin || !admin.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Invalid session" });
    }
    
    req.adminUser = admin;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
}

// Check if user is authenticated (for optional auth)
export async function checkAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.session.adminId) {
    try {
      const admin = await storage.getAdminByUsername(req.session.adminUsername!);
      if (admin && admin.isActive) {
        req.adminUser = admin;
      }
    } catch (error) {
      console.error("Check auth error:", error);
    }
  }
  next();
}