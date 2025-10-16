import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import dotenv from "dotenv";
import { sql, eq, desc, and } from "drizzle-orm";
import crypto from "crypto";

import { db } from "./db";
import { storage } from "./storage";
import { flights, airports } from "@shared/schema";
import authRouter from "./auth";
import { verifyToken } from "./jwt";

dotenv.config();

/* =========================
   Request with user type
========================= */
export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
    country?: string | null;
    alien?: string | null;
    isAdmin?: boolean;
  };
}

/* =========================
   Auth middleware
========================= */
export function requireAuth(req: RequestWithUser, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing Authorization header" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: "Invalid or expired token" });

  req.user = {
    userId: decoded.userId,
    email: decoded.email,
    username: decoded.username,
    country: decoded.country ?? null,
    alien: decoded.alien ?? null,
    isAdmin: decoded.isAdmin ?? false,
  };

  next();
}

export function requireAdmin(req: RequestWithUser, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Admins only" });
  next();
}

/* =========================
   Register routes
========================= */
export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/auth", authRouter);

  // --- Admin: list all users ---
  app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const usersList = await storage.getAllUsers();
      return res.json(usersList.map(({ password_hash, ...u }) => ({ ...u, country: u.country ?? null })));
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // --- List flights for logged-in user ---
  app.get("/api/flights", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const flightsList = await db
        .select()
        .from(flights)
        .where(eq(flights.user_id, req.user!.userId))
        .orderBy(desc(flights.date));
      return res.json(flightsList);
    } catch (err) {
      console.error("❌ Error fetching flights:", err);
      return res.status(500).json({ message: "Failed to fetch flights" });
    }
  });

  // --- Add flight ---
  app.post("/api/flights", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const body = req.body;
      const userId = req.user!.userId;

      if (!body.date || !body.flight_number || !body.departure || !body.arrival || !body.status) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const findAirport = async (code: string) => {
        if (!code) return null;
        const result = await db
          .select()
          .from(airports)
          .where(eq(airports.iata, code))
          .limit(1);
        return result[0] ?? null;
      };

      const depAirport = await findAirport(body.departure);
      const arrAirport = await findAirport(body.arrival);

      const newFlight = {
        id: crypto.randomUUID(),
        user_id: userId,
        date: body.date,
        flight_number: body.flight_number,
        departure: depAirport?.iata ?? depAirport?.ident ?? body.departure,
        arrival: arrAirport?.iata ?? arrAirport?.ident ?? body.arrival,
        departure_time: body.departure_time ?? null,
        arrival_time: body.arrival_time ?? null,
        aircraft_type: body.aircraft_type ?? null,
        status: body.status,
        created_at: new Date(),
        airline_name: body.airline_name ?? null,
        departure_terminal: body.departure_terminal ?? null,
        arrival_terminal: body.arrival_terminal ?? null,
        departure_latitude: body.departure_latitude ?? depAirport?.latitude ?? null,
        departure_longitude: body.departure_longitude ?? depAirport?.longitude ?? null,
        arrival_latitude: body.arrival_latitude ?? arrAirport?.latitude ?? null,
        arrival_longitude: body.arrival_longitude ?? arrAirport?.longitude ?? null,
        duration: body.duration ?? null,
        distance: body.distance ? Number(body.distance) : null,
        airline_code: body.airline_code ?? null,
      };

      await db.insert(flights).values(newFlight);
      return res.status(201).json({ message: "Flight added successfully", flight: newFlight });
    } catch (err) {
      console.error("❌ Error adding flight:", err);
      return res.status(500).json({ message: "Failed to add flight" });
    }
  });

  // --- Delete flight ---
  app.delete("/api/flights/:id", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const { id } = req.params;
      const deleted = await db
        .delete(flights)
        .where(and(eq(flights.id, id), eq(flights.user_id, req.user!.userId)));
      if (!deleted) return res.status(404).json({ message: "Flight not found" });
      return res.json({ message: "Flight deleted successfully" });
    } catch (err) {
      console.error("❌ Error deleting flight:", err);
      return res.status(500).json({ message: "Failed to delete flight" });
    }
  });

  // --- Search flights (local DB only) ---
  app.get("/api/flights/search", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const { flight_number, airline_name, dep_iata, arr_iata, date } = req.query;

      if (!date) return res.status(400).json({ message: "Date is required" });

      const conditions = [eq(flights.user_id, req.user!.userId), eq(flights.date, date as string)];

      if (flight_number) conditions.push(eq(flights.flight_number, flight_number as string));
      if (airline_name) conditions.push(sql`${flights.airline_name} ILIKE ${'%' + (airline_name as string) + '%'}`);
      if (dep_iata) conditions.push(eq(flights.departure, dep_iata as string));
      if (arr_iata) conditions.push(eq(flights.arrival, arr_iata as string));

      const flightsList = await db
        .select()
        .from(flights)
        .where(and(...conditions))
        .orderBy(desc(flights.date));

      return res.json(flightsList);
    } catch (err) {
      console.error("❌ Error searching flights:", err);
      return res.status(500).json({ message: "Failed to search flights" });
    }
  });

  return createServer(app);
}
