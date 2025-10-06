import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth, requireAdmin } from "./auth";
import { insertFlightSchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import { signToken } from "./jwt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validated = registerUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsernameOrEmail(validated.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username or email already exists" });
      }

      const emailCheck = await storage.getUserByUsernameOrEmail(validated.email);
      if (emailCheck) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(validated.password);
      const user = await storage.createUser({
        username: validated.username,
        email: validated.email,
        passwordHash,
        name: validated.name,
        country: validated.country,
      });

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      // Return user without password hash and include token
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
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

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      // Return user without password hash and include token
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Login failed" });
    }
  });

  // Logout endpoint (JWT is handled client-side)
  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  // Get current user
  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
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

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ passwordHash: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Airlines routes
  app.get("/api/airlines", async (req, res) => {
    try {
      const airlines = await storage.getAllAirlines();
      res.json(airlines);
    } catch (error) {
      console.error("Error fetching airlines:", error);
      res.status(500).json({ message: "Failed to fetch airlines" });
    }
  });

  // Flight routes
  app.get("/api/flights", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const flights = await storage.getUserFlights(userId);
      res.json(flights);
    } catch (error) {
      console.error("Error fetching flights:", error);
      res.status(500).json({ message: "Failed to fetch flights" });
    }
  });

  app.post("/api/flights", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const validated = insertFlightSchema.parse({
        ...req.body,
        userId,
      });
      const flight = await storage.createFlight(validated);
      res.json(flight);
    } catch (error) {
      console.error("Error creating flight:", error);
      res.status(400).json({ message: "Failed to create flight" });
    }
  });

  app.post("/api/flights/bulk", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const flightsData = req.body.flights.map((flight: any) => ({
        ...flight,
        userId,
      }));
      const flights = await storage.createFlightsBulk(flightsData);
      res.json(flights);
    } catch (error) {
      console.error("Error creating flights in bulk:", error);
      res.status(400).json({ message: "Failed to create flights" });
    }
  });

  app.put("/api/flights/:id", requireAuth, async (req, res) => {
    try {
      const flight = await storage.updateFlight(req.params.id, req.body);
      res.json(flight);
    } catch (error) {
      console.error("Error updating flight:", error);
      res.status(400).json({ message: "Failed to update flight" });
    }
  });

  app.delete("/api/flights/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteFlight(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting flight:", error);
      res.status(400).json({ message: "Failed to delete flight" });
    }
  });

  // Flight lookup endpoint - fetch real-time flight data from Aviationstack
  app.get("/api/flights/lookup", requireAuth, async (req, res) => {
    try {
      const { flightNumber } = req.query;
      
      if (!flightNumber || typeof flightNumber !== 'string') {
        return res.status(400).json({ message: "Flight number is required" });
      }

      const apiKey = process.env.AVIATIONSTACK_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Flight lookup service not configured" });
      }

      // Call Aviationstack API
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
      
      // Log the raw API response for debugging
      console.log("Aviationstack API response:", JSON.stringify(flight, null, 2));
      
      // Map flight status to user-friendly live status
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
      
      // Transform Aviationstack response to our format
      const flightData = {
        airline: flight.airline?.iata || "",
        airlineName: flight.airline?.name || "",
        flightNumber: flight.flight?.iata || "",
        from: flight.departure?.iata || "",
        fromAirport: flight.departure?.airport || "",
        to: flight.arrival?.iata || "",
        toAirport: flight.arrival?.airport || "",
        date: flight.flight_date || "",
        departureTime: flight.departure?.scheduled?.split('T')[1]?.substring(0, 5) || "",
        arrivalTime: flight.arrival?.scheduled?.split('T')[1]?.substring(0, 5) || "",
        aircraftType: flight.aircraft?.registration || flight.aircraft?.iata || "",
        status: flight.flight_status === "landed" ? "completed" : "upcoming",
        liveStatus: getLiveStatus(),
      };

      console.log("Transformed flight data:", flightData);
      res.json(flightData);
    } catch (error) {
      console.error("Flight lookup error:", error);
      res.status(500).json({ message: "Failed to lookup flight" });
    }
  });

  // Seed/import flights endpoint - import default flights for user
  app.post("/api/flights/import-default", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      
      // Check if user already has flights
      const existingFlights = await storage.getUserFlights(userId);
      if (existingFlights.length > 0) {
        return res.status(200).json({ message: "User already has flights", count: existingFlights.length });
      }

      // Import default flights from the request body with validation
      const { flights } = req.body;
      if (!flights || !Array.isArray(flights)) {
        return res.status(400).json({ message: "Invalid flights data" });
      }

      const validFlights = flights.map((flight: any) => {
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
          status: ["completed", "upcoming", "cancelled"].includes(flight.status) ? flight.status : "completed",
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

  const httpServer = createServer(app);
  return httpServer;
}
