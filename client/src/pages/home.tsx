// Главная страница приложения системы управления сотрудниками DELA
// Содержит основной интерфейс с вкладками для разных разделов системы

import { useState, useEffect } from "react";
// React Query для управления запросами к API
import { useQuery } from "@tanstack/react-query";
// Импорт компонентов для различных разделов системы
import { DepartmentSection } from "@/components/department/department-section";
import { AddEmployeeModal } from "@/components/employee/add-employee-modal";
import { ArchivedEmployees } from "@/components/employee/archived-employees";
import { ExcelExport } from "@/components/export/excel-export";
import { Warehouse } from "@/components/warehouse/warehouse";
import { DecommissionedEquipment } from "@/components/decommissioned/decommissioned-equipment";
import { UserManagement } from "@/components/admin/user-management";
import { Header } from "@/components/layout/header";
// UI компоненты
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
// Хук аутентификации
import { useAuth } from "@/hooks/use-auth";
// Иконки Lucide
import { Users, Building, Package, Archive, UserCog, FileSpreadsheet } from "lucide-react";
// Типы данных
import type { DepartmentWithEmployees } from "@shared/schema";

/**
 * Главная страница приложения
 * Отображает дашборд с вкладками для управления сотрудниками, отделами, складом и другими разделами
 */
export default function Home() {
  // Получаем данные текущего пользователя
  const { user } = useAuth();
  // Состояние активной вкладки
  const [activeTab, setActiveTab] = useState("departments");

  // Запрос данных отделов с сотрудниками
  const { data: departments = [], isLoading, error } = useQuery<DepartmentWithEmployees[]>({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const response = await fetch("/api/departments", {
        credentials: "include",  // Включаем cookies для аутентификации
      });
      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }
      return response.json();
    },
  });

  // Подсчет общего количества сотрудников
  const totalEmployees = departments.reduce((acc, dept) => acc + dept.employees.length, 0);
  // Подсчет общего количества оборудования
  const totalEquipment = departments.reduce(
    (acc, dept) => acc + dept.employees.reduce((empAcc, emp) => empAcc + emp.equipment.length, 0),
    0
  );

  // Проверка прав доступа к различным разделам на основе роли пользователя
  const canAccessArchive = user && ['admin', 'accountant'].includes(user.role);
  const canAccessUserManagement = user && user.role === 'admin';
  const canAccessWarehouse = user && ['admin', 'sysadmin', 'office-manager', 'accountant'].includes(user.role);

  // Отображение индикатора загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Отображение ошибки загрузки
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Ошибка загрузки</h2>
            <p className="text-muted-foreground">Не удалось загрузить данные. Попробуйте обновить страницу.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка приложения */}
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок и статистические карточки */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Система управления сотрудниками</h1>

          {/* Сетка с карточками статистики */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Карточка общего количества сотрудников */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего сотрудников</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEmployees}</div>
              </CardContent>
            </Card>

            {/* Карточка количества отделов */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Отделов</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departments.length}</div>
              </CardContent>
            </Card>

            {/* Карточка количества техники */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Единиц техники</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEquipment}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Основной интерфейс с вкладками */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Список вкладок с проверкой прав доступа */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {/* Вкладка отделов - доступна всем */}
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Отделы</span>
            </TabsTrigger>

            {/* Вкладка склада - доступна по ролям */}
            {canAccessWarehouse && (
              <TabsTrigger value="warehouse" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Склад</span>
              </TabsTrigger>
            )}

            {/* Вкладка списанного оборудования - доступна всем */}
            <TabsTrigger value="decommissioned" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Списанное</span>
            </TabsTrigger>

            {/* Вкладка экспорта данных - доступна всем */}
            <TabsTrigger value="export" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Экспорт</span>
            </TabsTrigger>

            {/* Вкладка архива - только для админа и бухгалтера */}
            {canAccessArchive && (
              <TabsTrigger value="archive" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                <span className="hidden sm:inline">Архив</span>
              </TabsTrigger>
            )}

            {/* Вкладка управления пользователями - только для админа */}
            {canAccessUserManagement && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Пользователи</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Содержимое вкладки отделов */}
          <TabsContent value="departments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Отделы и сотрудники</h2>
              {/* Кнопка добавления сотрудника только для админа и системного админа */}
              {user && ['admin', 'sysadmin'].includes(user.role) && <AddEmployeeModal />}
            </div>
            <div className="space-y-6">
              {/* Отображение секций отделов */}
              {departments.map((department) => (
                <DepartmentSection key={department.id} department={department} />
              ))}
            </div>
          </TabsContent>

          {/* Содержимое вкладки склада */}
          {canAccessWarehouse && (
            <TabsContent value="warehouse">
              <Warehouse />
            </TabsContent>
          )}

          {/* Содержимое вкладки списанного оборудования */}
          <TabsContent value="decommissioned">
            <DecommissionedEquipment />
          </TabsContent>

          {/* Содержимое вкладки экспорта */}
          <TabsContent value="export">
            <ExcelExport />
          </TabsContent>

          {/* Содержимое вкладки архива */}
          {canAccessArchive && (
            <TabsContent value="archive">
              <ArchivedEmployees />
            </TabsContent>
          )}

          {/* Содержимое вкладки управления пользователями */}
          {canAccessUserManagement && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}