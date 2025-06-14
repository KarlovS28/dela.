import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertEmployeeSchema, insertEquipmentSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import * as XLSX from "xlsx";

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "dela-secret-key-change-in-production",
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // 24 hours
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.session.userRole || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      
      // Auto-login after registration
      req.session.userId = user.id;
      req.session.userRole = user.role;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "No user ID in session" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Department routes
  app.get('/api/departments', requireAuth, async (req, res) => {
    try {
      const departments = await storage.getDepartmentsWithEmployees();
      res.json(departments);
    } catch (error) {
      console.error("Get departments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Employee routes
  app.get('/api/employees/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Get employee error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/employees', requireAuth, requireRole(['admin', 'sysadmin']), async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create employee error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/employees/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Role-based permissions
      const userRole = req.session.userRole;
      if (userRole === 'sysadmin') {
        // Sysadmin can only update equipment-related fields
        const allowedFields = ['fullName', 'position', 'grade', 'departmentId', 'photoUrl'];
        const filteredData = Object.keys(updateData)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => ({ ...obj, [key]: updateData[key] }), {});
        
        const employee = await storage.updateEmployee(id, filteredData);
        res.json(employee);
      } else if (userRole === 'accountant' || userRole === 'admin') {
        // Accountant and admin can update all fields
        const employee = await storage.updateEmployee(id, updateData);
        res.json(employee);
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/employees/:id/archive', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.archiveEmployee(id);
      res.json(employee);
    } catch (error) {
      console.error("Archive employee error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Equipment routes
  app.post('/api/equipment', requireAuth, async (req, res) => {
    try {
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(equipmentData);
      res.json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/equipment/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const equipment = await storage.updateEquipment(id, updateData);
      res.json(equipment);
    } catch (error) {
      console.error("Update equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/equipment/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEquipment(id);
      res.json({ message: "Equipment deleted successfully" });
    } catch (error) {
      console.error("Delete equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Excel Export routes
  app.get('/api/export/inventory', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      const data: any[] = [];
      let index = 1;
      
      for (const employee of employees) {
        if (employee.isArchived) continue;
        const equipment = await storage.getEquipmentByEmployee(employee.id);
        
        if (equipment.length === 0) {
          data.push({
            '№ п/п': index++,
            'ФИО сотрудника': employee.fullName,
            'Наименование имущества': '',
            'Инвентарный номер': '',
            'Стоимость имущества': ''
          });
        } else {
          equipment.forEach(item => {
            data.push({
              '№ п/п': index++,
              'ФИО сотрудника': employee.fullName,
              'Наименование имущества': item.name,
              'Инвентарный номер': item.inventoryNumber,
              'Стоимость имущества': item.cost
            });
          });
        }
      }
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Инвентаризация');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename=inventory.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Export inventory error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/export/employees', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      const departments = await storage.getDepartments();
      const departmentMap = new Map(departments.map(d => [d.id, d.name]));
      
      const data = employees
        .filter(emp => !emp.isArchived)
        .map(employee => ({
          'ФИО': employee.fullName,
          'Серия паспорта': employee.passportSeries || '',
          'Номер паспорта': employee.passportNumber || '',
          'Кем выдан': employee.passportIssuedBy || '',
          'Дата выдачи': employee.passportDate || '',
          'Адрес прописки': employee.address || '',
          'Должность': employee.position,
          'Грейд': employee.grade,
          'Отдел': departmentMap.get(employee.departmentId!) || ''
        }));
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Export employees error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/export/employees-public', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      const departments = await storage.getDepartments();
      const departmentMap = new Map(departments.map(d => [d.id, d.name]));
      
      const data = employees
        .filter(emp => !emp.isArchived)
        .map(employee => ({
          'ФИО': employee.fullName,
          'Должность': employee.position,
          'Грейд': employee.grade,
          'Отдел': departmentMap.get(employee.departmentId!) || ''
        }));
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename=employees-public.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Export employees public error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Print routes for employee termination
  app.get('/api/print/employee/:id/equipment', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const equipment = await storage.getEquipmentByEmployee(id);
      const data = equipment.map((item, index) => ({
        '№ п/п': index + 1,
        'Наименование имущества': item.name,
        'Инвентарный номер': item.inventoryNumber,
        'Стоимость': item.cost
      }));
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.sheet_add_aoa(wb, [['Список закрепленной техники'], [`ФИО: ${employee.fullName}`], ['']], { origin: 'A1' });
      XLSX.utils.book_append_sheet(wb, ws, 'Техника сотрудника');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', `attachment; filename=equipment-${employee.fullName}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Print employee equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/print/employee/:id/termination', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const currentDate = new Date().toLocaleDateString('ru-RU');
      const data = [{
        'ОБХОДНОЙ ЛИСТ': '',
        '': '',
        '  ': '',
        '   ': ''
      }, {
        'ФИО': employee.fullName,
        'Должность': employee.position,
        'Отдел': employee.department?.name || '',
        'Дата увольнения': currentDate
      }];
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Обходной лист');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', `attachment; filename=termination-${employee.fullName}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Print termination document error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
