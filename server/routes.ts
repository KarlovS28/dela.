// Основной файл маршрутизации API для системы управления сотрудниками
// Содержит все API endpoints для аутентификации, управления сотрудниками, отделами, оборудованием
// Включает функции экспорта/импорта Excel, генерации DOCX документов
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertEmployeeSchema, insertEquipmentSchema } from "@shared/schema";
import { initializeRolesAndPermissions } from "./init-roles";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import * as XLSX from "xlsx"; // Библиотека для работы с Excel файлами
import multer from "multer"; // Middleware для загрузки файлов
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from "docx"; // Библиотека для создания DOCX документов

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}

const MemoryStoreSession = MemoryStore(session);

// Настройка multer для загрузки файлов
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Инициализируем роли и разрешения при запуске
  setTimeout(async () => {
    try {
      await initializeRolesAndPermissions();
      console.log("Roles and permissions initialized");
    } catch (error) {
      console.error("Failed to initialize roles and permissions:", error);
    }
  }, 3000);

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
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Только администраторы могут регистрировать пользователей" });
      }

      const { email, password, fullName, role = "accountant" } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким email уже существует" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        fullName,
        role
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Ошибка при регистрации пользователя" });
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

  // User management routes
  app.get('/api/users', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Не возвращаем пароли
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { role } = req.body;

      if (!role || !['admin', 'sysadmin', 'accountant', 'office-manager'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/users/:id/password', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await storage.updateUserPassword(id, newPassword);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = req.session.userId;

      if (id === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Employee routes
  app.get('/api/employees/archived', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
      const archivedEmployees = await storage.getArchivedEmployees();
      res.json(archivedEmployees);
    } catch (error) {
      console.error("Get archived employees error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/employees/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
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
      if (userRole === 'sysadmin' || userRole === 'office-manager') {
        // Sysadmin and office-manager can only update basic fields, no personal data
        const allowedFields = ['fullName', 'position', 'departmentId', 'photoUrl'];
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
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
      const employee = await storage.archiveEmployee(id);
      res.json(employee);
    } catch (error) {
      console.error("Archive employee error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Equipment routes
  app.post('/api/equipment', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager']), async (req, res) => {
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

  app.put('/api/equipment/:id', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager']), async (req, res) => {
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

  app.delete('/api/equipment/:id', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEquipment(id);
      res.json({ message: "Equipment deleted successfully" });
    } catch (error) {
      console.error("Delete equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Warehouse routes
  app.get('/api/warehouse/equipment', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager', 'accountant']), async (req, res) => {
    try {
      const warehouseEquipment = await storage.getWarehouseEquipment();
      res.json(warehouseEquipment);
    } catch (error) {
      console.error("Get warehouse equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Decommissioned equipment routes
  app.get('/api/decommissioned/equipment', requireAuth, async (req, res) => {
    try {
      const decommissionedEquipment = await storage.getDecommissionedEquipment();
      res.json(decommissionedEquipment);
    } catch (error) {
      console.error("Get decommissioned equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/equipment/:id/decommission', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager', 'accountant']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const equipment = await storage.decommissionEquipment(id);
      res.json(equipment);
    } catch (error) {
      console.error("Decommission equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/equipment/:id/assign', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { employeeId } = req.body;
      const equipment = await storage.updateEquipment(id, { employeeId });
      res.json(equipment);
    } catch (error) {
      console.error("Assign equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Загрузка фотографии сотрудника
  app.post('/api/employees/:id/photo', requireAuth, requireRole(['admin', 'accountant']), upload.single('photo'), async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (!req.file) {
        return res.status(400).json({ message: "Файл не найден" });
      }

      // В реальном приложении здесь была бы загрузка в облачное хранилище
      // Для демонстрации сохраняем как base64
      const photoBuffer = req.file.buffer;
      const photoBase64 = `data:${req.file.mimetype};base64,${photoBuffer.toString('base64')}`;

      const updatedEmployee = await storage.updateEmployee(employeeId, {
        photoUrl: photoBase64
      });

      res.json(updatedEmployee);
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Загрузка шаблонов документов
  app.post('/api/templates/responsibility-act', requireAuth, requireRole(['admin', 'accountant']), upload.single('template'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не найден" });
      }

      // В реальном приложении здесь была бы сохранение шаблона в файловую систему
      // Для демонстрации просто возвращаем успех
      console.log('Uploaded responsibility act template:', req.file.originalname, req.file.size, 'bytes');

      res.json({ 
        message: "Шаблон акта материальной ответственности успешно загружен",
        filename: req.file.originalname 
      });
    } catch (error) {
      console.error('Template upload error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/templates/termination-checklist', requireAuth, requireRole(['admin', 'accountant']), upload.single('template'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не найден" });
      }

      // В реальном приложении здесь была бы сохранение шаблона в файловую систему
      // Для демонстрации просто возвращаем успех
      console.log('Uploaded termination checklist template:', req.file.originalname, req.file.size, 'bytes');

      res.json({ 
        message: "Шаблон обходного листа успешно загружен",
        filename: req.file.originalname 
      });
    } catch (error) {
      console.error('Template upload error:', error);
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
              'Категория': '',
              'Характеристики': '',
              'Стоимость имущества': ''
            });
        } else {
          // Поддержка нескольких единиц имущества для одного сотрудника
          equipment.forEach((item, equipmentIndex) => {
            data.push({
              '№ п/п': index++,
              'ФИО сотрудника': equipmentIndex === 0 ? employee.fullName : '', // ФИО только в первой строке
              'Наименование имущества': item.name,
              'Инвентарный номер': item.inventoryNumber,
              'Категория': (item as any).category || 'Техника',
              'Характеристики': item.characteristics || '',
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

  // Экспорт списанного имущества
  app.get('/api/export/decommissioned', requireAuth, async (req, res) => {
    try {
      const decommissionedEquipment = await storage.getDecommissionedEquipment();

      const data = decommissionedEquipment.map((item, index) => ({
        '№ п/п': index + 1,
        'Наименование имущества': item.name,
        'Инвентарный номер': item.inventoryNumber,
        'Категория': (item as any).category || 'Техника',
        'Характеристики': item.characteristics || '',
        'Стоимость': item.cost || '',
        'Дата списания': new Date().toLocaleDateString('ru-RU')
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Списанное имущество');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=decommissioned-equipment.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Export decommissioned equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Экспорт выбранного имущества из склада в DOCX
  app.post('/api/export/selected-equipment', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager']), async (req, res) => {
    try {
      const { equipmentIds } = req.body;
      if (!equipmentIds || !Array.isArray(equipmentIds)) {
        return res.status(400).json({ message: "Equipment IDs are required" });
      }

      const allEquipment = await storage.getWarehouseEquipment();
      const selectedEquipment = allEquipment.filter(eq => equipmentIds.includes(eq.id));

      // Создание DOCX документа
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "СПИСОК ВЫБРАННОГО ИМУЩЕСТВА СО СКЛАДА",
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Дата составления: ${new Date().toLocaleDateString('ru-RU')}`,
                  size: 22,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 400 },
            }),

            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "№ п/п", bold: true, size: 20 })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Наименование", bold: true, size: 20 })] })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Инв. номер", bold: true, size: 20 })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Категория", bold: true, size: 20 })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Стоимость", bold: true, size: 20 })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Характеристики", bold: true, size: 20 })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                ...selectedEquipment.map((item, index) => new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString(), size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.name, size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.inventoryNumber, size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (item as any).category || 'Техника', size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.cost || '', size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.characteristics || '', size: 18 })] })],
                    }),
                  ],
                })),
              ],
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);

      res.setHeader('Content-Disposition', 'attachment; filename*=UTF-8\'\'selected-equipment.docx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(buffer);
    } catch (error) {
      console.error("Export selected equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Полный экспорт инвентаризации с ролевыми ограничениями
  app.get('/api/export/inventory-full', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      const departments = await storage.getDepartments();
      const departmentMap = new Map(departments.map(d => [d.id, d.name]));
      const userRole = req.session.userRole;

      const data = [];

      for (const employee of employees.filter(emp => !emp.isArchived)) {
        const equipment = await storage.getEquipmentByEmployee(employee.id);

        // Базовые данные для всех ролей
        const baseData = {
          'ФИО': employee.fullName,
          'Пол': employee.gender || '',
          'Должность': employee.position,
          'Отдел': departmentMap.get(employee.departmentId!) || ''
        };

        // Полные данные только для админа и бухгалтера
        if (['admin', 'accountant'].includes(userRole!)) {
          Object.assign(baseData, {
            'Грейд': employee.grade,
            'Серия паспорта': employee.passportSeries || '',
            'Номер паспорта': employee.passportNumber || '',
            'Кем выдан': employee.passportIssuedBy || '',
            'Дата выдачи паспорта': employee.passportDate || '',
            'Адрес прописки': employee.address || '',
            'Номер приказа о приеме': employee.orderNumber || '',
            'Дата приказа о приеме': employee.orderDate || '',
            'Номер акта мат. ответственности': employee.responsibilityActNumber || '',
            'Дата акта мат. ответственности': employee.responsibilityActDate || ''
          });
        }

        // Добавляем данные об оборудовании - поддержка нескольких единиц имущества
        if (equipment.length > 0) {
          equipment.forEach((item, index) => {
            // Для дополнительных строк оборудования оставляем только ФИО
            const rowData = index === 0 ? { ...baseData } : {
              'ФИО': employee.fullName,
              'Пол': '',
              'Должность': '',
              'Отдел': ''
            };

            // Очищаем дополнительные поля для последующих строк оборудования
            if (index > 0 && ['admin', 'accountant'].includes(userRole!)) {
              Object.assign(rowData, {
                'Грейд': '',
                'Серия паспорта': '',
                'Номер паспорта': '',
                'Кем выдан': '',
                'Дата выдачи паспорта': '',
                'Адрес прописки': '',
                'Номер приказа о приеме': '',
                'Дата приказа о приеме': '',
                'Номер акта мат. ответственности': '',
                'Дата акта мат. ответственности': ''
              });
            }

            Object.assign(rowData, {
              'Наименование имущества': item.name,
              'Инвентарный номер': item.inventoryNumber,
              'Категория': (item as any).category || 'Техника',
              'Характеристики': item.characteristics || '',
              'Стоимость': item.cost
            });
            data.push(rowData);
          });
        } else {
          // Сотрудник без оборудования
          data.push({
            ...baseData,
            'Наименование имущества': '',
            'Инвентарный номер': '',
            'Категория': '',
            'Характеристики': '',
            'Стоимость': ''
          });
        }
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Инвентаризация');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=inventory-full.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Export inventory full error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Импорт имущества на склад
  app.post('/api/import/warehouse-equipment', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager']), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не найден" });
      }

      const workbook = XLSX.read(req.file.buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let importedCount = 0;
      let skippedCount = 0;
      let errors: string[] = [];

      // Кэш существующих инвентарных номеров
      const existingEquipment = await storage.getEquipment();
      const existingInventoryNumbers = new Set(existingEquipment.map(eq => eq.inventoryNumber));

      for (const row of data as any[]) {
        try {
          if (row['Наименование оборудования'] && row['Инвентарный номер']) {
            const inventoryNumber = String(row['Инвентарный номер']).trim();
            
            // Проверяем, не существует ли уже такой инвентарный номер
            if (existingInventoryNumbers.has(inventoryNumber)) {
              skippedCount++;
              continue;
            }

            const equipmentData = {
              name: String(row['Наименование оборудования']).trim(),
              inventoryNumber,
              characteristics: row['Характеристики'] ? String(row['Характеристики']).trim() : undefined,
              cost: row['Стоимость'] ? String(row['Стоимость']).trim() : '0',
              category: row['Категория'] && String(row['Категория']).trim().toLowerCase().includes('мебель') 
                ? 'Мебель' as const 
                : 'Техника' as const,
              employeeId: null, // На склад
            };

            await storage.createEquipment(equipmentData);
            existingInventoryNumbers.add(inventoryNumber);
            importedCount++;
          }
        } catch (error) {
          console.error("Ошибка импорта оборудования:", error);
          errors.push(`Ошибка импорта: ${row['Наименование оборудования'] || 'неизвестное оборудование'}`);
        }
      }

      res.json({ 
        message: `Импортировано ${importedCount} единиц оборудования на склад${skippedCount > 0 ? `, пропущено ${skippedCount} существующих` : ''}`, 
        errors: errors.length > 0 ? errors : null 
      });
    } catch (error) {
      console.error("Import warehouse equipment error:", error);
      res.status(500).json({ message: "Ошибка импорта оборудования" });
    }
  });

  // Шаблон для импорта имущества
  app.get('/api/template/warehouse-equipment', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager']), async (req, res) => {
    try {
      const templateData = [
        {
          '№ п/п': 1,
          'Наименование оборудования': 'Ноутбук Dell Latitude',
          'Инвентарный номер': 'INV-2024-001',
          'Характеристики': 'Intel i7, 16GB RAM, 512GB SSD',
          'Стоимость': '85000',
          'Категория': 'Техника'
        },
        {
          '№ п/п': 2,
          'Наименование оборудования': 'Стол офисный',
          'Инвентарный номер': 'INV-2024-002',
          'Характеристики': '120x60 см, белый',
          'Стоимость': '15000',
          'Категория': 'Мебель'
        },
        {
          '№ п/п': 3,
          'Наименование оборудования': 'Монитор Samsung 27"',
          'Инвентарный номер': 'INV-2024-003',
          'Характеристики': '27", 4K, IPS матрица',
          'Стоимость': '35000',
          'Категория': 'Техника'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Шаблон');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=template-warehouse-equipment.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Get warehouse template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Маршруты импорта Excel файлов
  app.post('/api/import/employees', requireAuth, requireRole(['admin', 'accountant']), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не найден" });
      }

      const workbook = XLSX.read(req.file.buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let importedCount = 0;
      let equipmentCount = 0;
      let skippedCount = 0;
      let errors: string[] = [];

      // Кэш отделов для оптимизации
      const departmentCache = new Map<string, number>();
      const existingDepartments = await storage.getDepartments();
      existingDepartments.forEach(dept => departmentCache.set(dept.name, dept.id));
      let createdDepartments = 0;

      // Кэш существующих сотрудников для предотвращения дублирования
      const existingEmployees = await storage.getEmployees();
      const existingEmployeeNames = new Set(existingEmployees.map(emp => emp.fullName.trim()));

      // Кэш сотрудников для добавления оборудования
      const employeeCache = new Map<string, number>();
      existingEmployees.forEach(emp => employeeCache.set(emp.fullName.trim(), emp.id));
      let lastEmployeeId: number | null = null;

      // Кэш существующих инвентарных номеров
      const existingEquipment = await storage.getEquipment();
      const existingInventoryNumbers = new Set(existingEquipment.map(eq => eq.inventoryNumber));

      for (const row of data as any[]) {
        try {
          // Если указано ФИО и должность - создаем/находим сотрудника
          if (row['ФИО'] && row['Должность']) {
            let departmentId = 1; // По умолчанию администрация

            // Обработка отдела - создание если не существует
            if (row['Отдел']) {
              const departmentName = String(row['Отдел']).trim();

              if (departmentCache.has(departmentName)) {
                departmentId = departmentCache.get(departmentName)!;
              } else {
                // Создаем новый отдел
                const newDepartment = await storage.createDepartment({ name: departmentName });
                departmentCache.set(departmentName, newDepartment.id);
                departmentId = newDepartment.id;
                createdDepartments++;
              }
            }

            const fullName = String(row['ФИО']).trim();
            let employeeId = employeeCache.get(fullName);

            // Создаем сотрудника только если его еще нет
            if (!employeeId) {
              if (existingEmployeeNames.has(fullName)) {
                // Сотрудник уже существует, пропускаем
                skippedCount++;
                const existingEmployee = existingEmployees.find(emp => emp.fullName.trim() === fullName);
                if (existingEmployee) {
                  employeeId = existingEmployee.id;
                  employeeCache.set(fullName, employeeId);
                }
              } else {
                // Обработка пола
                let gender: 'М' | 'Ж' | undefined = undefined;
                if (row['Пол']) {
                  const genderValue = String(row['Пол']).trim().toUpperCase();
                  if (genderValue === 'М' || genderValue === 'МУЖСКОЙ' || genderValue === 'M') {
                    gender = 'М';
                  } else if (genderValue === 'Ж' || genderValue === 'ЖЕНСКИЙ' || genderValue === 'F') {
                    gender = 'Ж';
                  }
                }

                const employeeData = {
                  fullName,
                  position: String(row['Должность']).trim(),
                  grade: row['Грейд'] ? String(row['Грейд']).trim() : 'Junior',
                  gender: gender || 'М',
                  departmentId,
                  passportSeries: row['Серия паспорта'] ? String(row['Серия паспорта']).trim() : undefined,
                  passportNumber: row['Номер паспорта'] ? String(row['Номер паспорта']).trim() : undefined,
                  passportIssuedBy: row['Кем выдан'] ? String(row['Кем выдан']).trim() : undefined,
                  passportDate: row['Дата выдачи'] || row['Дата выдачи паспорта'] ? String(row['Дата выдачи'] || row['Дата выдачи паспорта']).trim() : undefined,
                  address: row['Адрес прописки'] || row['Адрес'] ? String(row['Адрес прописки'] || row['Адрес']).trim() : undefined,
                  orderNumber: row['Номер приказа'] || row['Номер приказа о приеме'] ? String(row['Номер приказа'] || row['Номер приказа о приеме']).trim() : undefined,
                  orderDate: row['Дата приказа'] || row['Дата приказа о приеме'] ? String(row['Дата приказа'] || row['Дата приказа о приеме']).trim() : undefined,
                  responsibilityActNumber: row['Номер акта мат. ответственности'] || row['Номер акта материальной ответственности'] ? String(row['Номер акта мат. ответственности'] || row['Номер акта материальной ответственности']).trim() : undefined,
                  responsibilityActDate: row['Дата акта мат. ответственности'] || row['Дата акта материальной ответственности'] ? String(row['Дата акта мат. ответственности'] || row['Дата акта материальной ответственности']).trim() : undefined,
                };

                const employee = await storage.createEmployee(employeeData);
                employeeId = employee.id;
                employeeCache.set(fullName, employeeId);
                existingEmployeeNames.add(fullName);
                importedCount++;
              }
            }

            // Обновляем последнего сотрудника
            lastEmployeeId = employeeId;

            // Добавляем оборудование, если оно указано и не дублируется
            if (row['Наименование имущества'] && row['Инвентарный номер']) {
              const inventoryNumber = String(row['Инвентарный номер']).trim();
              
              if (!existingInventoryNumbers.has(inventoryNumber)) {
                const equipmentData = {
                  name: String(row['Наименование имущества']).trim(),
                  inventoryNumber,
                  characteristics: row['Характеристики'] ? String(row['Характеристики']).trim() : undefined,
                  cost: row['Стоимость'] || row['Стоимость имущества'] ? String(row['Стоимость'] || row['Стоимость имущества']).trim() : '0',
                  employeeId,
                };

                await storage.createEquipment(equipmentData);
                existingInventoryNumbers.add(inventoryNumber);
                equipmentCount++;
              }
            }
          } 
          // Если ФИО пустое, но есть оборудование - привязываем к последнему сотруднику
          else if ((!row['ФИО'] || String(row['ФИО']).trim() === '') && 
                   row['Наименование имущества'] && 
                   row['Инвентарный номер'] && 
                   lastEmployeeId) {

            const inventoryNumber = String(row['Инвентарный номер']).trim();
            
            if (!existingInventoryNumbers.has(inventoryNumber)) {
              const equipmentData = {
                name: String(row['Наименование имущества']).trim(),
                inventoryNumber,
                characteristics: row['Характеристики'] ? String(row['Характеристики']).trim() : undefined,
                cost: row['Стоимость'] || row['Стоимость имущества'] ? String(row['Стоимость'] || row['Стоимость имущества']).trim() : '0',
                category: row['Категория'] && String(row['Категория']).trim().toLowerCase().includes('мебель') 
                  ? 'Мебель' as const 
                  : 'Техника' as const,
                employeeId: lastEmployeeId,
              };

              await storage.createEquipment(equipmentData);
              existingInventoryNumbers.add(inventoryNumber);
              equipmentCount++;
            }
          }
        } catch (error) {
          console.error("Ошибка импорта строки:", error);
          errors.push(`Ошибка импорта: ${row['ФИО'] || 'неизвестный сотрудник'}`);
        }
      }

      res.json({ 
        message: `Импортировано ${importedCount} новых сотрудников${equipmentCount > 0 ? `, ${equipmentCount} единиц оборудования` : ''}${createdDepartments > 0 ? `, создано ${createdDepartments} отделов` : ''}${skippedCount > 0 ? `, пропущено ${skippedCount} существующих сотрудников` : ''}`, 
        errors: errors.length > 0 ? errors : null 
      });
    } catch (error) {
      console.error("Import employees error:", error);
      res.status(500).json({ message: "Ошибка импорта" });
    }
  });

  app.post('/api/import/equipment', requireAuth, requireRole(['admin', 'sysadmin', 'office-manager']), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не найден" });
      }

      const workbook = XLSX.read(req.file.buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let importedCount = 0;
      let errors: string[] = [];

      for (const row of data as any[]) {
        try {
          if (row['Наименование имущества'] && row['Инвентарный номер']) {
            // Поиск сотрудника по ФИО
            const employees = await storage.getEmployees();
            const employee = employees.find(emp => emp.fullName === row['ФИО сотрудника']);

            if (employee?.id) {
              const equipmentData = {
                name: row['Наименование имущества'],
                inventoryNumber: row['Инвентарный номер'],
                cost: row['Стоимость имущества'] || '0',
                employeeId: employee.id,
              };

              await storage.createEquipment(equipmentData);
            }
            importedCount++;
          }
        } catch (error) {
          errors.push(`Ошибка импорта оборудования: ${JSON.stringify(row)}`);
        }
      }

      res.json({ 
        message: `Импортировано ${importedCount} единиц оборудования`, 
        errors: errors.length > 0 ? errors : null 
      });
    } catch (error) {
      console.error("Import equipment error:", error);
      res.status(500).json({ message: "Ошибка импорта оборудования" });
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
        'Характеристики': item.characteristics || '',
        'Стоимость': item.cost
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.sheet_add_aoa(wb, [['Список закрепленной техники'], [`ФИО: ${employee.fullName}`], ['']], { origin: 'A1' });
      XLSX.utils.book_append_sheet(wb, ws, 'Техника сотрудника');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const safeFileName = employee.fullName.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
      res.setHeader('Content-Disposition', `attachment; filename=equipment-${safeFileName}.xlsx`);
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

  // Маршруты для генерации DOCX документов
  app.get('/api/docx/responsibility-act/:id', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Создание документа DOCX для акта материальной ответственности согласно новому шаблону
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Заголовок документа
            new Paragraph({
              children: [
                new TextRun({
                  text: `Акт приема-передачи № ${employee.responsibilityActNumber || '__'}`,
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "материальных ценностей исполнителю",
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Дата документа
            new Paragraph({
              children: [
                new TextRun({
                  text: `« ${employee.responsibilityActDate ? new Date(employee.responsibilityActDate).getDate().toString().padStart(2, '0') : '__'} »   ${employee.responsibilityActDate ? new Date(employee.responsibilityActDate).toLocaleDateString('ru-RU', { month: 'long' }) : '_______'}           20${employee.responsibilityActDate ? new Date(employee.responsibilityActDate).getFullYear().toString().slice(-2) : '__'}     г.`,
                  size: 22,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 400 },
            }),

            // Основной текст акта
            new Paragraph({
              children: [
                new TextRun({
                  text: `Общество с ограниченной ответственностью «МассПроект», далее именуемый "Работодатель", в лице директора Скородедова Филиппа Игоревича, действующего на основании Устава, c одной стороны и ${employee.gender === 'Ж' ? 'гражданка' : 'гражданин'} ${employee.fullName || '_____________________________'} (паспортные данные ${employee.passportSeries || '______'} № ${employee.passportNumber || '________'} выдан ${employee.passportDate || '__.__._____ '} ${employee.passportIssuedBy || '_____________________________________________________'}, зарегистрированный по адресу: ${employee.address || '________________________________________________________________'}, именуемый в дальнейшем "Работник", с другой стороны, составили настоящий акт о следующем:`,
                  size: 22,
                }),
              ],
              spacing: { after: 400 },
              alignment: AlignmentType.JUSTIFIED,
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `1. В соответствии с Трудовым договором № ${employee.orderNumber || '__-___'} от ${employee.orderDate || '__.__.______ г.'} и Договором о полной материальной ответственности работника № ${employee.responsibilityActNumber || '__-____'} от ${employee.responsibilityActDate || '__.__._____г.'} Работодатель передал, а Работник принял следующие материальные ценности для выполнения своих должностных обязанностей:`,
                  size: 22,
                }),
              ],
              spacing: { after: 400 },
              alignment: AlignmentType.JUSTIFIED,
            }),

            // Таблица с материальными ценностями
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                // Заголовок таблицы
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "№ п/п", bold: true, size: 20 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { line: 240 }
                      })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Наименование материальных ценностей", bold: true, size: 20 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { line: 240 }
                      })],
                      width: { size: 55, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Инвентаризационный номер", bold: true, size: 20 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { line: 240 }
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: "Сумма, руб.", bold: true, size: 20 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { line: 240 }
                      })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                // Строки с оборудованием (всегда 18 строк согласно шаблону)
                ...Array.from({ length: 18 }, (_, index) => {
                  const item = employee.equipment && employee.equipment[index];
                  return new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: (index + 1).toString(), size: 18 })],
                          alignment: AlignmentType.CENTER,
                          spacing: { line: 240 }
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: item?.name || "", size: 18 })],
                          spacing: { line: 240 }
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: item?.inventoryNumber || "", size: 18 })],
                          alignment: AlignmentType.CENTER,
                          spacing: { line: 240 }
                        })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: item?.cost || "", size: 18 })],
                          alignment: AlignmentType.RIGHT,
                          spacing: { line: 240 }
                        })],
                      }),
                    ],
                  });
                }),
                // Итоговая строка
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "", size: 18 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { line: 240 }
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Итого:", bold: true, size: 18 })],
                        alignment: AlignmentType.RIGHT,
                        spacing: { line: 240 }
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "", size: 18 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { line: 240 }
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ 
                          text: employee.equipment?.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0).toFixed(2) || "0.00", 
                          bold: true, 
                          size: 18 
                        })],
                        alignment: AlignmentType.RIGHT,
                        spacing: { line: 240 }
                      })],
                    }),
                  ],
                }),
              ],
            }),

            // Пункты акта
            new Paragraph({
              children: [
                new TextRun({
                  text: "2.Материальные ценности проверены и посчитаны в присутствии сторон.",
                  size: 22,
                }),
              ],
              spacing: { before: 300, after: 200 },
              alignment: AlignmentType.JUSTIFIED,
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "3.Настоящий акт составлен в двух экземплярах, по одному для каждой стороны.",
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED,
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "4.Подписи сторон.",
                  size: 22,
                }),
              ],
              spacing: { after: 400 },
              alignment: AlignmentType.JUSTIFIED,
            }),

            // Подписи
            new Paragraph({
              children: [new TextRun({ text: "", size: 20 })],
              spacing: { after: 400, line: 240 },
              indent: { firstLine: 360 }
            }),
            new Paragraph({ 
              children: [new TextRun({ text: "Заказчик                                                                          Работник", bold: true, size: 20 })],
              spacing: { after: 400, line: 240 },
              indent: { firstLine: 360 }
            }),
            new Paragraph({ 
              children: [new TextRun({ text: "", size: 20 })],
              spacing: { after: 400, line: 240 },
              indent: { firstLine: 360 }
            }),
            new Paragraph({ 
              children: [new TextRun({ text: "", size: 20 })],
              spacing: { after: 400, line: 240 },
              indent: { firstLine: 360 }
            }),
            new Paragraph({ 
              children: [new TextRun({ 
                text: `________________(Скородедов Ф.И.)                            ________________(${employee.fullName.split(' ')[0]} ${employee.fullName.split(' ')[1]?.charAt(0) || ''}.${employee.fullName.split(' ')[2]?.charAt(0) || ''}.`, 
                size: 20 
              })],
              spacing: { line: 240 },
              indent: { firstLine: 360 }
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);

      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`Акт_материальной_ответственности_${employee.fullName}.docx`)}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(buffer);
    } catch (error) {
      console.error("Generate responsibility act error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/docx/termination-checklist/:id', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Создание обходного листа при увольнении
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Шапка организации
            new Paragraph({
              children: [
                new TextRun({
                  text: "ООО \"НАЗВАНИЕ ОРГАНИЗАЦИИ\"",
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            // Заголовок
            new Paragraph({
              children: [
                new TextRun({
                  text: "ОБХОДНОЙ ЛИСТ",
                  bold: true,
                  size: 32,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "при увольнении сотрудника",
                  size: 24,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Информация о сотруднике в виде таблицы
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "ФИО:", bold: true, size: 22 })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: employee.fullName, size: 22, bold: true })] })],
                      width: { size: 75, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Должность:", bold: true, size: 22 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: employee.position, size: 22 })] })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Подразделение:", bold: true, size: 22 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: employee.department?.name || 'Не указано', size: 22 })] })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Дата увольнения:", bold: true, size: 22 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "_______________", size: 22 })] })],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                }),
              ],
              spacing: { after: 400 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Отметки о сдаче дел и материальных ценностей:",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 300 },
            }),

            // Таблица обходного листа
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "№", bold: true, size: 20 })] })],
                      width: { size: 5, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Структурное подразделение/Отдел", bold: true, size: 20 })] })],
                      width: { size: 35, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Что сдано", bold: true, size: 20 })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Отметка о сдаче", bold: true, size: 20 })] })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Подпись ответственного", bold: true, size: 20 })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),

                // Стандартные пункты обходного листа
                ...[
                  { dept: "IT отдел", items: "Компьютерная техника, оборудование, пароли" },
                  { dept: "Бухгалтерия", items: "Окончательный расчет, справки" },
                  { dept: "Отдел кадров", items: "Трудовая книжка, документы" },
                  { dept: "Материально ответственное лицо", items: "Инвентарь, ключи, пропуска" },
                  { dept: "Служба безопасности", items: "Пропуск, электронные карты" },
                  { dept: "Непосредственный руководитель", items: "Рабочие дела, документы" },
                  { dept: "Библиотека/Архив", items: "Книги, документы, материалы" },
                  { dept: "Склад", items: "Спецодежда, инструменты" }
                ].map((item, index) => new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString(), size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.dept, size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.items, size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })],
                    }),
                  ],
                })),
              ],
            }),

            // Заключительные подписи
            new Paragraph({
              children: [
                new TextRun({
                  text: "\n\nВсе дела и материальные ценности сданы полностью.",
                  size: 22,
                }),
              ],
              spacing: { before: 400, after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Увольняющийся сотрудник: ${employee.fullName} _________________ (подпись)`,
                  size: 22,
                }),
              ],
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Руководитель отдела кадров: _________________ _________________ (подпись) (расшифровка)",
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Дата составления: ${new Date().toLocaleDateString('ru-RU')}`,
                  size: 22,
                }),
              ],
              spacing: { before: 200 },
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);

      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`Обходной_лист_${employee.fullName}.docx`)}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(buffer);
    } catch (error) {
      console.error("Generate termination checklist error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Role management routes
  app.get('/api/roles', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/roles/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid role ID" });
      }

      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json(role);
    } catch (error) {
      console.error("Get role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/roles', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const roleData = req.body;
      const role = await storage.createRole(roleData);
      res.json(role);
    } catch (error) {
      console.error("Create role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/permissions', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Get permissions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/roles/:roleId/permissions/:permissionId', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);

      if (isNaN(roleId) || isNaN(permissionId)) {
        return res.status(400).json({ message: "Invalid role or permission ID" });
      }

      const rolePermission = await storage.assignPermissionToRole(roleId, permissionId);
      res.json(rolePermission);
    } catch (error) {
      console.error("Assign permission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/roles/:roleId/permissions/:permissionId', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);

      if (isNaN(roleId) || isNaN(permissionId)) {
        return res.status(400).json({ message: "Invalid role or permission ID" });
      }

      await storage.removePermissionFromRole(roleId, permissionId);
      res.json({ message: "Permission removed successfully" });
    } catch (error) {
      console.error("Remove permission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  // Notification routes
  app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.session.userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId, req.session.userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/notifications/mark-all-read', requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.session.userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}