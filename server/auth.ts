import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { createToken } from "./jwt";
import type { RequestWithUser } from "./routes"; // adjust path if needed
import { requireAuth } from "./routes"; // make sure this is exported from routes.ts

const router = Router();

/* ===============================
   🧾 REGISTER
   =============================== */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, country } = req.body as {
      name?: string;
      username?: string;
      email?: string;
      password?: string;
      country?: string | null;
    };

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
      country: country || null,
    });

    const token = createToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      isAdmin: !!newUser.is_admin,
      alien: newUser.alien,
      country: newUser.country, // <-- include country in JWT
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
        is_admin: !!newUser.is_admin,
      },
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   🔐 LOGIN
   =============================== */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

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
      country: user.country, // <-- include country in JWT
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
        is_admin: !!user.is_admin,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   🙋 GET AUTHENTICATED USER
   =============================== */
router.get("/user", requireAuth, (req: RequestWithUser, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({
    id: user.userId,
    email: user.email,
    username: user.username,
    country: user.country ?? null, // <-- now included
    alien: user.alien,
    is_admin: user.isAdmin ?? false,
  });
});

/* ===============================
   Default Export
=============================== */
export default router;
