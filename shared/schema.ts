import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // admin, sysadmin, accountant, office-manager
  createdAt: timestamp("created_at").defaultNow(),
});

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
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
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Equipment table
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  inventoryNumber: text("inventory_number").notNull().unique(),
  characteristics: text("characteristics"),
  cost: text("cost"),
  employeeId: integer("employee_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
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
  employeeId: z.number(),
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
