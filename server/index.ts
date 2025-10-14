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
import { registerRoutes } from "./routes"; // ✅ Register modular routes
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

// ==================================================
// ⚙️ Express App Setup
// ==================================================
const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ==================================================
// 🌐 CORS + Cookies
// ==================================================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.29.116:5173",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

// ==================================================
// 💾 Session Setup
// ==================================================
const pgStore = connectPg(session);
const sessionStore = new pgStore({
  conString: process.env.NEON_DATABASE_URL,
  createTableIfMissing: false,
  ttl: 7 * 24 * 60 * 60,
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
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
  // 📦 Production: Serve frontend
  // ==================================================
  if (process.env.NODE_ENV === "production") {
    const frontendPath = path.join(__dirname, "../../client/dist");
    console.log("📦 Serving frontend from:", frontendPath);

    app.use(express.static(frontendPath));

    // SPA fallback for React Router
    app.get("*", (_req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  } else {
    // ==================================================
    // ⚙️ Dev Mode: Start Vite
    // ==================================================
    console.log("🚀 Starting Vite in middleware mode...");
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  }

  // ==================================================
  // 🖥️ Start the Server
  // ==================================================
  const port = parseInt(process.env.PORT || "5050", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}`);
  });
})();
