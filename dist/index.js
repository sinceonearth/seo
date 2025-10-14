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
import { sql as sql2, eq, desc, and, or } from "drizzle-orm";

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
  // 👽 “A01”, “A02”, etc.
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password_hash: varchar("password_hash"),
  name: varchar("name").notNull(),
  country: varchar("country"),
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
  country: z.string().optional(),
  // 👽 Include alien_id for client compatibility
  alien: z.string().regex(/^\d{2}$/, "Alien must be 2 digits (e.g. 01, 02, 10)").optional()
});
var loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var flights = pgTable("flights", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  // 🏢 Airline info
  airline_name: varchar("airline_name").notNull(),
  airline_code: varchar("airline_code", { length: 3 }).notNull(),
  flight_number: varchar("flight_number").notNull(),
  // 🌍 Route
  departure: varchar("departure").notNull(),
  arrival: varchar("arrival").notNull(),
  // 📍 Coordinates
  departure_latitude: doublePrecision("departure_latitude"),
  departure_longitude: doublePrecision("departure_longitude"),
  arrival_latitude: doublePrecision("arrival_latitude"),
  arrival_longitude: doublePrecision("arrival_longitude"),
  // 🕐 Timing
  departure_time: varchar("departure_time"),
  arrival_time: varchar("arrival_time"),
  date: varchar("date"),
  // YYYY-MM-DD
  // ✈️ Aircraft & stats
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
         date, departure_time, arrival_time, aircraft_type, distance, duration, status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
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
        flight.status ?? "scheduled"
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
      alien: newUser.alien
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
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: !!user.is_admin,
      alien: user.alien
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
var auth_default = router;

// server/routes.ts
dotenv.config();
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  req.user = decoded;
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}
async function registerRoutes(app2) {
  app2.use("/api/auth", auth_default);
  app2.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const usersList = await storage.getAllUsers();
      res.json(usersList.map(({ password_hash, ...u }) => u));
    } catch (error) {
      console.error("\u274C Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/flights", requireAuth, async (req, res) => {
    try {
      const userId = req.user.userId;
      const flightsList = await db.select().from(flights).where(eq(flights.user_id, userId)).orderBy(desc(flights.date));
      res.json(flightsList);
    } catch (error) {
      console.error("\u274C Error fetching flights:", error);
      res.status(500).json({ message: "Failed to fetch flights" });
    }
  });
  app2.post("/api/flights", requireAuth, async (req, res) => {
    try {
      const userId = req.user.userId;
      const flightData = insertFlightSchema.parse(req.body);
      await db.insert(flights).values({
        ...flightData,
        user_id: userId,
        status: flightData.status ?? "completed"
      });
      res.status(201).json({ message: "Flight added successfully" });
    } catch (error) {
      console.error("\u274C Error adding flight:", error);
      res.status(500).json({ message: "Failed to add flight" });
    }
  });
  app2.delete("/api/flights/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user.userId;
      const flightId = req.params.id;
      const result = await db.delete(flights).where(and(eq(flights.id, flightId), eq(flights.user_id, userId)));
      if (!result) return res.status(404).json({ message: "Flight not found" });
      res.json({ message: "Flight deleted successfully" });
    } catch (error) {
      console.error("\u274C Error deleting flight:", error);
      res.status(500).json({ message: "Failed to delete flight" });
    }
  });
  app2.get("/api/stamps", async (_req, res) => {
    try {
      const allStamps = await db.select().from(stamps);
      res.json(allStamps);
    } catch (error) {
      console.error("\u274C Error fetching stamps:", error);
      res.status(500).json({ message: "Failed to fetch stamps" });
    }
  });
  app2.get("/api/airlines", async (req, res) => {
    try {
      const q = req.query.q?.trim()?.toLowerCase() ?? "";
      const baseQuery = db.select({
        id: airlines.id,
        airline_code: airlines.airline_code,
        airline_name: airlines.airline_name,
        country: airlines.country
      }).from(airlines);
      const result = q ? await baseQuery.where(
        sql2`LOWER(${airlines.airline_name}) LIKE ${"%" + q + "%"} 
                 OR LOWER(${airlines.airline_code}) LIKE ${"%" + q + "%"}`
      ) : await baseQuery.limit(500);
      res.json(result);
    } catch (error) {
      console.error("\u274C Error fetching airlines:", error);
      res.status(500).json({ message: "Failed to fetch airlines" });
    }
  });
  app2.get("/api/airports", async (req, res) => {
    try {
      const q = req.query.search?.trim()?.toLowerCase() ?? "";
      const whereClause = q ? and(
        or(
          sql2`LOWER(${airports.name}) LIKE ${"%" + q + "%"}`,
          sql2`LOWER(${airports.municipality}) LIKE ${"%" + q + "%"}`,
          sql2`LOWER(${airports.iata}) LIKE ${"%" + q + "%"}`
        ),
        sql2`${airports.iata} IS NOT NULL`
      ) : sql2`${airports.iata} IS NOT NULL`;
      const result = await db.select({
        id: airports.id,
        name: airports.name,
        city: airports.municipality,
        country: airports.iso_country,
        iata: airports.iata,
        icao: airports.icao,
        ident: airports.ident,
        latitude: airports.latitude,
        longitude: airports.longitude
      }).from(airports).where(whereClause).limit(10);
      res.json(result);
    } catch (error) {
      console.error("\u274C Error fetching airports:", error);
      res.status(500).json({ message: "Failed to fetch airports" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
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
  hasDatabaseUrl: !!process.env.NEON_DATABASE_URL,
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
      "http://localhost:5173",
      // for desktop dev
      "http://192.168.29.116:5173",
      // for iPhone/devices on same WiFi
      "http://localhost:5050"
      // if calling via browser console
    ],
    credentials: true
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
var pgStore = connectPg(session);
var sessionStore = new pgStore({
  conString: process.env.NEON_DATABASE_URL,
  createTableIfMissing: false,
  ttl: 7 * 24 * 60 * 60,
  // 7 days
  tableName: "sessions"
});
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    name: "sessionId",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      path: "/"
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
