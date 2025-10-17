// ==================================================
// 🌍 Environment Setup
// ==================================================
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = process.env.NODE_ENV || "development";

console.log("🔧 Loaded environment:", {
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  hasSessionSecret: !!process.env.SESSION_SECRET,
  nodeEnv: process.env.NODE_ENV,
});

// ==================================================
// 🧱 Import Dependencies
// ==================================================
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import cors from "cors";
import cookieParser from "cookie-parser";

// ==================================================
// ⚙️ Express App Setup
// ==================================================
const app = express();
app.set("trust proxy", 1);  // Trust the proxy (for HTTPS in production)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ==================================================
// 🌐 CORS + Cookies
// ==================================================
app.use(
  cors({
    origin: [
      "https://sinceonearth.com",     // Production Frontend URL
      "http://localhost:5173",        // Local Development (Desktop)
      "http://192.168.29.116:5173",   // Local Development (Mobile)
    ],
    credentials: true,  // Allow cookies to be sent with requests
  })
);
app.use(cookieParser());

// ==================================================
// 🧾 Request Logging Middleware
// ==================================================
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 100) logLine = logLine.slice(0, 99) + "…";
      console.log(logLine);
    }
  });

  next();
});

// ==================================================
// 💾 Session Setup
// ==================================================
const PgStore = connectPg(session);

const sessionStore = new PgStore({
  conString: process.env.DATABASE_URL,  // PostgreSQL Connection String
  createTableIfMissing: false,          // Do not create the sessions table automatically
  ttl: 7 * 24 * 60 * 60,                // Session expiration: 7 days
  tableName: "sessions",                // Table name for sessions
});

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET!,  // Make sure SESSION_SECRET is set in .env
    name: "sessionId",                    // Session cookie name
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,                     // Ensures the cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === "production",  // Only send cookies over HTTPS in production
      sameSite: "lax",                    // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000,     // Cookie expiration: 7 days
      path: "/",                          // Cookie path
    },
  })
);

// ==================================================
// 🧩 Register All API Routes
// ==================================================
(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("❌ Express Error:", message);
    res.status(status).json({ message });
  });

  console.log("🌱 Express environment:", app.get("env"));

  // ==================================================
  // ⚙️ Dev Mode: Start Vite
  // ==================================================
  if (app.get("env") === "development") {
    console.log("🚀 Starting Vite in middleware mode...");
    await setupVite(app, server);  // Vite will handle hot-reloading and serving assets in dev mode
  } else {
    console.log("📦 Skipping serveStatic — dev mode only");
  }

  // ==================================================
  // 🖥️ Start the Server
  // ==================================================
  const port = parseInt(process.env.PORT || "5050", 10);  // Use process.env.PORT or fallback to 5050
  server.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}`);
  });
})();
