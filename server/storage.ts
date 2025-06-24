import {
  users,
  departments,
  employees,
  equipment,
  type User,
  type InsertUser,
  type Department,
  type InsertDepartment,
  type Employee,
  type InsertEmployee,
  type Equipment,
  type InsertEquipment,
  type DepartmentWithEmployees,
  type EmployeeWithEquipment,
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;

  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartmentsWithEmployees(): Promise<DepartmentWithEmployees[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<EmployeeWithEquipment | undefined>;
  getArchivedEmployees(): Promise<EmployeeWithEquipment[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  archiveEmployee(id: number): Promise<Employee>;

  // Equipment operations
  getEquipment(): Promise<Equipment[]>;
  getEquipmentByEmployee(employeeId: number): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, equipment: Partial<InsertEquipment>): Promise<Equipment>;
  deleteEquipment(id: number): Promise<void>;

  getUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Role management
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<RoleWithPermissions | undefined>;
  getRoleByName(name: string): Promise<RoleWithPermissions | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;

  // Permission management
  getPermissions(): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission>;
  deletePermission(id: number): Promise<void>;

  // Role-Permission management
  assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission>;
  removePermissionFromRole(roleId: number, permissionId: number): Promise<void>;
  getRolePermissions(roleId: number): Promise<Permission[]>;

  // User permissions check
  getUserPermissions(userId: number): Promise<Permission[]>;
  userHasPermission(userId: number, permissionName: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  // Добавляем заглушки для новых методов управления ролями
  async getRoles(): Promise<Role[]> { return []; }
  async getRole(id: number): Promise<RoleWithPermissions | undefined> { return undefined; }
  async getRoleByName(name: string): Promise<RoleWithPermissions | undefined> { return undefined; }
  async createRole(role: InsertRole): Promise<Role> { throw new Error("Not implemented"); }
  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role> { throw new Error("Not implemented"); }
  async deleteRole(id: number): Promise<void> { throw new Error("Not implemented"); }
  async getPermissions(): Promise<Permission[]> { return []; }
  async createPermission(permission: InsertPermission): Promise<Permission> { throw new Error("Not implemented"); }
  async updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission> { throw new Error("Not implemented"); }
  async deletePermission(id: number): Promise<void> { throw new Error("Not implemented"); }
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission> { throw new Error("Not implemented"); }
  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> { throw new Error("Not implemented"); }
  async getRolePermissions(roleId: number): Promise<Permission[]> { return []; }
  async getUserPermissions(userId: number): Promise<Permission[]> { return []; }
  async userHasPermission(userId: number, permissionName: string): Promise<boolean> { return false; }
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private employees: Map<number, Employee>;
  private equipment: Map<number, Equipment>;
  private currentUserId: number;
  private currentDepartmentId: number;
  private currentEmployeeId: number;
  private currentEquipmentId: number;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.employees = new Map();
    this.equipment = new Map();
    this.currentUserId = 1;
    this.currentDepartmentId = 1;
    this.currentEmployeeId = 1;
    this.currentEquipmentId = 1;

    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Create default departments
    const defaultDepartments = [
      "Администрация",
      "Менеджмент", 
      "Аккаунтинг",
      "Дизайн",
      "3D & motion",
      "Разработка",
      "Офис",
      "unit",
      "div.academy"
    ];

    for (const name of defaultDepartments) {
      await this.createDepartment({ name });
    }

    // Create default admin user
    await this.createUser({
      email: "admin@dela.com",
      password: "admin123",
      fullName: "Администратор Системы",
      role: "admin"
    });

    // Create sample employees
    const sampleEmployees = [
      {
        fullName: "Иванов Иван Иванович",
        position: "Директор",
        grade: "Executive",
        gender: "М" as const,
        departmentId: 1,
        photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
        passportSeries: "1234",
        passportNumber: "567890",
        passportIssuedBy: "РОВД Центрального района г. Москвы",
        passportDate: "01.01.2020",
        address: "г. Москва, ул. Примерная, д. 1, кв. 1",
        orderNumber: "№123",
        orderDate: "01.01.2023",
        responsibilityActNumber: "№456",
        responsibilityActDate: "01.01.2023"
      },
      {
        fullName: "Петрова Петра Петровна",
        position: "Проект-менеджер",
        grade: "Senior",
        gender: "Ж" as const,
        departmentId: 2,
        photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face"
      },
      {
        fullName: "Петров Петр Петрович",
        position: "Senior Developer",
        grade: "Senior",
        gender: "М" as const,
        departmentId: 6,
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        passportSeries: "5678",
        passportNumber: "123456",
        passportIssuedBy: "РОВД Северного района г. Москвы",
        passportDate: "15.03.2019",
        address: "г. Москва, ул. Разработчиков, д. 42, кв. 15",
        orderNumber: "№789",
        orderDate: "15.06.2022",
        responsibilityActNumber: "№012",
        responsibilityActDate: "15.06.2022"
      }
    ];

    for (const emp of sampleEmployees) {
      const employee = await this.createEmployee(emp);

      // Add equipment for developers
      if (emp.position.includes("Developer")) {
        await this.createEquipment({
          name: "Ноутбук Apple MacBook Pro 16\"",
          inventoryNumber: `INV-${employee.id}-001`,
          category: "Техника" as const,
          cost: "250,000 ₽",
          employeeId: employee.id
        });
        await this.createEquipment({
          name: "Монитор Dell UltraSharp 27\"",
          inventoryNumber: `INV-${employee.id}-002`,
          category: "Техника" as const,
          cost: "45,000 ₽",
          employeeId: employee.id
        });
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartmentsWithEmployees(): Promise<DepartmentWithEmployees[]> {
    const departments = await this.getDepartments();
    const result: DepartmentWithEmployees[] = [];

    for (const dept of departments) {
      const deptEmployees = Array.from(this.employees.values())
        .filter(emp => emp.departmentId === dept.id && !emp.isArchived);

      const employeesWithEquipment = await Promise.all(
        deptEmployees.map(async emp => ({
          ...emp,
          equipment: await this.getEquipmentByEmployee(emp.id)
        }))
      );

      result.push({
        ...dept,
        employees: employeesWithEquipment
      });
    }

    return result;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.currentDepartmentId++;
    const department: Department = {
      ...insertDepartment,
      id,
      createdAt: new Date(),
    };
    this.departments.set(id, department);
    return department;
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(emp => !emp.isArchived);
  }

  async getEmployee(id: number): Promise<EmployeeWithEquipment | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;

    const equipment = await this.getEquipmentByEmployee(id);
    const department = employee.departmentId ? this.departments.get(employee.departmentId) : undefined;

    return {
      ...employee,
      equipment,
      department
    };
  }

  async getArchivedEmployees(): Promise<EmployeeWithEquipment[]> {
    const archivedEmployees = Array.from(this.employees.values()).filter(emp => emp.isArchived);

    const employeesWithEquipment = await Promise.all(
      archivedEmployees.map(async emp => {
        const equipment = await this.getEquipmentByEmployee(emp.id);
        const department = emp.departmentId ? this.departments.get(emp.departmentId) : undefined;

        return {
          ...emp,
          equipment,
          department
        };
      })
    );

    return employeesWithEquipment;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.currentEmployeeId++;
    const employee: Employee = {
      id,
      fullName: insertEmployee.fullName,
      position: insertEmployee.position,
      grade: insertEmployee.grade,
      gender: insertEmployee.gender || 'М',
      departmentId: insertEmployee.departmentId || null,
      photoUrl: insertEmployee.photoUrl || null,
      passportSeries: insertEmployee.passportSeries || null,
      passportNumber: insertEmployee.passportNumber || null,
      passportIssuedBy: insertEmployee.passportIssuedBy || null,
      passportDate: insertEmployee.passportDate || null,
      address: insertEmployee.address || null,
      orderNumber: insertEmployee.orderNumber || null,
      orderDate: insertEmployee.orderDate || null,
      responsibilityActNumber: insertEmployee.responsibilityActNumber || null,
      responsibilityActDate: insertEmployee.responsibilityActDate || null,
      isArchived: false,
      createdAt: new Date(),
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, updateData: Partial<InsertEmployee>): Promise<Employee> {
    const employee = this.employees.get(id);
    if (!employee) throw new Error("Employee not found");

    const updatedEmployee = { ...employee, ...updateData };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    this.employees.delete(id);
    // Also delete associated equipment
    const equipmentToDelete = Array.from(this.equipment.values())
      .filter(eq => eq.employeeId === id);
    equipmentToDelete.forEach(eq => this.equipment.delete(eq.id));
  }

  async archiveEmployee(id: number): Promise<Employee> {
    return this.updateEmployee(id, { isArchived: true });
  }

  // Equipment operations
  async getEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values());
  }

  async getEquipmentByEmployee(employeeId: number): Promise<Equipment[]> {
    return Array.from(this.equipment.values())
      .filter(eq => eq.employeeId === employeeId);
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const id = this.currentEquipmentId++;
    const equipment: Equipment = {
      id,
      name: insertEquipment.name,
      inventoryNumber: insertEquipment.inventoryNumber,
      characteristics: insertEquipment.characteristics || null,
      cost: insertEquipment.cost || null,
      category: insertEquipment.category || 'Техника',
      employeeId: insertEquipment.employeeId ?? null,
      isDecommissioned: insertEquipment.isDecommissioned || false,
      createdAt: new Date(),
    };
    this.equipment.set(id, equipment);
    return equipment;
  }

  async updateEquipment(id: number, updateData: Partial<InsertEquipment>): Promise<Equipment> {
    const equipment = this.equipment.get(id);
    if (!equipment) throw new Error("Equipment not found");

    const updatedEquipment = { ...equipment, ...updateData };
    this.equipment.set(id, updatedEquipment);
    return updatedEquipment;
  }

  async deleteEquipment(id: number): Promise<void> {
    this.equipment.delete(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, role };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = { ...user, password: hashedPassword };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getWarehouseEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter(eq => eq.employeeId === null && !eq.isDecommissioned);
  }

  async getDecommissionedEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter(eq => eq.isDecommissioned);
  }

  async decommissionEquipment(id: number): Promise<Equipment> {
    const equipment = this.equipment.get(id);
    if (!equipment) throw new Error("Equipment not found");

    const updatedEquipment = { ...equipment, isDecommissioned: true, employeeId: null };
    this.equipment.set(id, updatedEquipment);
    return updatedEquipment;
  }
}

import { db } from "./db";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // Role management methods
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async getRole(id: number): Promise<RoleWithPermissions | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    if (!role) return undefined;

    const rolePerms = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, id));

    return {
      ...role,
      permissions: rolePerms.map(rp => rp.permission).filter(Boolean) as Permission[]
    };
  }

  async getRoleByName(name: string): Promise<RoleWithPermissions | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    if (!role) return undefined;

    const rolePerms = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, role.id));

    return {
      ...role,
      permissions: rolePerms.map(rp => rp.permission).filter(Boolean) as Permission[]
    };
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async updateRole(id: number, updateData: Partial<InsertRole>): Promise<Role> {
    const [role] = await db.update(roles).set(updateData).where(eq(roles.id, id)).returning();
    return role;
  }

  async deleteRole(id: number): Promise<void> {
    // Сначала удаляем связи с разрешениями
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    // Затем удаляем роль
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Permission management methods
  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.category, permissions.name);
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const [permission] = await db.insert(permissions).values(insertPermission).returning();
    return permission;
  }

  async updatePermission(id: number, updateData: Partial<InsertPermission>): Promise<Permission> {
    const [permission] = await db.update(permissions).set(updateData).where(eq(permissions.id, id)).returning();
    return permission;
  }

  async deletePermission(id: number): Promise<void> {
    // Сначала удаляем связи с ролями
    await db.delete(rolePermissions).where(eq(rolePermissions.permissionId, id));
    // Затем удаляем разрешение
    await db.delete(permissions).where(eq(permissions.id, id));
  }

  // Role-Permission management
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission> {
    const [rolePermission] = await db
      .insert(rolePermissions)
      .values({ roleId, permissionId })
      .returning();
    return rolePermission;
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const rolePerms = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return rolePerms.map(rp => rp.permission).filter(Boolean) as Permission[];
  }

  // User permissions
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const role = await this.getRoleByName(user.role);
    return role ? role.permissions : [];
  }

  async userHasPermission(userId: number, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.name === permissionName);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartmentsWithEmployees(): Promise<DepartmentWithEmployees[]> {
    const allDepartments = await db.select().from(departments);
    const allEmployees = await db.select().from(employees).where(eq(employees.isArchived, false));
    const allEquipment = await db.select().from(equipment);

    return allDepartments.map(dept => ({
      ...dept,
      employees: allEmployees
        .filter(emp => emp.departmentId === dept.id)
        .map(emp => ({
          ...emp,
          equipment: allEquipment.filter(equipmentItem => equipmentItem.employeeId === emp.id)
        }))
    }));
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    return department;
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: number): Promise<EmployeeWithEquipment | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    if (!employee) return undefined;

    const employeeEquipment = await db.select().from(equipment).where(eq(equipment.employeeId, id));
    const [department] = employee.departmentId 
      ? await db.select().from(departments).where(eq(departments.id, employee.departmentId))
      : [undefined];

    return {
      ...employee,
      equipment: employeeEquipment,
      department
    };
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async updateEmployee(id: number, updateData: Partial<InsertEmployee>): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async archiveEmployee(id: number): Promise<Employee> {
    // Получаем сотрудника с его оборудованием для сохранения истории
    const employeeWithEquipment = await this.getEmployee(id);
    if (!employeeWithEquipment) {
      throw new Error("Employee not found");
    }

    // Перемещаем оборудование на склад (убираем привязку к сотруднику)
    await db
      .update(equipment)
      .set({ employeeId: null })
      .where(eq(equipment.employeeId, id));

    // Архивируем сотрудника
    const [employee] = await db
      .update(employees)
      .set({ isArchived: true })
      .where(eq(employees.id, id))
      .returning();
    
    return employee;
  }

  async getEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment);
  }

  async getEquipmentByEmployee(employeeId: number): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.employeeId, employeeId));
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const [equipmentItem] = await db
      .insert(equipment)
      .values(insertEquipment)
      .returning();
    return equipmentItem;
  }

  async updateEquipment(id: number, updateData: Partial<InsertEquipment>): Promise<Equipment> {
    const [equipmentItem] = await db
      .update(equipment)
      .set(updateData)
      .where(eq(equipment.id, id))
      .returning();
    return equipmentItem;
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  async getArchivedEmployees(): Promise<EmployeeWithEquipment[]> {
    const archivedEmployees = await db.select().from(employees).where(eq(employees.isArchived, true));
    const allDepartments = await db.select().from(departments);

    return archivedEmployees.map(emp => ({
      ...emp,
      equipment: [], // Пустой список, оборудование на складе после увольнения
      department: allDepartments.find(dept => dept.id === emp.departmentId)
    }));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Методы для совместимости с MemStorage
  async getWarehouseEquipment(): Promise<Equipment[]> {
    const allEquipment = await db.select().from(equipment);
    return allEquipment.filter(item => item.employeeId === null);
  }

  async getDecommissionedEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.isDecommissioned, true));
  }

  async decommissionEquipment(id: number): Promise<Equipment> {
    const [equipmentItem] = await db
      .update(equipment)
      .set({ isDecommissioned: true, employeeId: null })
      .where(eq(equipment.id, id))
      .returning();
    return equipmentItem;
  }
}

export const storage = new DatabaseStorage();