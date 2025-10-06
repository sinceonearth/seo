var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  airlines: () => airlines,
  flights: () => flights,
  insertAirlineSchema: () => insertAirlineSchema,
  insertFlightSchema: () => insertFlightSchema,
  insertUserSchema: () => insertUserSchema,
  loginUserSchema: () => loginUserSchema,
  registerUserSchema: () => registerUserSchema,
  sessions: () => sessions,
  users: () => users
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions, users, insertUserSchema, registerUserSchema, loginUserSchema, flights, insertFlightSchema, airlines, insertAirlineSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      username: varchar("username").unique().notNull(),
      email: varchar("email").unique().notNull(),
      passwordHash: varchar("password_hash"),
      name: varchar("name").notNull(),
      country: varchar("country"),
      profileImageUrl: varchar("profile_image_url"),
      isAdmin: boolean("is_admin").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    registerUserSchema = z.object({
      username: z.string().min(3).max(30),
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      country: z.string().min(1)
    });
    loginUserSchema = z.object({
      usernameOrEmail: z.string().min(1),
      password: z.string().min(1)
    });
    flights = pgTable(
      "flights",
      {
        id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
        userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        date: varchar("date").notNull(),
        airline: varchar("airline").notNull(),
        airlineName: varchar("airline_name"),
        flightNumber: varchar("flight_number").notNull(),
        from: varchar("from").notNull(),
        to: varchar("to").notNull(),
        departureTime: varchar("departure_time"),
        arrivalTime: varchar("arrival_time"),
        departureTerminal: varchar("departure_terminal"),
        arrivalTerminal: varchar("arrival_terminal"),
        aircraftType: varchar("aircraft_type"),
        status: varchar("status").notNull().default("completed"),
        createdAt: timestamp("created_at").defaultNow()
      },
      (table) => [
        index("idx_flights_user_id").on(table.userId),
        index("idx_flights_date").on(table.date)
      ]
    );
    insertFlightSchema = createInsertSchema(flights).omit({
      id: true,
      createdAt: true
    });
    airlines = pgTable("airlines", {
      code: varchar("code", { length: 2 }).primaryKey(),
      icao: varchar("icao", { length: 3 }),
      name: varchar("name").notNull(),
      country: varchar("country").notNull()
    });
    insertAirlineSchema = createInsertSchema(airlines);
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
var databaseUrl, cleanedUrl, sql2, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    config();
    databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("Database URL not set. Please set NEON_DATABASE_URL or DATABASE_URL environment variable");
    }
    if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
      throw new Error(`Invalid database URL format: ${databaseUrl.substring(0, 50)}...`);
    }
    cleanedUrl = databaseUrl;
    if (cleanedUrl.includes("channel_binding=require")) {
      cleanedUrl = cleanedUrl.replace("&channel_binding=require", "").replace("?channel_binding=require", "");
    }
    sql2 = neon(cleanedUrl);
    db = drizzle(sql2, { schema: schema_exports });
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DatabaseStorage: () => DatabaseStorage,
  storage: () => storage
});
import { eq, desc, or } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      // User operations
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByUsernameOrEmail(usernameOrEmail) {
        const [user] = await db.select().from(users).where(
          or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail))
        );
        return user;
      }
      async createUser(userData) {
        const [user] = await db.insert(users).values(userData).returning();
        return user;
      }
      async upsertUser(userData) {
        const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return user;
      }
      // Flight operations
      async getUserFlights(userId) {
        return db.select().from(flights).where(eq(flights.userId, userId)).orderBy(desc(flights.date));
      }
      async getFlight(id) {
        const [flight] = await db.select().from(flights).where(eq(flights.id, id));
        return flight;
      }
      async createFlight(flightData) {
        const [flight] = await db.insert(flights).values(flightData).returning();
        return flight;
      }
      async updateFlight(id, flightData) {
        const [flight] = await db.update(flights).set(flightData).where(eq(flights.id, id)).returning();
        return flight;
      }
      async deleteFlight(id) {
        await db.delete(flights).where(eq(flights.id, id));
      }
      async createFlightsBulk(flightData) {
        return db.insert(flights).values(flightData).returning();
      }
      // Airline operations
      async getAllAirlines() {
        return db.select().from(airlines).orderBy(airlines.name);
      }
      // Admin operations
      async getAllUsers() {
        return db.select().from(users);
      }
      async getAdminStats() {
        const allUsers = await db.select().from(users);
        const allFlights = await db.select().from(flights);
        const uniqueAirlines = new Set(allFlights.map((f) => f.airline));
        const uniqueAirports = /* @__PURE__ */ new Set([
          ...allFlights.map((f) => f.from),
          ...allFlights.map((f) => f.to)
        ]);
        return {
          totalUsers: allUsers.length,
          totalFlights: allFlights.length,
          totalAirlines: uniqueAirlines.size,
          totalAirports: uniqueAirports.size
        };
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/index.ts
import dotenv from "dotenv";
import express2 from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// server/routes.ts
init_storage();
import { createServer } from "http";

// server/auth.ts
import bcrypt from "bcryptjs";

// server/jwt.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.SESSION_SECRET || "fallback-jwt-secret";
var JWT_EXPIRES_IN = "7d";
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// server/auth.ts
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
var requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.userId = payload.userId;
  req.userEmail = payload.email;
  req.username = payload.username;
  next();
};
var requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
  const user = await storage2.getUser(payload.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  req.userId = payload.userId;
  req.userEmail = payload.email;
  req.username = payload.username;
  next();
};

