import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { config } from 'dotenv';

config();

const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Database URL not set. Please set NEON_DATABASE_URL or DATABASE_URL environment variable");
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error(`Invalid database URL format: ${databaseUrl.substring(0, 50)}...`);
}

let cleanedUrl = databaseUrl;
if (cleanedUrl.includes('channel_binding=require')) {
  cleanedUrl = cleanedUrl.replace('&channel_binding=require', '').replace('?channel_binding=require', '');
}

const sql = neon(cleanedUrl);
export const db = drizzle(sql, { schema });
