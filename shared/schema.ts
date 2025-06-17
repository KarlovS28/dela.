
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // admin, sysadmin, accountant, office-manager
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// Departments table
export const departments = sqliteTable("departments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// Employees table
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  position: text("position").notNull(),
  grade: text("grade").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  photoUrl: text("photo_url"),
  passportSeries: text("passport_series"),
  passportNumber: text("passport_number"),
  passportIssuedBy: text("passport_issued_by"),
  passportDate: text("passport_date"),
  address: text("address"),
  orderNumber: text("order_number"),
  orderDate: text("order_date"),
  responsibilityActNumber: text("responsibility_act_number"),
  responsibilityActDate: text("responsibility_act_date"),
  isArchived: integer("is_archived", { mode: 'boolean' }).notNull().default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// Equipment table
export const equipment = sqliteTable("equipment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  inventoryNumber: text("inventory_number").notNull().unique(),
  characteristics: text("characteristics"),
  cost: text("cost"),
  category: text("category").notNull().default("Техника"), // Техника или Мебель
  employeeId: integer("employee_id").references(() => employees.id),
  isDecommissioned: integer("is_decommissioned", { mode: 'boolean' }).notNull().default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(["admin", "sysadmin", "accountant", "office-manager"]),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
}).extend({
  characteristics: z.string().optional(),
  cost: z.string().optional(),
  category: z.enum(["Техника", "Мебель"]).default("Техника"),
  employeeId: z.number().optional(),
  isDecommissioned: z.boolean().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

// Combined types for API responses
export type DepartmentWithEmployees = Department & {
  employees: (Employee & { equipment: Equipment[] })[];
};

export type EmployeeWithEquipment = Employee & {
  equipment: Equipment[];
  department?: Department;
};
