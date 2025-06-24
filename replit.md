# dela. - Employee Management System

## Overview

**dela.** is a modern employee management system built with React, Express.js, and PostgreSQL. The application provides role-based access control for managing employees, departments, and equipment within an organization. It features a clean, Russian-language interface with comprehensive authentication and authorization mechanisms.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Forms**: React Hook Form with Zod validation
- **Theme**: Light/dark mode support with theme provider

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with MemoryStore
- **Authentication**: bcrypt for password hashing
- **API Design**: RESTful API with role-based authorization middleware

### Database Architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Relational design with users, departments, employees, and equipment tables
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless PostgreSQL adapter

## Key Components

### Authentication System
- Session-based authentication with HTTP-only cookies
- Role-based access control (Admin, System Admin, Accountant)
- Password hashing with bcrypt
- Authentication middleware for protected routes
- User management with role hierarchy

### Employee Management
- Employee profiles with personal information
- Photo upload capabilities
- Position and grade tracking
- Department assignment
- Archive functionality for inactive employees
- Equipment assignment tracking

### Department Management
- Department creation and organization
- Employee assignment to departments
- Departmental view with employee cards
- Hierarchical organization structure

### Equipment Tracking
- Equipment inventory management
- Employee equipment assignments
- Cost tracking and inventory numbers
- Equipment history and transfers

### Role-Based Permissions
- **Admin**: Full system access, user management, import/export
- **System Admin**: Employee creation, department management
- **Accountant**: Employee editing, archiving, personal data access

## Data Flow

1. **Authentication Flow**:
   - User submits credentials → Server validates → Session created → Client receives auth state
   - Protected routes check session validity → Middleware validates role permissions

2. **Employee Management Flow**:
   - Client requests employee data → Server checks permissions → Database query → Response with filtered data
   - Create/Update operations validate user permissions → Database transaction → Cache invalidation

3. **Real-time Updates**:
   - Form submissions trigger optimistic updates → API calls → Query cache invalidation → UI refresh

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation integration
- **zod**: Runtime type validation and schema definition
- **wouter**: Lightweight routing solution
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date manipulation utilities

### Backend Dependencies
- **drizzle-orm**: Type-safe ORM for PostgreSQL
- **@neondatabase/serverless**: Serverless PostgreSQL adapter
- **bcrypt**: Password hashing library
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store
- **zod**: Schema validation for API endpoints

### Development Tools
- **tsx**: TypeScript execution environment
- **vite**: Fast build tool and development server
- **esbuild**: Fast JavaScript bundler for production
- **drizzle-kit**: Database schema management CLI

## Deployment Strategy

### Development Environment
- **Replit Integration**: Configured for Replit development environment
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend
- **Development Server**: Concurrent frontend and backend development
- **Database**: PostgreSQL module in Replit environment

### Production Build
- **Frontend**: Vite build with optimized assets
- **Backend**: esbuild bundling with ES modules
- **Static Serving**: Express serves built frontend assets
- **Process Management**: PM2 or similar for production deployment

### Environment Configuration
- **Database URL**: Environment variable for database connection
- **Session Secret**: Configurable session encryption key
- **Port Configuration**: Flexible port assignment for deployment
- **CORS**: Configured for cross-origin requests in development

## Recent Changes

### Dynamic Role Management System (June 24, 2025)
- ✓ Система динамических ролей и разрешений для администратора
- ✓ Новые таблицы: roles, permissions, role_permissions в PostgreSQL
- ✓ API маршруты управления ролями (/api/roles, /api/permissions)
- ✓ Компонент RoleManagement в личном кабинете администратора
- ✓ Автоматическая инициализация базовых ролей и разрешений при запуске
- ✓ Гибкая система разрешений по категориям (employees, departments, equipment, users, reports, documents)
- ✓ Возможность создания новых ролей и назначения разрешений через интерфейс
- ✓ Защита системных ролей от удаления

### Database Integration & Employee Termination System (June 24, 2025)
- ✓ Полная интеграция с PostgreSQL для постоянного хранения данных
- ✓ Исправлена система увольнения сотрудников - корректное перемещение в архив
- ✓ Автоматическое перемещение оборудования на склад при увольнении
- ✓ Упрощенный процесс увольнения без генерации документов
- ✓ Исправлен импорт категорий оборудования из Excel (Техника/Мебель)
- ✓ Кнопка "Выйти" работает без перезагрузки страницы
- ✓ Валидация ID во всех API маршрутах для предотвращения ошибок

