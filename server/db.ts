
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import { mkdirSync } from "fs";
import { dirname } from "path";

// Создаем директорию data если её нет
const dbPath = "./data/database.sqlite";
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
