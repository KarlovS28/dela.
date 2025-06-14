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

### Database Schema Updates (June 14, 2025)
- ✓ Добавлены поля: passportIssuedBy, orderDate, responsibilityActDate
- ✓ Обновлены типы данных для поддержки всех необходимых полей
- ✓ Примеры данных с полной информацией о сотрудниках

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
- June 14, 2025. Excel export/import system implementation
- June 14, 2025. Enhanced employee card with full passport data and print functionality
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```