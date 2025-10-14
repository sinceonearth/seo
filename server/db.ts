import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Load environment variables explicitly (optional, since dotenv/config does this)
import { config } from 'dotenv';
config();

// Retrieve the database URL from environment variables
const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Database URL not set. Please set NEON_DATABASE_URL or DATABASE_URL environment variable."
  );
}

// Validate URL format (must start with postgresql:// or postgres://)
if (
  !databaseUrl.startsWith("postgresql://") &&
  !databaseUrl.startsWith("postgres://")
) {
  throw new Error(
    `Invalid database URL format: ${databaseUrl.substring(0, 50)}...`
  );
}

// Clean URL by removing 'channel_binding=require' query param if present
const cleanedUrl = databaseUrl.replace(/([&?])channel_binding=require/, '');

// Initialize Neon client and Drizzle ORM with schema
const sql = neon(cleanedUrl);
export const db = drizzle(sql, { schema });
