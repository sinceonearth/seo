import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts", // ✅ FIXED PATH
  out: "./drizzle",
  dialect: "postgresql", // or "sqlite" if using SQLite
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
