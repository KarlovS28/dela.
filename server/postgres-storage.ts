
import { db } from "./db";
import { users, departments, employees, equipment } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { IStorage, User, Department, Employee, Equipment, InsertUser, InsertDepartment, InsertEmployee, InsertEquipment, DepartmentWithEmployees, EmployeeWithEquipment } from "./storage";

export class PostgresStorage implements IStorage {
  constructor() {
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      // Проверяем есть ли уже данные
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) return;

      // Создаем отделы
      const defaultDepartments = [
        "Администрация", "Менеджмент", "Аккаунтинг", "Дизайн",
        "3D & motion", "Разработка", "Офис", "unit", "div.academy"
      ];

      for (const name of defaultDepartments) {
        await db.insert(departments).values({ name });
      }

      // Создаем админа
      await this.createUser({
        email: "admin@dela.com",
        password: "admin123",
        fullName: "Администратор Системы",
        role: "admin"
      });

      console.log("Default data initialized");
    } catch (error) {
      console.error("Error initializing default data:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    return result[0];
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
    const depts = await this.getDepartments();
    const result: DepartmentWithEmployees[] = [];

    for (const dept of depts) {
      const deptEmployees = await db.select()
        .from(employees)
        .where(and(eq(employees.departmentId, dept.id), eq(employees.isArchived, false)));

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
    const result = await db.insert(departments).values(insertDepartment).returning();
    return result[0];
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.isArchived, false));
  }

  async getEmployee(id: number): Promise<EmployeeWithEquipment | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    if (!result[0]) return undefined;

    const employee = result[0];
    const equipmentList = await this.getEquipmentByEmployee(id);
    const department = employee.departmentId ? 
      await db.select().from(departments).where(eq(departments.id, employee.departmentId)).limit(1).then(r => r[0]) : 
      undefined;

    return {
      ...employee,
      equipment: equipmentList,
      department
    };
  }

  async getArchivedEmployees(): Promise<EmployeeWithEquipment[]> {
    const archivedEmps = await db.select().from(employees).where(eq(employees.isArchived, true));

    const employeesWithEquipment = await Promise.all(
      archivedEmps.map(async emp => {
        const equipmentList = await this.getEquipmentByEmployee(emp.id);
        const department = emp.departmentId ? 
          await db.select().from(departments).where(eq(departments.id, emp.departmentId)).limit(1).then(r => r[0]) : 
          undefined;

        return {
          ...emp,
          equipment: equipmentList,
          department
        };
      })
    );

    return employeesWithEquipment;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values({
      ...insertEmployee,
      isArchived: false
    }).returning();
    return result[0];
  }

  async updateEmployee(id: number, updateData: Partial<InsertEmployee>): Promise<Employee> {
    const result = await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    
    if (!result[0]) throw new Error("Employee not found");
    return result[0];
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(equipment).where(eq(equipment.employeeId, id));
    await db.delete(employees).where(eq(employees.id, id));
  }

  async archiveEmployee(id: number): Promise<Employee> {
    // Перемещаем оборудование на склад
    await db.update(equipment)
      .set({ employeeId: null })
      .where(eq(equipment.employeeId, id));

    return this.updateEmployee(id, { isArchived: true });
  }

  async getEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment);
  }

  async getEquipmentByEmployee(employeeId: number): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.employeeId, employeeId));
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const result = await db.insert(equipment).values({
      ...insertEquipment,
      category: insertEquipment.category || 'Техника',
      isDecommissioned: insertEquipment.isDecommissioned || false
    }).returning();
    return result[0];
  }

  async updateEquipment(id: number, updateData: Partial<InsertEquipment>): Promise<Equipment> {
    const result = await db.update(equipment)
      .set(updateData)
      .where(eq(equipment.id, id))
      .returning();
    
    if (!result[0]) throw new Error("Equipment not found");
    return result[0];
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getWarehouseEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment)
      .where(and(eq(equipment.employeeId, null), eq(equipment.isDecommissioned, false)));
  }

  async getDecommissionedEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.isDecommissioned, true));
  }

  async decommissionEquipment(id: number): Promise<Equipment> {
    const result = await db.update(equipment)
      .set({ isDecommissioned: true, employeeId: null })
      .where(eq(equipment.id, id))
      .returning();
    
    if (!result[0]) throw new Error("Equipment not found");
    return result[0];
  }
}
