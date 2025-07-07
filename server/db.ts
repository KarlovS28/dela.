import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Проверка наличия DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  console.error("Please check your .env file contains:");
  console.error("DATABASE_URL=postgresql://username:password@host:port/database");
  process.exit(1);
}

console.log("🔌 Connecting to database...");

// Исправленное подключение (убрана дублирующая инициализация)
const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 60,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

export const db = drizzle(client, { schema });

// Тестируем подключение
(async () => {
  try {
    await client`SELECT 1 as test`;
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
})();
