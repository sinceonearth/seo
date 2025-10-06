// ==================================================
// 🌱 Load environment variables early
// ==================================================
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = process.env.NODE_ENV || "development";

console.log("🔧 Loaded environment:", {
  hasDatabaseUrl: !!process.env.NEON_DATABASE_URL,
  hasSessionSecret: !!process.env.SESSION_SECRET,
  nodeEnv: process.env.NODE_ENV,
});

// ==================================================
// 🧱 Import dependencies
// ==================================================
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite"; // ✅ include serveStatic for production

// ==================================================
// ⚙️ Express App Setup
// ==================================================
const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
      if (capturedJsonResponse)
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 120) logLine = logLine.slice(0, 119) + "…";
      if (process.env.NODE_ENV !== "production") console.log(logLine); // 🧹 only log in dev
    }
  });

  next();
});

// ==================================================
// 💾 Session Setup
// ==================================================
const pgStore = connectPg(session);
const sessionStore = new pgStore({
  conString: process.env.NEON_DATABASE_URL,
  createTableIfMissing: false,
  ttl: 7 * 24 * 60 * 60, // 7 days
  tableName: "sessions",
});

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET!,
    name: "sessionId",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ secure in prod
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    },
  })
);

// ==================================================
// 🚀 Server Bootstrap
// ==================================================
(async () => {
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    console.error("❌ Express Error:", message);
    res.status(status).json({ message });
  });

  console.log("🌱 Express environment:", app.get("env"));

  // Development vs Production mode
  if (app.get("env") === "development") {
    console.log("🚀 Starting Vite in middleware mode...");
    await setupVite(app, server);
  } else {
    console.log("📦 Serving static client build...");
    serveStatic(app); // ✅ serve built files from dist/public
  }

  // ==================================================
  // 🖥️ Start the Server
  // ==================================================
  const port = parseInt(process.env.PORT || "5050", 10);
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

  server.listen(port, host, () => {
    console.log(`✅ Server running on http://${host}:${port}`);
  });
})();
