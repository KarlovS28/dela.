// Компонент карточки сотрудника - отображает детальную информацию о сотруднике
// Включает паспортные данные, таблицу оборудования, кнопки печати и увольнения
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { canEditEmployee, canArchiveEmployee } from "@/lib/auth-utils";
import { Edit, PrinterCheck, UserMinus, User, Calendar, MapPin, FileText, Briefcase } from "lucide-react";
import type { EmployeeWithEquipment } from "@shared/schema";

interface EmployeeCardProps {
  employeeId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeCard({ employeeId, open, onOpenChange }: EmployeeCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [editData, setEditData] = useState<Partial<EmployeeWithEquipment>>({});

  const { data: employee, isLoading } = useQuery<EmployeeWithEquipment>({
    queryKey: ["/api/employees", employeeId],
    enabled: open && !!employeeId,
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: Partial<EmployeeWithEquipment>) => {
      const response = await apiRequest("PUT", `/api/employees/${employeeId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsEditing(false);
      setEditData({});
      toast({
        title: "Успешно",
        description: "Данные сотрудника обновлены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные сотрудника",
        variant: "destructive",
      });
    },
  });

  const archiveEmployeeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/employees/${employeeId}/archive`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      onOpenChange(false);
      toast({
        title: "Успешно",
        description: "Сотрудник перемещен в архив",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать сотрудника",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (employee) {
      setEditData(employee);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateEmployeeMutation.mutate(editData);
  };

  const handleArchive = () => {
    if (window.confirm("Вы уверены, что хотите уволить этого сотрудника?")) {
      archiveEmployeeMutation.mutate();
    }
  };

  const handlePrintResponsibility = async () => {
    try {
      // Генерация DOCX акта материальной ответственности
      const response = await fetch(`/api/docx/responsibility-act/${employeeId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Ошибка генерации документа');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `акт-ответственности-${employee?.fullName || 'сотрудник'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Документ создан",
        description: "Акт материальной ответственности сгенерирован",
      });
    } catch (error) {
      toast({
        title: "Ошибка создания документа",
        description: "Не удалось создать акт материальной ответственности",
        variant: "destructive",
      });
    }
  };

  const handlePrintEquipment = async () => {
    try {
      const response = await fetch(`/api/print/employee/${employeeId}/equipment`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Ошибка печати');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `техника-${employee?.fullName || 'сотрудник'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Печать завершена",
        description: "Список техники сотрудника скачан",
      });
    } catch (error) {
      toast({
        title: "Ошибка печати",
        description: "Не удалось распечатать список техники",
        variant: "destructive",
      });
    }
  };

  const handlePrintTermination = async () => {
    try {
      // Генерация DOCX обходного листа при увольнении
      const response = await fetch(`/api/docx/termination-checklist/${employeeId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Ошибка генерации обходного листа');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `обходной-лист-${employee?.fullName || 'сотрудник'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Документ создан",
        description: "Обходной лист сгенерирован",
      });
    } catch (error) {
      toast({
        title: "Ошибка создания документа",
        description: "Не удалось создать обходной лист",
        variant: "destructive",
      });
    }
  };

  const handleTermination = async () => {
    if (window.confirm("Вы уверены, что хотите уволить этого сотрудника? Будут распечатаны все необходимые документы.")) {
      await handlePrintEquipment();
      await handlePrintTermination();
      archiveEmployeeMutation.mutate();
    }
  };

  if (isLoading || !employee) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canEdit = user && canEditEmployee(user.role);
  const canArchive = user && canArchiveEmployee(user.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Карточка сотрудника</DialogTitle>
        </DialogHeader>

        {/* Employee Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Employee Photo */}
          <div className="flex-shrink-0">
            <Avatar className="w-32 h-32 border-4 border-primary">
              <AvatarImage 
                src={employee.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"} 
                alt={employee.fullName}
              />
              <AvatarFallback className="text-lg">
                {employee.fullName.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Employee Info */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">ФИО</Label>
                {isEditing ? (
                  <Input
                    value={editData.fullName || ""}
                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                  />
                ) : (
                  <p className="text-lg font-semibold">{employee.fullName}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Должность</Label>
                {isEditing ? (
                  <Input
                    value={editData.position || ""}
                    onChange={(e) => setEditData({...editData, position: e.target.value})}
                  />
                ) : (
                  <p className="text-lg">{employee.position}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Отдел</Label>
                <p>{employee.department?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Грейд</Label>
                {isEditing ? (
                  <Input
                    value={editData.grade || ""}
                    onChange={(e) => setEditData({...editData, grade: e.target.value})}
                  />
                ) : (
                  <p>{employee.grade}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Edit Button */}
          {canEdit && (
            <div className="flex-shrink-0">
              {isEditing ? (
                <div className="space-x-2">
                  <Button onClick={handleSave} disabled={updateEmployeeMutation.isPending}>
                    {updateEmployeeMutation.isPending ? "Сохранение..." : "Сохранить"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Отмена
                  </Button>
                </div>
              ) : (
                <Button onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Personal Data */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Паспортные данные</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Серия и номер паспорта</Label>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Серия"
                      value={editData.passportSeries || ""}
                      onChange={(e) => setEditData({...editData, passportSeries: e.target.value})}
                    />
                    <Input
                      placeholder="Номер"
                      value={editData.passportNumber || ""}
                      onChange={(e) => setEditData({...editData, passportNumber: e.target.value})}
                    />
                  </div>
                ) : (
                  <p>{employee.passportSeries} {employee.passportNumber}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Дата выдачи</Label>
                {isEditing ? (
                  <Input
                    value={editData.passportDate || ""}
                    onChange={(e) => setEditData({...editData, passportDate: e.target.value})}
                  />
                ) : (
                  <p>{employee.passportDate}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">Прописка</Label>
                {isEditing ? (
                  <Input
                    value={editData.address || ""}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                  />
                ) : (
                  <p>{employee.address}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Номер приказа о приеме</Label>
                {isEditing ? (
                  <Input
                    value={editData.orderNumber || ""}
                    onChange={(e) => setEditData({...editData, orderNumber: e.target.value})}
                  />
                ) : (
                  <p>{employee.orderNumber}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Номер акта мат. ответственности</Label>
                {isEditing ? (
                  <Input
                    value={editData.responsibilityActNumber || ""}
                    onChange={(e) => setEditData({...editData, responsibilityActNumber: e.target.value})}
                  />
                ) : (
                  <p>{employee.responsibilityActNumber}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Material Responsibility Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Акт о материальной ответственности</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№</TableHead>
                    <TableHead>Наименование имущества</TableHead>
                    <TableHead>Инвентарный номер</TableHead>
                    <TableHead>Стоимость</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.equipment.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.inventoryNumber}</TableCell>
                      <TableCell>{item.cost}</TableCell>
                    </TableRow>
                  ))}
                  {employee.equipment.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Имущество не закреплено
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={handlePrintResponsibility} className="bg-green-600 hover:bg-green-700">
            <PrinterCheck className="w-4 h-4 mr-2" />
            Печать
          </Button>
          {canArchive && (
            <Button 
              onClick={handleTermination} 
              variant="destructive"
              disabled={archiveEmployeeMutation.isPending}
            >
              <UserMinus className="w-4 h-4 mr-2" />
              {archiveEmployeeMutation.isPending ? "Увольнение..." : "Увольнение"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
