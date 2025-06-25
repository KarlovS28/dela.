
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, UserCheck, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface RegistrationRequest {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  sysadmin: "Системный администратор",
  accountant: "Бухгалтер",
  "office-manager": "Офис-менеджер"
};

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  approved: "Одобрено",
  rejected: "Отклонено"
};

const statusBadgeVariants: Record<string, string> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive"
};

export function RegistrationRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получение запросов на регистрацию
  const { data: requests, isLoading } = useQuery<RegistrationRequest[]>({
    queryKey: ["/api/registration-requests"],
  });

  // Мутация для одобрения запроса
  const approveRequest = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await fetch(`/api/registration-requests/${requestId}/approve`, {
        method: "PUT",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Не удалось одобрить запрос");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registration-requests"] });
      toast({
        title: "Успешно",
        description: "Запрос на регистрацию одобрен",
      });
    },
    onError: (error) => {
      console.error("Approve request error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось одобрить запрос",
        variant: "destructive",
      });
    },
  });

  // Мутация для отклонения запроса
  const rejectRequest = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await fetch(`/api/registration-requests/${requestId}/reject`, {
        method: "PUT",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Не удалось отклонить запрос");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registration-requests"] });
      toast({
        title: "Успешно",
        description: "Запрос на регистрацию отклонен",
      });
    },
    onError: (error) => {
      console.error("Reject request error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить запрос",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Запросы на регистрацию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Запросы на регистрацию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Нет новых запросов на регистрацию</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Запросы на регистрацию ({requests.filter(r => r.status === 'pending').length} ожидает)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="hidden md:table-cell">Дата подачи</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium text-xs sm:text-sm">
                  {request.fullName}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                  {request.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {roleLabels[request.role] || request.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariants[request.status] as any}>
                    {statusLabels[request.status]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                  {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                            <Check className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Одобрить регистрацию?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Пользователь {request.fullName} сможет войти в систему с ролью "{roleLabels[request.role]}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => approveRequest.mutate(request.id)}>
                              Одобрить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Отклонить регистрацию?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Запрос пользователя {request.fullName} будет отклонен.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => rejectRequest.mutate(request.id)}>
                              Отклонить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  {request.status !== 'pending' && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Обработан</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
