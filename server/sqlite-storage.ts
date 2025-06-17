
import { db } from "./db";
import { users, departments, employees, equipment } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { 
  IStorage,
  User,
  Department,
  Employee,
  Equipment,
  InsertUser,
  InsertDepartment,
  InsertEmployee,
  InsertEquipment,
  DepartmentWithEmployees,
  EmployeeWithEquipment
} from "./storage";

export class SQLiteStorage implements IStorage {
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

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values({
      ...user,
      password: hashedPassword,
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
    const deps = await db.select().from(departments);
    const result: DepartmentWithEmployees[] = [];

    for (const dept of deps) {
      const employeesList = await db.select().from(employees)
        .where(and(eq(employees.departmentId, dept.id), eq(employees.isArchived, false)));
      
      const employeesWithEquipment = [];
      for (const emp of employeesList) {
        const equipmentList = await db.select().from(equipment)
          .where(and(eq(equipment.employeeId, emp.id), eq(equipment.isDecommissioned, false)));
        employeesWithEquipment.push({ ...emp, equipment: equipmentList });
      }

      result.push({
        ...dept,
        employees: employeesWithEquipment,
      });
    }

    return result;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.isArchived, false));
  }

  async getEmployee(id: number): Promise<EmployeeWithEquipment | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    if (!result[0]) return undefined;

    const employeeEquipment = await db.select().from(equipment)
      .where(and(eq(equipment.employeeId, id), eq(equipment.isDecommissioned, false)));

    const department = result[0].departmentId 
      ? await db.select().from(departments).where(eq(departments.id, result[0].departmentId)).limit(1)
      : undefined;

    return {
      ...result[0],
      equipment: employeeEquipment,
      department: department?.[0],
    };
  }

  async getArchivedEmployees(): Promise<EmployeeWithEquipment[]> {
    const archivedEmployees = await db.select().from(employees).where(eq(employees.isArchived, true));
    const result: EmployeeWithEquipment[] = [];

    for (const emp of archivedEmployees) {
      const equipmentList = await db.select().from(equipment)
        .where(eq(equipment.employeeId, emp.id));
      result.push({ ...emp, equipment: equipmentList });
    }

    return result;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values(employee).returning();
    return result[0];
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const result = await db.update(employees).set(employee).where(eq(employees.id, id)).returning();
    return result[0];
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async archiveEmployee(id: number): Promise<Employee> {
    const result = await db.update(employees)
      .set({ isArchived: true })
      .where(eq(employees.id, id))
      .returning();
    return result[0];
  }

  async getEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.isDecommissioned, false));
  }

  async getEquipmentByEmployee(employeeId: number): Promise<Equipment[]> {
    return await db.select().from(equipment)
      .where(and(eq(equipment.employeeId, employeeId), eq(equipment.isDecommissioned, false)));
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const result = await db.insert(equipment).values(equipmentData).returning();
    return result[0];
  }

  async updateEquipment(id: number, equipmentData: Partial<InsertEquipment>): Promise<Equipment> {
    const result = await db.update(equipment).set(equipmentData).where(eq(equipment.id, id)).returning();
    return result[0];
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const result = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
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
}
