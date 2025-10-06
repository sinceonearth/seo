import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  name: varchar("name").notNull(),
  country: varchar("country"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  country: z.string().min(1),
});

export const loginUserSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Flights table
export const flights = pgTable(
  "flights",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_flights_user_id").on(table.userId),
    index("idx_flights_date").on(table.date),
  ]
);

export const insertFlightSchema = createInsertSchema(flights).omit({
  id: true,
  createdAt: true,
});

export type InsertFlight = z.infer<typeof insertFlightSchema>;
export type Flight = typeof flights.$inferSelect;

// Airlines table
export const airlines = pgTable("airlines", {
  code: varchar("code", { length: 2 }).primaryKey(),
  icao: varchar("icao", { length: 3 }),
  name: varchar("name").notNull(),
  country: varchar("country").notNull(),
});

export const insertAirlineSchema = createInsertSchema(airlines);

export type InsertAirline = z.infer<typeof insertAirlineSchema>;
export type Airline = typeof airlines.$inferSelect;
