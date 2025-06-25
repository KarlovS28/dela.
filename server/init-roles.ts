// Инициализация базовых ролей и разрешений
import { db } from "./db";
import { roles, permissions, rolePermissions } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function initializeRolesAndPermissions() {
  // Создаем базовые разрешения
  const basePermissions = [
    // Сотрудники
    { name: "employees.view", displayName: "Просмотр сотрудников", category: "employees", description: "Просмотр списка и данных сотрудников" },
    { name: "employees.create", displayName: "Создание сотрудников", category: "employees", description: "Добавление новых сотрудников" },
    { name: "employees.edit", displayName: "Редактирование сотрудников", category: "employees", description: "Редактирование данных сотрудников" },
    { name: "employees.archive", displayName: "Архивирование сотрудников", category: "employees", description: "Увольнение и архивирование сотрудников" },
    { name: "employees.view_archive", displayName: "Просмотр архива", category: "employees", description: "Доступ к архиву уволенных сотрудников" },
    
    // Отделы
    { name: "departments.view", displayName: "Просмотр отделов", category: "departments", description: "Просмотр структуры отделов" },
    { name: "departments.manage", displayName: "Управление отделами", category: "departments", description: "Создание и редактирование отделов" },
    
    // Оборудование
    { name: "equipment.view", displayName: "Просмотр оборудования", category: "equipment", description: "Просмотр списка оборудования" },
    { name: "equipment.manage", displayName: "Управление оборудованием", category: "equipment", description: "Добавление, редактирование и удаление оборудования" },
    { name: "equipment.warehouse", displayName: "Управление складом", category: "equipment", description: "Доступ к складскому оборудованию" },
    
    // Пользователи и роли
    { name: "users.view", displayName: "Просмотр пользователей", category: "users", description: "Просмотр списка пользователей системы" },
    { name: "users.manage", displayName: "Управление пользователями", category: "users", description: "Создание, редактирование и удаление пользователей" },
    { name: "roles.manage", displayName: "Управление ролями", category: "roles", description: "Создание и настройка ролей и разрешений" },
    
    // Документы и отчеты
    { name: "documents.view", displayName: "Просмотр документов", category: "documents", description: "Доступ к паспортным данным и документам" },
    { name: "documents.print", displayName: "Печать документов", category: "documents", description: "Генерация и печать документов" },
    { name: "reports.export", displayName: "Экспорт отчетов", category: "reports", description: "Экспорт данных в Excel и другие форматы" },
    { name: "reports.import", displayName: "Импорт данных", category: "reports", description: "Импорт данных из Excel файлов" },
  ];

  // Вставляем разрешения (если не существуют)
  for (const perm of basePermissions) {
    try {
      await db.insert(permissions).values(perm).onConflictDoNothing();
    } catch (error) {
      console.log(`Permission ${perm.name} already exists`);
    }
  }

  // Создаем базовые роли
  const baseRoles = [
    { name: "admin", displayName: "Администратор", description: "Полный доступ ко всем функциям системы", isSystemRole: true },
    { name: "accountant", displayName: "Бухгалтер", description: "Доступ к данным сотрудников и документам", isSystemRole: true },
    { name: "sysadmin", displayName: "Системный администратор", description: "Управление оборудованием и техническими вопросами", isSystemRole: true },
    { name: "office-manager", displayName: "Офис-менеджер", description: "Управление оборудованием и складом", isSystemRole: true },
  ];

  // Вставляем роли (если не существуют)
  const createdRoles = [];
  for (const role of baseRoles) {
    try {
      const [existingRole] = await db.select().from(roles).where(eq(roles.name, role.name));
      if (!existingRole) {
        const [newRole] = await db.insert(roles).values(role).returning();
        createdRoles.push(newRole);
      } else {
        createdRoles.push(existingRole);
      }
    } catch (error) {
      console.log(`Role ${role.name} creation failed:`, error);
    }
  }

  // Настраиваем разрешения для ролей
  const allPermissions = await db.select().from(permissions);
  const adminRole = createdRoles.find(r => r.name === "admin");
  const accountantRole = createdRoles.find(r => r.name === "accountant");
  const sysadminRole = createdRoles.find(r => r.name === "sysadmin");
  const officeManagerRole = createdRoles.find(r => r.name === "office-manager");

  // Администратор - все разрешения
  if (adminRole) {
    for (const permission of allPermissions) {
      try {
        await db.insert(rolePermissions).values({
          roleId: adminRole.id,
          permissionId: permission.id
        }).onConflictDoNothing();
      } catch (error) {
        // Игнорируем дубликаты
      }
    }
  }

  // Бухгалтер - работа с сотрудниками и документами
  if (accountantRole) {
    const accountantPerms = allPermissions.filter(p => 
      p.category === "employees" || p.category === "documents" || p.category === "reports"
    );
    for (const permission of accountantPerms) {
      try {
        await db.insert(rolePermissions).values({
          roleId: accountantRole.id,
          permissionId: permission.id
        }).onConflictDoNothing();
      } catch (error) {
        // Игнорируем дубликаты
      }
    }
  }

  // Системный администратор - оборудование и отделы
  if (sysadminRole) {
    const sysadminPerms = allPermissions.filter(p => 
      p.category === "equipment" || p.category === "departments" || p.name === "employees.create"
    );
    for (const permission of sysadminPerms) {
      try {
        await db.insert(rolePermissions).values({
          roleId: sysadminRole.id,
          permissionId: permission.id
        }).onConflictDoNothing();
      } catch (error) {
        // Игнорируем дубликаты
      }
    }
  }

  // Офис-менеджер - только оборудование
  if (officeManagerRole) {
    const officePerms = allPermissions.filter(p => p.category === "equipment");
    for (const permission of officePerms) {
      try {
        await db.insert(rolePermissions).values({
          roleId: officeManagerRole.id,
          permissionId: permission.id
        }).onConflictDoNothing();
      } catch (error) {
        // Игнорируем дубликаты
      }
    }
  }

  console.log("Roles and permissions initialized successfully");
}