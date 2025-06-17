
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Используем локальную PostgreSQL в Replit если DATABASE_URL не задана
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/dela_db";

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
