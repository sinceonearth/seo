var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import dotenv2 from "dotenv";
import express2 from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// server/routes.ts
import { createServer } from "http";
import dotenv from "dotenv";
import { sql as sql2, eq, desc, and } from "drizzle-orm";
import crypto from "crypto";

// server/db.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  airlines: () => airlines,
  airports: () => airports,
  flights: () => flights,
  insertAirlineSchema: () => insertAirlineSchema,
  insertAirportSchema: () => insertAirportSchema,
  insertFlightSchema: () => insertFlightSchema,
  insertStampSchema: () => insertStampSchema,
  insertUserSchema: () => insertUserSchema,
  loginUserSchema: () => loginUserSchema,
  registerUserSchema: () => registerUserSchema,
  sessions: () => sessions,
  stamps: () => stamps,
  users: () => users
});
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  doublePrecision,
  integer,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  alien: varchar("alien").unique().notNull(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password_hash: varchar("password_hash"),
  name: varchar("name").notNull(),
  country: varchar("country").default("Other").notNull(),
  // ✅ always set
  profile_image_url: varchar("profile_image_url"),
  is_admin: boolean("is_admin").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var registerUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  country: z.string().default("Other"),
  // default to Other if not provided
  alien: z.string().regex(/^\d{2}$/, "Alien must be 2 digits (e.g. 01, 02, 10)").optional()
});
var loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var flights = pgTable("flights", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  airline_name: varchar("airline_name").notNull(),
  airline_code: varchar("airline_code", { length: 3 }).notNull(),
  flight_number: varchar("flight_number").notNull(),
  departure: varchar("departure").notNull(),
  arrival: varchar("arrival").notNull(),
  departure_latitude: doublePrecision("departure_latitude"),
  departure_longitude: doublePrecision("departure_longitude"),
  arrival_latitude: doublePrecision("arrival_latitude"),
  arrival_longitude: doublePrecision("arrival_longitude"),
  departure_time: varchar("departure_time"),
  arrival_time: varchar("arrival_time"),
  date: varchar("date"),
  // YYYY-MM-DD
  // ✅ Add terminal columns
  departure_terminal: varchar("departure_terminal"),
  arrival_terminal: varchar("arrival_terminal"),
  aircraft_type: varchar("aircraft_type"),
  distance: doublePrecision("distance"),
  // km
  duration: varchar("duration"),
  status: varchar("status").default("scheduled"),
  created_at: timestamp("created_at").defaultNow()
});
var insertFlightSchema = createInsertSchema(flights).omit({
  id: true,
  user_id: true,
  created_at: true
});
var airlines = pgTable("airlines", {
  id: uuid("id").defaultRandom().primaryKey(),
  airline_code: varchar("airline_code", { length: 3 }).unique().notNull(),
  airline_name: varchar("airline_name").notNull(),
  country: varchar("country").notNull()
});
var insertAirlineSchema = createInsertSchema(airlines);
var airports = pgTable("airports", {
  id: uuid("id").defaultRandom().primaryKey(),
  ident: varchar("ident").unique().notNull(),
  type: varchar("type"),
  name: varchar("name"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  elevation_ft: integer("elevation_ft"),
  continent: varchar("continent"),
  iso_country: varchar("iso_country"),
  iso_region: varchar("iso_region"),
  municipality: varchar("municipality"),
  gps_code: varchar("gps_code"),
  iata: varchar("iata", { length: 3 }),
  icao: varchar("icao", { length: 4 }),
  local_code: varchar("local_code")
});
var insertAirportSchema = createInsertSchema(airports);
var stamps = pgTable("stamps", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  image_url: text("image_url").notNull(),
  created_at: timestamp("created_at").defaultNow()
});
var insertStampSchema = createInsertSchema(stamps).omit({
  id: true,
  created_at: true
});

// server/db.ts
import { config } from "dotenv";
config();
var databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "Database URL not set. Please set NEON_DATABASE_URL or DATABASE_URL environment variable."
  );
}
if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  throw new Error(
    `Invalid database URL format: ${databaseUrl.substring(0, 50)}...`
  );
}
var cleanedUrl = databaseUrl.replace(/([&?])channel_binding=require/, "");
var sql = neon(cleanedUrl);
var db = drizzle(sql, { schema: schema_exports });

