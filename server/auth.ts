import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import { verifyToken } from "./jwt";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const token = authHeader.substring(7); // Remove "Bearer " prefix
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Attach user info to request for downstream use
  (req as any).userId = payload.userId;
  (req as any).userEmail = payload.email;
  (req as any).username = payload.username;
  
  next();
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const { storage } = await import("./storage");
  const user = await storage.getUser(payload.userId);
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  (req as any).userId = payload.userId;
  (req as any).userEmail = payload.email;
  (req as any).username = payload.username;
  
  next();
};
