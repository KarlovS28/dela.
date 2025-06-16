
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { canEditEmployee, canArchiveEmployee } from "@/lib/auth-utils";
import { Edit, PrinterCheck, UserMinus, Upload } from "lucide-react";
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a temporary URL for the uploaded image
      const photoUrl = URL.createObjectURL(file);
      setEditData({ ...editData, photoUrl });
      
      toast({
        title: "Фото загружено",
        description: "Фото будет сохранено при сохранении изменений",
      });
    }
  };

  const handlePrint = () => {
    if (!employee) return;
    
    // Generate print version of the material responsibility act
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Акт о материальной ответственности - ${employee.fullName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .employee-info { margin-bottom: 20px; }
              .equipment-table { width: 100%; border-collapse: collapse; }
              .equipment-table th, .equipment-table td { border: 1px solid #000; padding: 8px; text-align: left; }
              .equipment-table th { background-color: #f0f0f0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>АКТ О МАТЕРИАЛЬНОЙ ОТВЕТСТВЕННОСТИ</h1>
              <p>№ ${employee.responsibilityActNumber || 'Не указан'}</p>
            </div>
            <div class="employee-info">
              <p><strong>ФИО:</strong> ${employee.fullName}</p>
              <p><strong>Должность:</strong> ${employee.position}</p>
              <p><strong>Приказ о приеме:</strong> ${employee.orderNumber || 'Не указан'}</p>
            </div>
            <table class="equipment-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Наименование имущества</th>
                  <th>Инвентарный номер</th>
                  <th>Стоимость</th>
                </tr>
              </thead>
              <tbody>
                ${employee.equipment.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.inventoryNumber}</td>
                    <td>${item.cost}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Always render the same structure to avoid hook order issues
  if (isLoading || !employee) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Загрузка...</DialogTitle>
          </DialogHeader>
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
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Редактирование сотрудника" : "Карточка сотрудника"}
          </DialogTitle>
        </DialogHeader>
        
        {/* Employee Photo and Basic Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <Avatar className="w-32 h-32 border-4 border-primary">
                  <AvatarImage 
                    src={editData.photoUrl || employee.photoUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=face`} 
                    alt={employee.fullName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-2xl">
                    {employee.fullName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing && (
                  <div className="mt-4">
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Загрузить фото
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p>{employee.position}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Разряд</Label>
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
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Личная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Серия паспорта</Label>
                {isEditing ? (
                  <Input
                    value={editData.passportSeries || ""}
                    onChange={(e) => setEditData({...editData, passportSeries: e.target.value})}
                  />
                ) : (
                  <p>{employee.passportSeries || "Не указана"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Номер паспорта</Label>
                {isEditing ? (
                  <Input
                    value={editData.passportNumber || ""}
                    onChange={(e) => setEditData({...editData, passportNumber: e.target.value})}
                  />
                ) : (
                  <p>{employee.passportNumber || "Не указан"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Дата выдачи паспорта</Label>
                {isEditing ? (
                  <Input
                    value={editData.passportDate || ""}
                    onChange={(e) => setEditData({...editData, passportDate: e.target.value})}
                  />
                ) : (
                  <p>{employee.passportDate || "Не указана"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Адрес</Label>
                {isEditing ? (
                  <Input
                    value={editData.address || ""}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                  />
                ) : (
                  <p>{employee.address || "Не указан"}</p>
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
                  <p>{employee.orderNumber || "Не указан"}</p>
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
                  <p>{employee.responsibilityActNumber || "Не указан"}</p>
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
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
            <PrinterCheck className="w-4 h-4 mr-2" />
            Печать акта
          </Button>
          
          {canEdit && (
            <>
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={updateEmployeeMutation.isPending}>
                    {updateEmployeeMutation.isPending ? "Сохранение..." : "Сохранить"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Отмена
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              )}
            </>
          )}
          
          {canArchive && !employee.isArchived && (
            <Button 
              onClick={handleArchive} 
              variant="destructive"
              disabled={archiveEmployeeMutation.isPending}
            >
              <UserMinus className="w-4 h-4 mr-2" />
              {archiveEmployeeMutation.isPending ? "Увольнение..." : "Уволить"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