### Excel Export/Import System (June 14, 2025)
- ✓ Добавлена система экспорта данных в Excel (3 шаблона)
- ✓ Шаблон инвентаризации: ФИО, наименование имущества, инвентарный номер, стоимость
- ✓ Шаблон данных сотрудников: ФИО, паспортные данные, должность, грейд, отдел
- ✓ Шаблон без личных данных: ФИО, должность, грейд, отдел
- ✓ API маршруты для экспорта: `/api/export/inventory`, `/api/export/employees`, `/api/export/employees-public`

### Enhanced Employee Card (June 14, 2025)
- ✓ Расширенная карточка сотрудника с полными паспортными данными
- ✓ Кликабельные фото сотрудников для открытия карточки
- ✓ Таблица акта материальной ответственности
- ✓ Кнопка "Печать" для акта материальной ответственности (DOCX)
- ✓ Кнопка "Увольнение" с автоматической печатью документов
- ✓ Архивирование сотрудника при увольнении
- ✓ Генерация профессиональных DOCX документов

### Excel Import System (June 14, 2025)
- ✓ Функциональность импорта Excel файлов с автоматическим заполнением данных
- ✓ API маршруты: `/api/import/employees`, `/api/import/equipment`
- ✓ Поддержка импорта сотрудников и оборудования из Excel
- ✓ Валидация и обработка ошибок при импорте

### DOCX Document Generation (June 14, 2025)
- ✓ Генерация профессиональных DOCX документов
- ✓ Акт материальной ответственности (API: `/api/docx/responsibility-act/:id`)
- ✓ Обходной лист при увольнении (API: `/api/docx/termination-checklist/:id`)
- ✓ Интеграция с карточкой сотрудника для автоматической печати

### Employee Management Modal (June 14, 2025)
- ✓ Модальное окно добавления сотрудников
- ✓ Полная форма с паспортными данными и документами
- ✓ Валидация формы с помощью Zod
- ✓ Интеграция с API для создания сотрудников

### Database Schema Updates (June 14, 2025)
- ✓ Добавлены поля: passportIssuedBy, orderDate, responsibilityActDate
- ✓ Обновлены типы данных для поддержки всех необходимых полей
- ✓ Примеры данных с полной информацией о сотрудниках

### Role-Based Access Control System (June 14, 2025)
- ✓ Добавлена роль "Офис-менеджер"
- ✓ Администратор: полные права на все функции, управление пользователями, архив
- ✓ Бухгалтер: просмотр/редактирование сотрудников, печать документов, увольнение
- ✓ Системный администратор и офис-менеджер: только работа с оборудованием
- ✓ Ролевые ограничения в экспорте данных (паспортные данные только для admin/accountant)

### Personal Cabinet Integration (June 14, 2025)
- ✓ Перенос экспорта/импорта в личный кабинет
- ✓ Обновленный экспорт инвентаризации с полными данными
- ✓ Удален экспорт "Без личных данных" и "Данные сотрудников"
- ✓ Объединенный шаблон инвентаризации с паспортными данными, должностью, грейдом, отделом
- ✓ Архив сотрудников (интерфейс готов, функциональность в разработке)

### Fixed Issues (June 14, 2025)
- ✓ Исправлены карточки сотрудников - теперь открываются корректно
- ✓ Улучшена обработка ошибок при загрузке данных сотрудников
- ✓ Исправлен импорт Excel - автоматическое создание отделов работает
- ✓ Убран экспорт с главной страницы
- ✓ Добавлен отдельный CSS файл для ручного управления стилями

### Documentation & Deployment (June 14, 2025)
- ✓ Подробный README.md с инструкциями по установке
- ✓ Конфигурация nginx для продакшена
- ✓ PM2 конфигурация для автоматического деплоя
- ✓ Скрипт автоматического деплоя deploy.sh
- ✓ Русские комментарии во всех файлах кода
- ✓ Файл client/src/styles/custom.css для ручной настройки стилей

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
- June 14, 2025. Excel export/import system implementation
- June 14, 2025. Enhanced employee card with full passport data and print functionality
- June 14, 2025. Added Excel import functionality for automated data population
- June 14, 2025. Implemented DOCX document generation for responsibility acts and termination checklists
- June 14, 2025. Created comprehensive employee management modal with full form validation
- June 14, 2025. Added deployment configuration with nginx, PM2, and automated deploy scripts
- June 14, 2025. Enhanced codebase with Russian comments and documentation
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```