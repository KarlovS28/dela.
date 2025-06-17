import { defineConfig } from "drizzle-kit";

// Используем локальную PostgreSQL в Replit если DATABASE_URL не задана
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/dela_db";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
