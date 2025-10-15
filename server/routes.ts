import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import dotenv from "dotenv";
import { sql, eq, desc, and, or } from "drizzle-orm";
import fetch from "node-fetch";
import crypto from "crypto";

import { db } from "./db";
import { storage } from "./storage";
import { flights, stamps, airports, airlines } from "@shared/schema";
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
   AviationStack Types
========================= */
export interface AviationStackFlight {
  flight_date?: string;
  flight_status?: string;
  airline?: { name?: string; iata?: string };
  flight?: {
    iata?: string;
    number?: string;
    codeshared?: {
      airline_name?: string;
      airline_iata?: string;
      flight_number?: string;
      flight_iata?: string;
    };
  };
  departure?: {
    iata?: string;
    airport?: string;
    scheduled?: string;
    terminal?: string;
    latitude?: number;
    longitude?: number;
  };
  arrival?: {
    iata?: string;
    airport?: string;
    scheduled?: string;
    terminal?: string;
    latitude?: number;
    longitude?: number;
  };
  aircraft?: { model?: string };
  flight_time?: string;
  distance?: number;
}

interface AviationStackResponse {
  data?: AviationStackFlight[];
  pagination?: any;
  error?: { code: string; message: string };
}

/* =========================
   Helper: fetch flight times
========================= */
async function fetchFlightTimes(flightNumber: string, date: string) {
  const API_KEY = process.env.AVIATIONSTACK_API_KEY;
  if (!API_KEY) return { departure_time: null, arrival_time: null };

  const params = new URLSearchParams({
    access_key: API_KEY,
    flight_iata: flightNumber,
    flight_date: date,
    limit: "1",
  });
  const url = `https://api.aviationstack.com/v1/flights?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return { departure_time: null, arrival_time: null };

    const raw: unknown = await response.json();
    if (!raw || typeof raw !== "object" || !("data" in raw)) return { departure_time: null, arrival_time: null };

    const data = raw as AviationStackResponse;
    const flight = data.data?.[0];

    return {
      departure_time: flight?.departure?.scheduled ?? null,
      arrival_time: flight?.arrival?.scheduled ?? null,
    };
  } catch {
    return { departure_time: null, arrival_time: null };
  }
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
      res.json(usersList.map(({ password_hash, ...u }) => ({ ...u, country: u.country ?? null })));
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      res.status(500).json({ message: "Failed to fetch users" });
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
      res.json(flightsList);
    } catch (err) {
      console.error("❌ Error fetching flights:", err);
      res.status(500).json({ message: "Failed to fetch flights" });
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
          .where(or(eq(airports.iata, code), eq(airports.ident, code), eq(airports.icao, code)))
          .limit(1);
        return result[0] ?? null;
      };

      const depAirport = await findAirport(body.departure);
      const arrAirport = await findAirport(body.arrival);

      // Fetch times if missing
      const times = (!body.departure_time || !body.arrival_time)
        ? await fetchFlightTimes(body.flight_number, body.date)
        : { departure_time: body.departure_time, arrival_time: body.arrival_time };

      const newFlight = {
        id: crypto.randomUUID(),
        user_id: userId,
        date: body.date,
        flight_number: body.flight_number,
        departure: depAirport?.iata ?? depAirport?.ident ?? body.departure,
        arrival: arrAirport?.iata ?? arrAirport?.ident ?? body.arrival,
        departure_time: times.departure_time,
        arrival_time: times.arrival_time,
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
      res.status(201).json({ message: "Flight added successfully", flight: newFlight });
    } catch (err) {
      console.error("❌ Error adding flight:", err);
      res.status(500).json({ message: "Failed to add flight" });
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
      res.json({ message: "Flight deleted successfully" });
    } catch (err) {
      console.error("❌ Error deleting flight:", err);
      res.status(500).json({ message: "Failed to delete flight" });
    }
  });

  // --- Search flights (with timings) ---
  app.get("/api/flights/search", requireAuth, async (req: RequestWithUser, res) => {
    try {
      const { flight_number, airline_name, dep_iata, arr_iata, date } = req.query;

      if (!date) return res.status(400).json({ message: "Date is required" });

      const API_KEY = process.env.AVIATIONSTACK_API_KEY;
      if (!API_KEY) return res.status(500).json({ message: "API key missing" });

      const params = new URLSearchParams({
        access_key: API_KEY,
        limit: "10",
        flight_date: date as string,
      });
      if (flight_number) params.append("flight_iata", flight_number as string);

      const url = `https://api.aviationstack.com/v1/flights?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) return res.status(500).json({ message: "Failed to fetch flights from API" });

      const raw: unknown = await response.json();
      const data = raw as AviationStackResponse;

      let flightsData = data.data || [];

      if (dep_iata) flightsData = flightsData.filter(f => f.departure?.iata?.toUpperCase() === (dep_iata as string).toUpperCase());
      if (arr_iata) flightsData = flightsData.filter(f => f.arrival?.iata?.toUpperCase() === (arr_iata as string).toUpperCase());
      if (airline_name) flightsData = flightsData.filter(f => f.airline?.name?.toLowerCase().includes((airline_name as string).toLowerCase()));

      const normalized = flightsData.map(f => ({
        date: f.flight_date || "",
        status: f.flight_status || "scheduled",
        dep_iata: f.departure?.iata || "N/A",
        dep_airport: f.departure?.airport || "N/A",
        dep_time: f.departure?.scheduled || null,
        arr_iata: f.arrival?.iata || "N/A",
        arr_airport: f.arrival?.airport || "N/A",
        arr_time: f.arrival?.scheduled || null,
        airline_name: f.airline?.name || "N/A",
        flight_number: f.flight?.iata || f.flight?.number || "N/A",
      }));

      res.json(normalized);
    } catch (err) {
      console.error("❌ Error searching flights:", err);
      res.status(500).json({ message: "Failed to search flights" });
    }
  });

  return createServer(app);
}