// server/routes.ts
init_schema();
async function registerRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const validated = registerUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsernameOrEmail(validated.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username or email already exists" });
      }
      const emailCheck = await storage.getUserByUsernameOrEmail(validated.email);
      if (emailCheck) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const passwordHash = await hashPassword(validated.password);
      const user = await storage.createUser({
        username: validated.username,
        email: validated.email,
        passwordHash,
        name: validated.name,
        country: validated.country
      });
      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginUserSchema.parse(req.body);
      const user = await storage.getUserByUsernameOrEmail(validated.usernameOrEmail);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValid = await verifyPassword(validated.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });
  app2.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const usersWithoutPasswords = users2.map(({ passwordHash: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });
  app2.get("/api/airlines", async (req, res) => {
    try {
      const airlines2 = await storage.getAllAirlines();
      res.json(airlines2);
    } catch (error) {
      console.error("Error fetching airlines:", error);
      res.status(500).json({ message: "Failed to fetch airlines" });
    }
  });
  app2.get("/api/flights", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const flights2 = await storage.getUserFlights(userId);
      res.json(flights2);
    } catch (error) {
      console.error("Error fetching flights:", error);
      res.status(500).json({ message: "Failed to fetch flights" });
    }
  });
  app2.post("/api/flights", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const validated = insertFlightSchema.parse({
        ...req.body,
        userId
      });
      const flight = await storage.createFlight(validated);
      res.json(flight);
    } catch (error) {
      console.error("Error creating flight:", error);
      res.status(400).json({ message: "Failed to create flight" });
    }
  });
  app2.post("/api/flights/bulk", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const flightsData = req.body.flights.map((flight) => ({
        ...flight,
        userId
      }));
      const flights2 = await storage.createFlightsBulk(flightsData);
      res.json(flights2);
    } catch (error) {
      console.error("Error creating flights in bulk:", error);
      res.status(400).json({ message: "Failed to create flights" });
    }
  });
  app2.put("/api/flights/:id", requireAuth, async (req, res) => {
    try {
      const flight = await storage.updateFlight(req.params.id, req.body);
      res.json(flight);
    } catch (error) {
      console.error("Error updating flight:", error);
      res.status(400).json({ message: "Failed to update flight" });
    }
  });
  app2.delete("/api/flights/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteFlight(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting flight:", error);
      res.status(400).json({ message: "Failed to delete flight" });
    }
  });
  app2.get("/api/flights/lookup", requireAuth, async (req, res) => {
    try {
      const { flightNumber } = req.query;
      if (!flightNumber || typeof flightNumber !== "string") {
        return res.status(400).json({ message: "Flight number is required" });
      }
      const apiKey = process.env.AVIATIONSTACK_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Flight lookup service not configured" });
      }
      const response = await fetch(
        `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightNumber}`
      );
      if (!response.ok) {
        return res.status(500).json({ message: "Failed to fetch flight data" });
      }
      const data = await response.json();
      if (!data.data || data.data.length === 0) {
        return res.status(404).json({ message: "Flight not found" });
      }
      const flight = data.data[0];
      console.log("Aviationstack API response:", JSON.stringify(flight, null, 2));
      const getLiveStatus = () => {
        const apiStatus = flight.flight_status?.toLowerCase();
        const hasDelay = flight.departure?.delay > 0 || flight.arrival?.delay > 0;
        if (apiStatus === "landed") return "landed";
        if (apiStatus === "active") return "departed";
        if (apiStatus === "cancelled") return "cancelled";
        if (apiStatus === "scheduled") {
          return hasDelay ? "delayed" : "on time";
        }
        return "scheduled";
      };
      const flightData = {
        airline: flight.airline?.iata || "",
        airlineName: flight.airline?.name || "",
        flightNumber: flight.flight?.iata || "",
        from: flight.departure?.iata || "",
        fromAirport: flight.departure?.airport || "",
        to: flight.arrival?.iata || "",
        toAirport: flight.arrival?.airport || "",
        date: flight.flight_date || "",
        departureTime: flight.departure?.scheduled?.split("T")[1]?.substring(0, 5) || "",
        arrivalTime: flight.arrival?.scheduled?.split("T")[1]?.substring(0, 5) || "",
        aircraftType: flight.aircraft?.registration || flight.aircraft?.iata || "",
        status: flight.flight_status === "landed" ? "completed" : "upcoming",
        liveStatus: getLiveStatus()
      };
      console.log("Transformed flight data:", flightData);
      res.json(flightData);
    } catch (error) {
      console.error("Flight lookup error:", error);
      res.status(500).json({ message: "Failed to lookup flight" });
    }
  });
  app2.post("/api/flights/import-default", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const existingFlights = await storage.getUserFlights(userId);
      if (existingFlights.length > 0) {
        return res.status(200).json({ message: "User already has flights", count: existingFlights.length });
      }
      const { flights: flights2 } = req.body;
      if (!flights2 || !Array.isArray(flights2)) {
        return res.status(400).json({ message: "Invalid flights data" });
      }
      const validFlights = flights2.map((flight) => {
        const validated = insertFlightSchema.parse({
          userId,
          date: flight.date,
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          from: flight.from,
          to: flight.to,
          departureTime: flight.departureTime || null,
          arrivalTime: flight.arrivalTime || null,
          aircraftType: flight.aircraftType || null,
          status: ["completed", "upcoming", "cancelled"].includes(flight.status) ? flight.status : "completed"
        });
        return validated;
      });
      const importedFlights = await storage.createFlightsBulk(validFlights);
      res.json({ success: true, count: importedFlights.length });
    } catch (error) {
      console.error("Error importing flights:", error);
      res.status(500).json({ message: "Failed to import flights" });
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
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay()],
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
    fs: { strict: true, deny: ["**/.*"] }
  }
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
function serveStatic(app2) {
  const distPath = path2.resolve(process.cwd(), "dist/public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`\u26A0\uFE0F Build folder not found: ${distPath}. Run \`npm run build\` first.`);
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.join(distPath, "index.html"));
  });
}

// server/index.ts
dotenv.config();
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
      if (capturedJsonResponse)
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 120) logLine = logLine.slice(0, 119) + "\u2026";
      if (process.env.NODE_ENV !== "production") console.log(logLine);
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
      // ✅ secure in prod
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      path: "/"
    }
  })
);
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    console.error("\u274C Express Error:", message);
    res.status(status).json({ message });
  });
  console.log("\u{1F331} Express environment:", app.get("env"));
  if (app.get("env") === "development") {
    console.log("\u{1F680} Starting Vite in middleware mode...");
    await setupVite(app, server);
  } else {
    console.log("\u{1F4E6} Serving static client build...");
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5050", 10);
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  server.listen(port, host, () => {
    console.log(`\u2705 Server running on http://${host}:${port}`);
  });
})();
