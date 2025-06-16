
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Shield, Key } from "lucide-react";

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  sysadmin: "Системный администратор",
  accountant: "Бухгалтер",
  "office-manager": "Офис-менеджер"
};

const roleBadgeVariants: Record<string, string> = {
  admin: "destructive",
  sysadmin: "default",
  accountant: "secondary",
  "office-manager": "outline"
};

export function UserManagement() {
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [passwordDialogUserId, setPasswordDialogUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUserId(null);
      toast({
        title: "Успешно",
        description: "Роль пользователя обновлена",
      });
    },
    onError: (error) => {
      console.error("Update user role error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить роль пользователя",
        variant: "destructive",
      });
    },
  });

  const updateUserPassword = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const response = await fetch(`/api/users/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        throw new Error("Failed to update password");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setPasswordDialogUserId(null);
      setNewPassword("");
      toast({
        title: "Успешно",
        description: "Пароль пользователя обновлен",
      });
    },
    onError: (error) => {
      console.error("Update password error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить пароль",
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Успешно",
        description: "Пользователь удален",
      });
    },
    onError: (error) => {
      console.error("Delete user error:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить пользователя",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: number, newRole: string) => {
    updateUserRole.mutate({ userId, role: newRole });
  };

  const handlePasswordChange = (userId: number) => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }
    updateUserPassword.mutate({ userId, newPassword });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Управление пользователями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Управление пользователями
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead className="hidden md:table-cell">Дата регистрации</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-xs sm:text-sm">{user.fullName}</TableCell>
                <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{user.email}</TableCell>
                <TableCell>
                  {editingUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => {
                          handleRoleChange(user.id, value);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Администратор</SelectItem>
                          <SelectItem value="sysadmin">Системный администратор</SelectItem>
                          <SelectItem value="accountant">Бухгалтер</SelectItem>
                          <SelectItem value="office-manager">Офис-менеджер</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUserId(null)}
                      >
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant={roleBadgeVariants[user.role] as any}
                      className="cursor-pointer"
                      onClick={() => setEditingUserId(user.id)}
                    >
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog open={passwordDialogUserId === user.id} onOpenChange={(open) => {
                      if (!open) {
                        setPasswordDialogUserId(null);
                        setNewPassword("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setPasswordDialogUserId(user.id)}>
                          <Key className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Изменить пароль для {user.fullName}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="newPassword">Новый пароль</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Минимум 6 символов"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handlePasswordChange(user.id)}
                              disabled={!newPassword || newPassword.length < 6}
                            >
                              Сохранить
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setPasswordDialogUserId(null);
                                setNewPassword("");
                              }}
                            >
                              Отменить
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Пользователь {user.fullName} будет удален из системы.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отменить</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteUser.mutate(user.id)}>
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
