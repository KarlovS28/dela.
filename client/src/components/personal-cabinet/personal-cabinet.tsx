import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { ArchivedEmployees } from "@/components/employee/archived-employees";
import { ExcelExport } from "@/components/export/excel-export";
import { UserManagement } from "@/components/admin/user-management";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { canImportExport, canViewArchive } from "@/lib/auth-utils";
import { Download, Upload, FileText, FileSpreadsheet, Archive, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Warehouse } from "@/components/warehouse/warehouse";
import { DecommissionedEquipment } from "@/components/decommissioned/decommissioned-equipment";
import { RoleManagement } from "@/components/admin/role-management";
import { UserRegistration } from "@/components/admin/user-registration";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: z.string().min(6, "Новый пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string().min(1, "Подтвердите новый пароль"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface PersonalCabinetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonalCabinet({ open, onOpenChange }: PersonalCabinetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showArchivedEmployees, setShowArchivedEmployees] = useState(false);
  const [showWarehouse, setShowWarehouse] = useState(false);
  const [showDecommissioned, setShowDecommissioned] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "sysadmin":
        return "Системный администратор";
      case "accountant":
        return "Бухгалтер";
      case "office-manager":
        return "Офис-менеджер";
      default:
        return role;
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    // TODO: Implement password change API
    toast({
      title: "Функция в разработке",
      description: "Смена пароля будет реализована в следующей версии",
    });
    passwordForm.reset();
  };

  // Функции для загрузки шаблонов документов
  const handleResponsibilityTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("template", file);

      try {
        const response = await fetch("/api/templates/responsibility-act", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (response.ok) {
          toast({
            title: "Шаблон загружен",
            description: "Шаблон акта материальной ответственности успешно загружен",
          });
        } else {
          throw new Error("Ошибка загрузки");
        }
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить шаблон",
          variant: "destructive",
        });
      }
    }
  };

  const handleChecklistTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("template", file);

      try {
        const response = await fetch("/api/templates/termination-checklist", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (response.ok) {
          toast({
            title: "Шаблон загружен",
            description: "Шаблон обходного листа успешно загружен",
          });
        } else {
          throw new Error("Ошибка загрузки");
        }
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить шаблон",
          variant: "destructive",
        });
      }
    }
  };

  // Обновленная функция экспорта инвентаризации с полными данными
  const handleExportInventory = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/export/inventory-full', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Ошибка экспорта');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'инвентаризация.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Экспорт завершен",
        description: "Файл инвентаризации загружен",
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Функция импорта файлов
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/employees', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const result = await response.json();

      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });

      toast({
        title: "Импорт завершен",
        description: result.message,
      });

      if (result.errors && result.errors.length > 0) {
        console.warn("Ошибки импорта:", result.errors);
      }
    } catch (error) {
      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать файл",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!user) return null;

  const canManageData = canImportExport(user.role);
  const canViewArchive = user.role === 'admin' || user.role === 'sysadmin' || user.role === 'office-manager';

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Личный кабинет</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-5' : 'grid-cols-3'}`}>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Профиль
            </TabsTrigger>
            
            <TabsTrigger value="export-import" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Экспорт/Импорт
            </TabsTrigger>
            
            {(user?.role === 'admin' || user?.role === 'accountant') && (
              <TabsTrigger value="archive" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Архив
              </TabsTrigger>
            )}
            
            {user?.role === 'admin' && (
              <>
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Роли
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Регистрация
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Личные данные</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ФИО</Label>
                  <Input value={user.fullName} disabled />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <Input value={user.email} disabled />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Роль</Label>
                  <Input value={getRoleDisplayName(user.role)} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Смена пароля</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Текущий пароль</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register("currentPassword")}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register("newPassword")}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button type="submit">
                  Сохранить пароль
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Export/Import Data */}
          {canManageData && (
            <Card>
              <CardHeader>
                <CardTitle>Экспорт и импорт данных</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Export Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Экспорт</h4>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExportInventory}
                    disabled={isExporting}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {isExporting ? "Экспорт..." : "Инвентаризация (полные данные)"}
                  </Button>
                </div>

                <Separator />

                {/* Import Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Импорт</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isImporting ? "Импорт..." : "Загрузить файл Excel"}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportFile}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Поддерживаются файлы с колонками: ФИО, Должность, Грейд, Отдел, Паспортные данные
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Склад - для администраторов, бухгалтеров и офис-менеджеров */}
          {(user?.role === 'admin' || user?.role === 'sysadmin' || user?.role === 'office-manager' || user?.role === 'accountant') && (
            <Card>
              <CardHeader>
                <CardTitle>Склад</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Здесь отображается имущество, которое не закреплено за сотрудниками
                </p>
                <Button
                  onClick={() => setShowWarehouse(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Открыть склад
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Списание - для всех пользователей */}
          <Card>
            <CardHeader>
              <CardTitle>Списание</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Здесь отображается имущество, которое необходимо списать
              </p>
              <Button
                onClick={() => setShowDecommissioned(true)}
                variant="outline"
                className="w-full"
              >
                <Archive className="w-4 h-4 mr-2" />
                Открыть списание
              </Button>
            </CardContent>
          </Card>

          {/* Archive Access */}
          {canViewArchive && (
                <Button
                  onClick={() => setShowArchivedEmployees(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Архив уволенных сотрудников
                </Button>
              )}

          {/* Role Management for Admin */}
          {user?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Управление ролями</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Создание новых ролей и управление правами доступа пользователей
                </p>
                <Button
                  onClick={() => setShowRoleManagement(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Открыть управление ролями
                </Button>
              </CardContent>
            </Card>
          )}

          </TabsContent>

          <TabsContent value="export-import">
            <Card>
              <CardHeader>
                <CardTitle>Экспорт и импорт данных</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Export Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Экспорт</h4>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExportInventory}
                    disabled={isExporting}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {isExporting ? "Экспорт..." : "Инвентаризация (полные данные)"}
                  </Button>
                </div>

                <Separator />

                {/* Import Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Импорт</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isImporting ? "Импорт..." : "Загрузить файл Excel"}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportFile}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {(user?.role === 'admin' || user?.role === 'accountant') && (
            <TabsContent value="archive">
              <ArchivedEmployees />
            </TabsContent>
          )}

          {user?.role === 'admin' && (
            <>
              <TabsContent value="roles">
                <RoleManagement />
              </TabsContent>
              <TabsContent value="register">
                <UserRegistration />
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>

    <ArchivedEmployees 
        open={showArchivedEmployees}
        onOpenChange={setShowArchivedEmployees}
    />

    <Warehouse 
      open={showWarehouse} 
      onOpenChange={setShowWarehouse} 
    />

    <DecommissionedEquipment 
      open={showDecommissioned} 
      onOpenChange={setShowDecommissioned} 
    />

    <RoleManagement
      open={showRoleManagement}
      onOpenChange={setShowRoleManagement}
    />
  </>
  );
}