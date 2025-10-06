import {
  users,
  flights,
  airlines,
  type User,
  type UpsertUser,
  type Flight,
  type InsertFlight,
  type InsertUser,
  type Airline,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Flight operations
  getUserFlights(userId: string): Promise<Flight[]>;
  getFlight(id: string): Promise<Flight | undefined>;
  createFlight(flight: InsertFlight): Promise<Flight>;
  updateFlight(id: string, flight: Partial<InsertFlight>): Promise<Flight>;
  deleteFlight(id: string): Promise<void>;
  createFlightsBulk(flights: InsertFlight[]): Promise<Flight[]>;
  
  // Airline operations
  getAllAirlines(): Promise<Airline[]>;
  
  // Admin operations
  getAdminStats(): Promise<{
    totalUsers: number;
    totalFlights: number;
    totalAirlines: number;
    totalAirports: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail))
      );
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Flight operations
  async getUserFlights(userId: string): Promise<Flight[]> {
    return db
      .select()
      .from(flights)
      .where(eq(flights.userId, userId))
      .orderBy(desc(flights.date));
  }

  async getFlight(id: string): Promise<Flight | undefined> {
    const [flight] = await db.select().from(flights).where(eq(flights.id, id));
    return flight;
  }

  async createFlight(flightData: InsertFlight): Promise<Flight> {
    const [flight] = await db.insert(flights).values(flightData).returning();
    return flight;
  }

  async updateFlight(id: string, flightData: Partial<InsertFlight>): Promise<Flight> {
    const [flight] = await db
      .update(flights)
      .set(flightData)
      .where(eq(flights.id, id))
      .returning();
    return flight;
  }

  async deleteFlight(id: string): Promise<void> {
    await db.delete(flights).where(eq(flights.id, id));
  }

  async createFlightsBulk(flightData: InsertFlight[]): Promise<Flight[]> {
    return db.insert(flights).values(flightData).returning();
  }

  // Airline operations
  async getAllAirlines(): Promise<Airline[]> {
    return db.select().from(airlines).orderBy(airlines.name);
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalFlights: number;
    totalAirlines: number;
    totalAirports: number;
  }> {
    const allUsers = await db.select().from(users);
    const allFlights = await db.select().from(flights);
    
    const uniqueAirlines = new Set(allFlights.map(f => f.airline));
    const uniqueAirports = new Set([
      ...allFlights.map(f => f.from),
      ...allFlights.map(f => f.to)
    ]);

    return {
      totalUsers: allUsers.length,
      totalFlights: allFlights.length,
      totalAirlines: uniqueAirlines.size,
      totalAirports: uniqueAirports.size,
    };
  }
}

export const storage = new DatabaseStorage();
