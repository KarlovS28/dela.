import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { canImportExport } from "@/lib/auth-utils";
import { Download, Upload, FileText, FileSpreadsheet } from "lucide-react";

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

  const handleDownloadTemplates = () => {
    toast({
      title: "Функция в разработке",
      description: "Скачивание шаблонов будет реализовано в следующей версии",
    });
  };

  const handleImportData = () => {
    toast({
      title: "Функция в разработке",
      description: "Импорт данных будет реализован в следующей версии",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Функция в разработке",
      description: "Экспорт данных будет реализован в следующей версии",
    });
  };

  const handleManageTemplates = () => {
    toast({
      title: "Функция в разработке",
      description: "Управление шаблонами будет реализовано в следующей версии",
    });
  };

  if (!user) return null;

  const canManageData = canImportExport(user.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Личный кабинет</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
          
          {/* Admin Features */}
          {canManageData && (
            <Card>
              <CardHeader>
                <CardTitle>Административные функции</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="flex items-center space-x-3 h-auto p-4"
                    onClick={handleDownloadTemplates}
                  >
                    <Download className="text-primary" />
                    <span>Скачать шаблоны</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-3 h-auto p-4"
                    onClick={handleImportData}
                  >
                    <Upload className="text-primary" />
                    <span>Импорт данных</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-3 h-auto p-4"
                    onClick={handleExportData}
                  >
                    <FileSpreadsheet className="text-primary" />
                    <span>Экспорт данных</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-3 h-auto p-4"
                    onClick={handleManageTemplates}
                  >
                    <FileText className="text-primary" />
                    <span>Управление шаблонами</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
