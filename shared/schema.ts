import { pgTable, text, serial, integer, boolean, timestamp, varchar, unique } from "drizzle-orm/pg-core";
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
  gender: text("gender").notNull().default("М"), // М - мужской, Ж - женский
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
  category: text("category", { enum: ["Техника", "Мебель"] }).notNull().default("Техника"),
  employeeId: integer("employee_id").references(() => employees.id),
  isDecommissioned: boolean("is_decommissioned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Roles table - для динамических ролей
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false), // Системные роли нельзя удалять
  createdAt: timestamp("created_at").defaultNow(),
});

// Permissions table - права доступа
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  category: text("category").notNull(), // employees, departments, equipment, users, archive, etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Role permissions - связь ролей и разрешений
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  relatedId: integer("related_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.string().min(1, "Роль обязательна"),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Таблица запросов на регистрацию
export const registrationRequests = pgTable("registration_requests", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(), // уже захешированный пароль
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default('pending').notNull(), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type RegistrationRequest = typeof registrationRequests.$inferSelect;
export type InsertRegistrationRequest = typeof registrationRequests.$inferInsert;
export const insertRegistrationRequestSchema = createInsertSchema(registrationRequests);

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
}).extend({
  gender: z.enum(["М", "Ж"]).default("М"),
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

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Combined types for API responses
export type DepartmentWithEmployees = Department & {
  employees: (Employee & { equipment: Equipment[] })[];
};

export type EmployeeWithEquipment = Employee & {
  equipment: Equipment[];
  department?: Department;
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
};

export type UserWithRole = User & {
  roleDetails?: RoleWithPermissions;
};