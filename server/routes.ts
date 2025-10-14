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

  // --- Search flights (AviationStack) ---
  app.get("/api/flights/search", async (req: Request, res) => {
    try {
      const {
        date: qDate,
        flight_date: qFlightDate,
        dep_iata: qDep,
        arr_iata: qArr,
        airline_iata: qAirlineIata,
        airline_name: qAirlineName,
        flight_number: qFlightNumber,
      } = req.query as Record<string, string | undefined>;

      const date = (qDate || qFlightDate || "").trim();
      const dep_iata = (qDep || "").trim();
      const arr_iata = (qArr || "").trim();
      const airline_iata = (qAirlineIata || "").trim();
      const airline_name = (qAirlineName || "").trim();
      const flight_number = (qFlightNumber || "").trim();

      const API_KEY = process.env.AVIATIONSTACK_API_KEY;
      if (!API_KEY) return res.status(500).json({ message: "API key not configured" });

      const params = new URLSearchParams({ access_key: API_KEY, limit: "100" });
      if (date) params.set("flight_date", date);
      if (dep_iata) params.set("dep_iata", dep_iata);
      if (arr_iata) params.set("arr_iata", arr_iata);
      if (airline_iata) params.set("airline_iata", airline_iata);
      if (flight_number) params.set("flight_iata", flight_number);

      const url = `https://api.aviationstack.com/v1/flights?${params.toString()}`;
      console.log("🔍 Fetching AviationStack URL:", url);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      let response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        console.error("❌ AviationStack HTTP error:", response.status, response.statusText, txt);
        return res.status(502).json({ message: "AviationStack request failed" });
      }

      const raw: unknown = await response.json();
      if (!raw || typeof raw !== "object" || !("data" in raw)) {
        console.error("❌ Invalid AviationStack response:", raw);
        return res.status(500).json({ message: "Invalid response from AviationStack" });
      }

      const apiResp = raw as AviationStackResponse;
      if (apiResp.error) {
        console.error("❌ AviationStack returned error:", apiResp.error);
        return res.status(400).json({ error: apiResp.error });
      }

      const normalized = (apiResp.data ?? [])
        .map((f) => {
          const mainFlight = f.flight ?? {};
          const codeshare = mainFlight.codeshared;

          const airlineName = codeshare?.airline_name ?? f.airline?.name ?? null;
          const flightNum = codeshare?.flight_iata ?? mainFlight.iata ?? mainFlight.number ?? null;

          return {
            date: f.flight_date ?? null,
            status: f.flight_status ?? null,
            dep_iata: f.departure?.iata ?? null,
            dep_airport: f.departure?.airport ?? null,
            arr_iata: f.arrival?.iata ?? null,
            arr_airport: f.arrival?.airport ?? null,
            airline_name: airlineName,
            flight_number: flightNum,
          };
        })
        .filter((f) => {
          if (date && f.date && !f.date.startsWith(date)) return false;
          if (dep_iata && f.dep_iata?.toLowerCase() !== dep_iata.toLowerCase()) return false;
          if (arr_iata && f.arr_iata?.toLowerCase() !== arr_iata.toLowerCase()) return false;
          if (airline_iata && f.airline_name?.toLowerCase() !== airline_iata.toLowerCase()) return false;
          if (flight_number && f.flight_number?.toLowerCase() !== flight_number.toLowerCase()) return false;
          return true;
        });

      console.log("📦 Normalized flights:", normalized.length, "items");
      return res.json(normalized);
    } catch (err) {
      console.error("❌ Error searching flights:", err);
      return res.status(500).json({ message: "Failed to search flights" });
    }
  });

  // --- Stamps ---
  app.get("/api/stamps", async (_req, res) => {
    try {
      const allStamps = await db.select().from(stamps);
      res.json(allStamps);
    } catch (err) {
      console.error("❌ Error fetching stamps:", err);
      res.status(500).json({ message: "Failed to fetch stamps" });
    }
  });

  // --- Airlines ---
  app.get("/api/airlines", async (req: Request, res) => {
    try {
      const q = (req.query.q as string)?.trim()?.toLowerCase() ?? "";
      const baseQuery = db
        .select({
          id: airlines.id,
          airline_code: airlines.airline_code,
          airline_name: airlines.airline_name,
          country: airlines.country,
        })
        .from(airlines);

      const result = q
        ? await baseQuery.where(
            sql`LOWER(${airlines.airline_name}) LIKE ${"%" + q + "%"} OR LOWER(${airlines.airline_code}) LIKE ${"%" + q + "%"}`
          )
        : await baseQuery.limit(500);

      res.json(result);
    } catch (err) {
      console.error("❌ Error fetching airlines:", err);
      res.status(500).json({ message: "Failed to fetch airlines" });
    }
  });

  // --- Airports ---
  app.get("/api/airports", async (req: Request, res) => {
    try {
      const q = (req.query.search as string)?.trim()?.toLowerCase() ?? "";
      const whereClause = q
        ? and(
            or(
              sql`LOWER(${airports.name}) LIKE ${"%" + q + "%"} `,
              sql`LOWER(${airports.municipality}) LIKE ${"%" + q + "%"} `,
              sql`LOWER(${airports.iata}) LIKE ${"%" + q + "%"} `
            ),
            sql`${airports.iata} IS NOT NULL`
          )
        : sql`${airports.iata} IS NOT NULL`;

      const rows = await db
        .select({
          id: airports.id,
          name: airports.name,
          city: airports.municipality,
          country: airports.iso_country,
          iata: airports.iata,
          icao: airports.icao,
          ident: airports.ident,
          latitude: airports.latitude,
          longitude: airports.longitude,
        })
        .from(airports)
        .where(whereClause)
        .limit(10);

      const result = rows.map(a => ({
        id: a.id,
        name: a.name ?? "Unknown",
        city: a.city ?? null,
        country: a.country ?? null,
        iata: a.iata ?? a.ident ?? null,
        icao: a.icao ?? null,
        ident: a.ident ?? null,
        latitude: a.latitude ?? null,
        longitude: a.longitude ?? null,
      }));

      res.json(result);
    } catch (err) {
      console.error("❌ Error fetching airports:", err);
      res.status(500).json({ message: "Failed to fetch airports", error: (err as Error).message });
    }
  });

  return createServer(app);
}