// server/storage.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
var storage = {
  /* ===============================
     👤 Users
     =============================== */
  async getUserByUsernameOrEmail(identifier) {
    const result = await pool.query(
      `SELECT * FROM users WHERE username = $1 OR email = $1`,
      [identifier]
    );
    return result.rows[0];
  },
  async getUser(id) {
    const result = await pool.query(
      `SELECT id, username, email, name, country, alien, is_admin AS "isAdmin", created_at AS "createdAt"
       FROM users
       WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },
  async getAllUsers() {
    const result = await pool.query(`SELECT * FROM users ORDER BY id ASC`);
    return result.rows;
  },
  async createUser({ username, email, passwordHash, name, country }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const res = await client.query(`SELECT MAX(alien) AS maxAlien FROM users`);
      const maxAlien = res.rows[0]?.maxalien || "00";
      let nextAlienNumber = parseInt(maxAlien, 10) + 1;
      if (nextAlienNumber > 99) throw new Error("Maximum number of users reached");
      const alienStr = String(nextAlienNumber).padStart(2, "0");
      const insertRes = await client.query(
        `INSERT INTO users (username, email, password_hash, name, country, alien)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [username, email, passwordHash, name, country || null, alienStr]
      );
      await client.query("COMMIT");
      return insertRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
  /* ===============================
     ✈️ Flights
     =============================== */
  async getUserFlights(userId) {
    const result = await pool.query(
      `SELECT *
       FROM flights
       WHERE user_id = $1
       ORDER BY date DESC`,
      [userId]
    );
    return result.rows;
  },
  async createFlight(flight) {
    const result = await pool.query(
      `INSERT INTO flights (
       user_id, airline_name, flight_number, departure, arrival,
       departure_latitude, departure_longitude, arrival_latitude, arrival_longitude,
       date, departure_time, arrival_time, aircraft_type, distance, duration, status,
       departure_terminal, arrival_terminal
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
      [
        flight.userId,
        flight.airlineName,
        flight.flightNumber,
        flight.departure,
        flight.arrival,
        flight.departureLatitude ?? null,
        flight.departureLongitude ?? null,
        flight.arrivalLatitude ?? null,
        flight.arrivalLongitude ?? null,
        flight.date,
        flight.departureTime ?? null,
        flight.arrivalTime ?? null,
        flight.aircraftType ?? null,
        flight.distance ?? 0,
        flight.duration ?? null,
        flight.status ?? "scheduled",
        flight.departure_terminal ?? null,
        flight.arrival_terminal ?? null
      ]
    );
    return result.rows[0];
  }
};

// server/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";

// server/jwt.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("\u274C Missing JWT_SECRET or SESSION_SECRET in environment variables.");
}
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// server/auth.ts
var router = Router();
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password, country } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    const existingUser = await storage.getUserByUsernameOrEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await storage.createUser({
      name,
      username,
      email,
      passwordHash,
      country: country || null
    });
    const token = createToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      isAdmin: !!newUser.is_admin,
      alien: newUser.alien,
      country: newUser.country
      // <-- include country in JWT
    });
    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        country: newUser.country,
        alien: newUser.alien,
        is_admin: !!newUser.is_admin
      }
    });
  } catch (err) {
    console.error("\u274C Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const user = await storage.getUserByUsernameOrEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: !!user.is_admin,
      alien: user.alien,
      country: user.country
      // <-- include country in JWT
    });
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        country: user.country,
        alien: user.alien,
        is_admin: !!user.is_admin
      }
    });
  } catch (err) {
    console.error("\u274C Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
router.get("/user", requireAuth, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({
    id: user.userId,
    email: user.email,
    username: user.username,
    country: user.country ?? null,
    // <-- now included
    alien: user.alien,
    is_admin: user.isAdmin ?? false
  });
});
var auth_default = router;

// server/routes.ts
dotenv.config();
function requireAuth(req, res, next) {
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
    isAdmin: decoded.isAdmin ?? false
  };
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Admins only" });
  next();
}
async function registerRoutes(app2) {
  app2.use("/api/auth", auth_default);
  app2.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const usersList = await storage.getAllUsers();
      return res.json(usersList.map(({ password_hash, ...u }) => ({ ...u, country: u.country ?? null })));
    } catch (err) {
      console.error("\u274C Error fetching users:", err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/flights", requireAuth, async (req, res) => {
    try {
      const flightsList = await db.select().from(flights).where(eq(flights.user_id, req.user.userId)).orderBy(desc(flights.date));
      return res.json(flightsList);
    } catch (err) {
      console.error("\u274C Error fetching flights:", err);
      return res.status(500).json({ message: "Failed to fetch flights" });
    }
  });
  app2.post("/api/flights", requireAuth, async (req, res) => {
    try {
      const body = req.body;
      const userId = req.user.userId;
      if (!body.date || !body.flight_number || !body.departure || !body.arrival || !body.status) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const findAirport = async (code) => {
        if (!code) return null;
        const result = await db.select().from(airports).where(eq(airports.iata, code)).limit(1);
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
        created_at: /* @__PURE__ */ new Date(),
        airline_name: body.airline_name ?? null,
        departure_terminal: body.departure_terminal ?? null,
        arrival_terminal: body.arrival_terminal ?? null,
        departure_latitude: body.departure_latitude ?? depAirport?.latitude ?? null,
        departure_longitude: body.departure_longitude ?? depAirport?.longitude ?? null,
        arrival_latitude: body.arrival_latitude ?? arrAirport?.latitude ?? null,
        arrival_longitude: body.arrival_longitude ?? arrAirport?.longitude ?? null,
        duration: body.duration ?? null,
        distance: body.distance ? Number(body.distance) : null,
        airline_code: body.airline_code ?? null
      };
      await db.insert(flights).values(newFlight);
      return res.status(201).json({ message: "Flight added successfully", flight: newFlight });
    } catch (err) {
      console.error("\u274C Error adding flight:", err);
      return res.status(500).json({ message: "Failed to add flight" });
    }
  });
  app2.delete("/api/flights/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db.delete(flights).where(and(eq(flights.id, id), eq(flights.user_id, req.user.userId)));
      if (!deleted) return res.status(404).json({ message: "Flight not found" });
      return res.json({ message: "Flight deleted successfully" });
    } catch (err) {
      console.error("\u274C Error deleting flight:", err);
      return res.status(500).json({ message: "Failed to delete flight" });
    }
  });
  app2.get("/api/flights/search", requireAuth, async (req, res) => {
    try {
      const { flight_number, airline_name, dep_iata, arr_iata, date } = req.query;
      if (!date) return res.status(400).json({ message: "Date is required" });
      const conditions = [eq(flights.user_id, req.user.userId), eq(flights.date, date)];
      if (flight_number) conditions.push(eq(flights.flight_number, flight_number));
      if (airline_name) conditions.push(sql2`${flights.airline_name} ILIKE ${"%" + airline_name + "%"}`);
      if (dep_iata) conditions.push(eq(flights.departure, dep_iata));
      if (arr_iata) conditions.push(eq(flights.arrival, arr_iata));
      const flightsList = await db.select().from(flights).where(and(...conditions)).orderBy(desc(flights.date));
      return res.json(flightsList);
    } catch (err) {
      console.error("\u274C Error searching flights:", err);
      return res.status(500).json({ message: "Failed to search flights" });
    }
  });
  return createServer(app2);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react()
    // 🧹 Removed @replit/vite-plugin-runtime-error-modal
    // (was causing "Failed to parse JSON file" error in dev)
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    // ✅ Access from LAN / mobile
    port: 5173,
    // ✅ Frontend port
    fs: {
      strict: true,
      deny: ["**/.*"]
      // 🚫 Prevent serving hidden files
    },
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        // ✅ Your Express backend
        changeOrigin: true,
        secure: false
      }
    }
  },
  // ✅ Optional: cleaner build logging
  logLevel: "info"
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
async function setupVite(app2, server) {
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
    appType: "custom",
    customLogger: viteLogger
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const templatePath = path2.resolve(process.cwd(), "client/index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
import cors from "cors";
import cookieParser from "cookie-parser";
dotenv2.config();
process.env.NODE_ENV = process.env.NODE_ENV || "development";
console.log("\u{1F527} Loaded environment:", {
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  hasSessionSecret: !!process.env.SESSION_SECRET,
  nodeEnv: process.env.NODE_ENV
});
var app = express2();
app.set("trust proxy", 1);
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(
  cors({
    origin: [
      "https://sinceonearth.com",
      // Production Frontend URL
      "http://localhost:5173",
      // Local Development (Desktop)
      "http://192.168.29.116:5173"
      // Local Development (Mobile)
    ],
    credentials: true
    // Allow cookies to be sent with requests
  })
);
app.use(cookieParser());
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 100) logLine = logLine.slice(0, 99) + "\u2026";
      console.log(logLine);
    }
  });
  next();
});
var PgStore = connectPg(session);
var sessionStore = new PgStore({
  conString: process.env.DATABASE_URL,
  // PostgreSQL Connection String
  createTableIfMissing: false,
  // Do not create the sessions table automatically
  ttl: 7 * 24 * 60 * 60,
  // Session expiration: 7 days
  tableName: "sessions"
  // Table name for sessions
});
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    // Make sure SESSION_SECRET is set in .env
    name: "sessionId",
    // Session cookie name
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      // Ensures the cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === "production",
      // Only send cookies over HTTPS in production
      sameSite: "lax",
      // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      // Cookie expiration: 7 days
      path: "/"
      // Cookie path
    }
  })
);
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("\u274C Express Error:", message);
    res.status(status).json({ message });
  });
  console.log("\u{1F331} Express environment:", app.get("env"));
  if (app.get("env") === "development") {
    console.log("\u{1F680} Starting Vite in middleware mode...");
    await setupVite(app, server);
  } else {
    console.log("\u{1F4E6} Skipping serveStatic \u2014 dev mode only");
  }
  const port = parseInt(process.env.PORT || "5050", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`\u2705 Server running on http://0.0.0.0:${port}`);
  });
})();
