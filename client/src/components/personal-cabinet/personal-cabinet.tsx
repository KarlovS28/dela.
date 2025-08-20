import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
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
import { Download, Upload, FileText, FileSpreadsheet, Archive, Shield, User, Settings, UserCheck, Activity, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Warehouse } from "@/components/warehouse/warehouse";
import { DecommissionedEquipment } from "@/components/decommissioned/decommissioned-equipment";
import { RoleManagement } from "@/components/admin/role-management";
import { RegistrationRequests } from "@/components/admin/registration-requests";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z.string().min(6, "Новый пароль должен содержать минимум 6 символов"),
    confirmPassword: z.string().min(1, "Подтвердите новый пароль"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface AuditLog {
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    oldValues?: string;
    newValues?: string;
    description: string;
    createdAt: string;
    user: {
        id: number;
        fullName: string;
        email: string;
        role: string;
    };
}

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
    const [isUploading, setIsUploading] = useState(false);

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
        toast({
            title: "Функция в разработке",
            description: "Смена пароля будет реализована в следующей версии",
        });
        passwordForm.reset();
    };

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

    const updateProfilePhoto = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await fetch(`/api/users/${user?.id}/photo`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Failed to upload photo");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            toast({
                title: "Успешно",
                description: "Фото профиля обновлено",
            });
        },
        onError: (error) => {
            console.error("Photo upload error:", error);
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить фото",
                variant: "destructive",
            });
        },
        onSettled: () => {
            setIsUploading(false);
        }
    });

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Ошибка",
                description: "Размер файла не должен превышать 5MB",
                variant: "destructive",
            });
            return;
        }
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.svg');
        if (!allowedTypes.includes(file.type) && !hasValidExtension) {
            toast({
                title: "Ошибка",
                description: "Поддерживаются только файлы JPG, JPEG, PNG, SVG",
                variant: "destructive",
            });
            return;
        }
        setIsUploading(true);
        const formData = new FormData();
        formData.append("photo", file);
        updateProfilePhoto.mutate(formData);
    };

    if (!user) return null;

    const canManageData = canImportExport(user.role);
    const canViewArchive = user?.role === 'admin' || user?.role === 'sysadmin' || user?.role === 'office-manager';

    const { data: auditLogs = [], isLoading: isLoadingLogs } = useQuery<AuditLog[]>({
        queryKey: ["/api/audit-logs"],
        queryFn: async () => {
            const response = await fetch("/api/audit-logs", {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch audit logs");
            return response.json();
        },
        enabled: user?.role === 'admin',
        refetchInterval: 30000,
    });

    const handleExportAuditLogs = async () => {
        try {
            setIsExporting(true);
            const response = await fetch('/api/export/audit-logs', {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Ошибка экспорта');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `история_изменений_${new Date().toLocaleDateString('ru-RU')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({
                title: "Экспорт завершен",
                description: "Файл истории изменений загружен",
            });
        } catch (error) {
            toast({
                title: "Ошибка экспорта",
                description: "Не удалось экспортировать историю изменений",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportEmployeesList = async () => {
        try {
            setIsExporting(true);
            const response = await fetch('/api/export/employees-with-equipment', {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Ошибка экспорта');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `список_сотрудников_${new Date().toLocaleDateString('ru-RU')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({
                title: "Экспорт завершен",
                description: "Список сотрудников загружен",
            });
        } catch (error) {
            toast({
                title: "Ошибка экспорта",
                description: "Не удалось экспортировать список сотрудников",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const actionLabels: Record<string, string> = {
        create: "Создание",
        update: "Изменение",
        delete: "Удаление",
        archive: "Архивирование"
    };

    const entityLabels: Record<string, string> = {
        employee: "Сотрудник",
        equipment: "Оборудование",
        user: "Пользователь",
        department: "Отдел"
    };

    const actionColors: Record<string, string> = {
        create: "bg-green-100 text-green-800",
        update: "bg-blue-100 text-blue-800",
        delete: "bg-red-100 text-red-800",
        archive: "bg-orange-100 text-orange-800"
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] max-w-none h-[100dvh] sm:max-w-7xl sm:max-h-[95vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl">Личный кабинет</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-3 sm:grid-cols-9' : 'grid-cols-2 sm:grid-cols-3'} gap-3`}>
                            <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                                Профиль
                            </TabsTrigger>
                            <TabsTrigger value="employees-list" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                Сотрудники
                            </TabsTrigger>
                            {user?.role === 'admin' && (
                                <>
                                    <TabsTrigger value="audit" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                        <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                                        История
                                    </TabsTrigger>
                                    <TabsTrigger value="roles" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                        <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Роли
                                    </TabsTrigger>
                                    <TabsTrigger value="register" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                        <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Запросы
                                    </TabsTrigger>
                                </>
                            )}
                        </TabsList>

                        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
                            <Card>
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-lg sm:text-xl">Личные данные</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 pt-0">
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                                                <AvatarImage src={user.photoUrl || undefined} />
                                                <AvatarFallback className="text-sm sm:text-lg">
                                                    {user.fullName.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="absolute -bottom-2 -right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full p-0"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                ) : (
                                                    <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                                                )}
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/jpg,image/png,image/svg+xml"
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                            />
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <h3 className="text-lg sm:text-xl font-semibold">{user.fullName}</h3>
                                            <p className="text-muted-foreground text-sm sm:text-base">{user.email}</p>
                                            <Badge variant="secondary" className="mt-2">
                                                {getRoleDisplayName(user.role)}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardContent className="p-4 sm:p-6 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium">ФИО</Label>
                                            <Input value={user.fullName} disabled className="mt-1" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Email</Label>
                                            <Input value={user.email} disabled className="mt-1" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Роль</Label>
                                            <Input value={getRoleDisplayName(user.role)} disabled className="mt-1" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-lg sm:text-xl">Смена пароля</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 pt-0">
                                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3 sm:space-y-4">
                                        <div>
                                            <Label htmlFor="currentPassword" className="text-sm">Текущий пароль</Label>
                                            <Input
                                                id="currentPassword"
                                                type="password"
                                                className="mt-1"
                                                {...passwordForm.register("currentPassword")}
                                            />
                                            {passwordForm.formState.errors.currentPassword && (
                                                <p className="text-xs text-destructive mt-1">
                                                    {passwordForm.formState.errors.currentPassword.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="newPassword" className="text-sm">Новый пароль</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                className="mt-1"
                                                {...passwordForm.register("newPassword")}
                                            />
                                            {passwordForm.formState.errors.newPassword && (
                                                <p className="text-xs text-destructive mt-1">
                                                    {passwordForm.formState.errors.newPassword.message}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="confirmPassword" className="text-sm">Подтвердите пароль</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                className="mt-1"
                                                {...passwordForm.register("confirmPassword")}
                                            />
                                            {passwordForm.formState.errors.confirmPassword && (
                                                <p className="text-xs text-destructive mt-1">
                                                    {passwordForm.formState.errors.confirmPassword.message}
                                                </p>
                                            )}
                                        </div>
                                        <Button type="submit" className="w-full sm:w-auto">
                                            Сохранить пароль
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {canManageData && (
                                <Card>
                                    <CardHeader className="p-4 sm:p-6">
                                        <CardTitle className="text-lg sm:text-xl">Экспорт и импорт данных</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Экспорт</h4>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={handleExportInventory}
                                                disabled={isExporting}
                                            >
                                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                {isExporting ? "Экспорт..." : "Инвентаризация"}
                                            </Button>
                                        </div>
                                        <Separator />
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
                                                    {isImporting ? "Импорт..." : "Загрузить Excel"}
                                                </Button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleImportFile}
                                                    accept=".xlsx,.xls"
                                                    className="hidden"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Поддерживаются файлы с колонками: ФИО, Должность, Отдел
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {(user?.role === 'admin' || user?.role === 'sysadmin' || user?.role === 'office-manager' || user?.role === 'accountant') && (
                                <Card>
                                    <CardHeader className="p-4 sm:p-6">
                                        <CardTitle className="text-lg sm:text-xl">Склад</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0">
                                        <p className="text-muted-foreground text-sm mb-4">
                                            Имущество, не закрепленное за сотрудниками
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

                            <Card>
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-lg sm:text-xl">Списание</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 pt-0">
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Имущество, которое необходимо списать
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

                            {canViewArchive && (
                                <Card>
                                    <CardHeader className="p-4 sm:p-6">
                                        <CardTitle className="text-lg sm:text-xl">Архив</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0">
                                        <p className="text-muted-foreground text-sm mb-4">
                                            Информация об уволенных сотрудниках
                                        </p>
                                        <Button
                                            onClick={() => setShowArchivedEmployees(true)}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <Archive className="w-4 h-4 mr-2" />
                                            Архив сотрудников
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {user?.role === 'admin' && (
                                <Card>
                                    <CardHeader className="p-4 sm:p-6">
                                        <CardTitle className="text-lg sm:text-xl">Управление ролями</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0">
                                        <p className="text-muted-foreground text-sm mb-4">
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

                        <TabsContent value="employees-list">
                            <Card>
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-lg sm:text-xl">Список сотрудников</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                                    <p className="text-muted-foreground text-sm">
                                        Скачайте актуальный список всех сотрудников с указанием ФИО, отдела, грейда и закрепленной техники.
                                    </p>
                                    <Button
                                        onClick={handleExportEmployeesList}
                                        disabled={isExporting}
                                        className="flex items-center gap-2 min-h-[44px] w-full sm:w-auto text-sm sm:text-base"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">Скачать список сотрудников</span>
                                        <span className="sm:hidden">Список сотрудников</span>
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {user?.role === 'admin' && (
                            <>
                                <TabsContent value="audit">
                                    <Card>
                                        <CardHeader className="p-4 sm:p-6">
                                            <CardTitle className="text-lg sm:text-xl flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    История изменений
                                                </div>
                                                <Button
                                                    onClick={handleExportAuditLogs}
                                                    disabled={isExporting}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    {isExporting ? "Экспорт..." : "Скачать Excel"}
                                                </Button>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoadingLogs ? (
                                                <div className="flex items-center justify-center h-32">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                </div>
                                            ) : auditLogs.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Дата</TableHead>
                                                                <TableHead>Пользователь</TableHead>
                                                                <TableHead>Действие</TableHead>
                                                                <TableHead>Объект</TableHead>
                                                                <TableHead>Описание</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {auditLogs.slice(0, 50).map((log) => (
                                                                <TableRow key={log.id}>
                                                                    <TableCell className="text-xs">
                                                                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs">
                                                                        {log.user.fullName}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="secondary" className={actionColors[log.action]}>
                                                                            {actionLabels[log.action] || log.action}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-xs">
                                                                        {entityLabels[log.entityType] || log.entityType}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs">
                                                                        {log.description}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <p className="text-center text-muted-foreground py-8">
                                                    История изменений пуста
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="roles">
                                    <div className="space-y-6">
                                        <RoleManagement />
                                        <UserManagement />
                                    </div>
                                </TabsContent>
                                <TabsContent value="register">
                                    <RegistrationRequests />
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