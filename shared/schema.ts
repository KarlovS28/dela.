// Схема базы данных системы управления сотрудниками DELA
// Определяет структуру таблиц, типы данных и схемы валидации для PostgreSQL

// Импорт типов и функций Drizzle ORM для работы с PostgreSQL
import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
// Импорт функции создания схем валидации на основе таблиц БД
import { createInsertSchema } from "drizzle-zod";
// Импорт библиотеки валидации Zod
import { z } from "zod";

// Таблица пользователей для аутентификации и авторизации
export const users = pgTable("users", {
  id: serial("id").primaryKey(),                    // Уникальный идентификатор пользователя
  email: text("email").notNull().unique(),          // Email пользователя (уникальный)
  password: text("password").notNull(),             // Хешированный пароль
  fullName: text("full_name").notNull(),            // Полное имя пользователя
  role: text("role").notNull(),                     // Роль: admin, sysadmin, accountant, office-manager
  createdAt: timestamp("created_at").defaultNow(),  // Время создания записи
});

// Таблица отделов организации
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),                    // Уникальный идентификатор отдела
  name: text("name").notNull().unique(),            // Название отдела (уникальное)
  createdAt: timestamp("created_at").defaultNow(),  // Время создания записи
});

// Таблица сотрудников с полной информацией
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),                           // Уникальный идентификатор сотрудника
  fullName: text("full_name").notNull(),                   // ФИО сотрудника
  position: text("position").notNull(),                    // Должность
  grade: text("grade").notNull(),                          // Грейд (Junior, Middle, Senior, Lead, Executive)
  gender: text("gender").notNull().default("М"),           // Пол: М - мужской, Ж - женский
  departmentId: integer("department_id").references(() => departments.id), // ID отдела (внешний ключ)
  photoUrl: text("photo_url"),                             // URL фотографии сотрудника
  passportSeries: text("passport_series"),                 // Серия паспорта
  passportNumber: text("passport_number"),                 // Номер паспорта
  passportIssuedBy: text("passport_issued_by"),            // Кем выдан паспорт
  passportDate: text("passport_date"),                     // Дата выдачи паспорта
  address: text("address"),                                // Адрес прописки
  orderNumber: text("order_number"),                       // Номер приказа о приеме на работу
  orderDate: text("order_date"),                           // Дата приказа о приеме
  responsibilityActNumber: text("responsibility_act_number"), // Номер акта материальной ответственности
  responsibilityActDate: text("responsibility_act_date"),  // Дата акта материальной ответственности
  isArchived: boolean("is_archived").default(false),      // Флаг архивирования (уволенные)
  createdAt: timestamp("created_at").defaultNow(),        // Время создания записи
});

// Таблица оборудования и материальных ценностей
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),                           // Уникальный идентификатор оборудования
  name: text("name").notNull(),                            // Наименование оборудования
  inventoryNumber: text("inventory_number").notNull().unique(), // Инвентарный номер (уникальный)
  characteristics: text("characteristics"),                // Характеристики оборудования
  cost: text("cost"),                                      // Стоимость оборудования
  category: text("category").notNull().default("Техника"), // Категория: Техника или Мебель
  employeeId: integer("employee_id").references(() => employees.id), // ID сотрудника (null = на складе)
  isDecommissioned: boolean("is_decommissioned").default(false), // Флаг списания
  createdAt: timestamp("created_at").defaultNow(),        // Время создания записи
});

// Схемы валидации для вставки данных (без автогенерируемых полей)

// Схема для создания пользователя
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,        // Исключаем автогенерируемый ID
  createdAt: true, // Исключаем автогенерируемую дату
}).extend({
  role: z.enum(["admin", "sysadmin", "accountant", "office-manager"]), // Валидация ролей
});

// Схема для создания отдела
export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

// Схема для создания сотрудника
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
}).extend({
  gender: z.enum(["М", "Ж"]).default("М"), // Валидация пола с значением по умолчанию
});

// Схема для создания оборудования
export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
}).extend({
  characteristics: z.string().optional(),    // Характеристики опциональны
  cost: z.string().optional(),               // Стоимость опциональна
  category: z.enum(["Техника", "Мебель"]).default("Техника"), // Валидация категории
  employeeId: z.number().optional(),         // ID сотрудника опционален (для склада)
  isDecommissioned: z.boolean().optional(),  // Флаг списания опционален
});

// Экспорт базовых типов данных для использования в приложении

// Типы для пользователей
export type User = typeof users.$inferSelect;           // Тип пользователя из БД
export type InsertUser = z.infer<typeof insertUserSchema>; // Тип для создания пользователя

// Типы для отделов
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

// Типы для сотрудников
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Типы для оборудования
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

// Комбинированные типы для API ответов с связанными данными

// Отдел с полным списком сотрудников и их оборудованием
export type DepartmentWithEmployees = Department & {
  employees: (Employee & { equipment: Equipment[] })[];
};

// Сотрудник с полным списком оборудования и информацией об отделе
export type EmployeeWithEquipment = Employee & {
  equipment: Equipment[];
  department?: Department;
};
