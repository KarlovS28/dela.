// Основной файл маршрутизации API для системы управления сотрудниками
// Содержит все API endpoints для аутентификации, управления сотрудниками, отделами, оборудованием
// Включает функции экспорта/импорта Excel, генерации DOCX документов
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertEmployeeSchema, insertEquipmentSchema } from "@shared/schema";
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

  app.get('/api/employees/archived', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
      const archivedEmployees = await storage.getArchivedEmployees();
      res.json(archivedEmployees);
    } catch (error) {
      console.error("Get archived employees error:", error);
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
            const rowData = index === 0 ? { ...baseData } : {
              // Для дополнительных строк оборудования оставляем только ФИО
              'ФИО': employee.fullName,
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
      let errors: string[] = [];

      // Кэш отделов для оптимизации
      const departmentCache = new Map<string, number>();
      const existingDepartments = await storage.getDepartments();
      existingDepartments.forEach(dept => departmentCache.set(dept.name, dept.id));
      let createdDepartments = 0;

      // Кэш сотрудников для добавления оборудования
      const employeeCache = new Map<string, number>();

      for (const row of data as any[]) {
        try {
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
              const employeeData = {
                fullName,
                position: String(row['Должность']).trim(),
                grade: row['Грейд'] ? String(row['Грейд']).trim() : 'Junior',
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
              importedCount++;
            }

            // Добавляем оборудование, если оно указано
            if (row['Наименование имущества'] && row['Инвентарный номер']) {
              const equipmentData = {
                name: String(row['Наименование имущества']).trim(),
                inventoryNumber: String(row['Инвентарный номер']).trim(),
                cost: row['Стоимость'] || row['Стоимость имущества'] ? String(row['Стоимость'] || row['Стоимость имущества']).trim() : '0',
                employeeId,
              };

              await storage.createEquipment(equipmentData);
              equipmentCount++;
            }
          }
        } catch (error) {
          console.error("Ошибка импорта строки:", error);
          errors.push(`Ошибка импорта: ${row['ФИО'] || 'неизвестный сотрудник'}`);
        }
      }

      res.json({ 
        message: `Импортировано ${importedCount} сотрудников${equipmentCount > 0 ? `, ${equipmentCount} единиц оборудования` : ''}${createdDepartments > 0 ? `, создано ${createdDepartments} отделов` : ''}`, 
        errors: errors.length > 0 ? errors : null 
      });
    } catch (error) {
      console.error("Import employees error:", error);
      res.status(500).json({ message: "Ошибка импорта" });
    }
  });

  app.post('/api/import/equipment', requireAuth, requireRole(['admin']), upload.single('file'), async (req, res) => {
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

  // Маршруты для генерации DOCX документов
  app.get('/api/docx/responsibility-act/:id', requireAuth, requireRole(['admin', 'accountant']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Создание документа DOCX для акта материальной ответственности
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Заголовок документа
            new Paragraph({
              children: [
                new TextRun({
                  text: "АКТ О МАТЕРИАЛЬНОЙ ОТВЕТСТВЕННОСТИ",
                  bold: true,
                  size: 28,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            // Информация о сотруднике
            new Paragraph({
              children: [
                new TextRun({
                  text: `ФИО: ${employee.fullName}`,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Должность: ${employee.position}`,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Отдел: ${employee.department?.name || 'Не указан'}`,
                  size: 24,
                }),
              ],
              spacing: { after: 400 },
            }),
            
            // Таблица с оборудованием
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
                      children: [new Paragraph({ children: [new TextRun({ text: "№", bold: true })] })],
                      width: { size: 10, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Наименование", bold: true })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Инв. номер", bold: true })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Стоимость", bold: true })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                // Строки с оборудованием
                ...employee.equipment.map((item, index) => new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString() })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.name })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.inventoryNumber })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.cost })] })],
                    }),
                  ],
                })),
              ],
            }),
            
            // Подписи
            new Paragraph({
              children: [
                new TextRun({
                  text: `\n\nДата составления: ${new Date().toLocaleDateString('ru-RU')}`,
                  size: 24,
                }),
              ],
              spacing: { before: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "\n\nПодпись сотрудника: _________________",
                  size: 24,
                }),
              ],
              spacing: { before: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "\nПодпись ответственного лица: _________________",
                  size: 24,
                }),
              ],
              spacing: { before: 200 },
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`act-${employee.fullName}.docx`)}`);
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
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "при увольнении сотрудника",
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            
            // Информация о сотруднике
            new Paragraph({
              children: [
                new TextRun({
                  text: `ФИО: ${employee.fullName}`,
                  size: 24,
                  bold: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Должность: ${employee.position}`,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Отдел: ${employee.department?.name || 'Не указан'}`,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Дата увольнения: ${new Date().toLocaleDateString('ru-RU')}`,
                  size: 24,
                }),
              ],
              spacing: { after: 600 },
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
                      children: [new Paragraph({ children: [new TextRun({ text: "№", bold: true })] })],
                      width: { size: 5, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Подразделение/Отдел", bold: true })] })],
                      width: { size: 40, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Отметка о сдаче", bold: true })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Подпись ответственного", bold: true })] })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                
                // Стандартные пункты обходного листа
                ...[
                  "IT отдел - сдача оборудования",
                  "Бухгалтерия - расчет",
                  "Кадровая служба - документы",
                  "Материально ответственное лицо",
                  "Служба безопасности - пропуск",
                  "Библиотека - книги и материалы"
                ].map((item, index) => new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString() })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
                    }),
                  ],
                })),
              ],
            }),
            
            // Заключительная подпись
            new Paragraph({
              children: [
                new TextRun({
                  text: "\n\nРуководитель кадровой службы: _________________ \n\nДата: _____________",
                  size: 24,
                }),
              ],
              spacing: { before: 600 },
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`checklist-${employee.fullName}.docx`)}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(buffer);
    } catch (error) {
      console.error("Generate termination checklist error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
