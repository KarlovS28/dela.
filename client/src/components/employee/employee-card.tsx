
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Edit, PrinterCheck, UserMinus, FileText, Upload, Trash2 } from "lucide-react";
import type { EmployeeWithEquipment, Equipment } from "@shared/schema";

interface EmployeeCardProps {
  employeeId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeCard({ employeeId, isOpen, onClose }: EmployeeCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<EmployeeWithEquipment>>({});
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
    name: '',
    inventoryNumber: '',
    cost: ''
  });

  // Fetch employee data
  const { data: employee, isLoading, error } = useQuery<EmployeeWithEquipment>({
    queryKey: [`/api/employees/${employeeId}`],
    enabled: isOpen && !!employeeId,
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: (data: Partial<EmployeeWithEquipment>) =>
      apiRequest(`/api/employees/${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${employeeId}`] });
      setIsEditing(false);
      toast({
        title: "Сотрудник обновлен",
        description: "Данные сотрудника успешно сохранены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить данные сотрудника",
        variant: "destructive",
      });
    },
  });

  // Archive employee mutation
  const archiveEmployeeMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/employees/${employeeId}/archive`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      onClose();
      toast({
        title: "Сотрудник уволен",
        description: "Сотрудник перемещен в архив",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка увольнения",
        description: "Не удалось уволить сотрудника",
        variant: "destructive",
      });
    },
  });

  // Add equipment mutation
  const addEquipmentMutation = useMutation({
    mutationFn: (equipmentData: Partial<Equipment>) =>
      apiRequest('/api/equipment', {
        method: 'POST',
        body: JSON.stringify({ ...equipmentData, employeeId }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${employeeId}`] });
      setIsAddingEquipment(false);
      setNewEquipment({ name: '', inventoryNumber: '', cost: '' });
      toast({
        title: "Оборудование добавлено",
        description: "Новое оборудование успешно добавлено",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка добавления",
        description: "Не удалось добавить оборудование",
        variant: "destructive",
      });
    },
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: (equipmentId: number) =>
      apiRequest(`/api/equipment/${equipmentId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${employeeId}`] });
      toast({
        title: "Оборудование удалено",
        description: "Оборудование успешно удалено",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить оборудование",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateEmployeeMutation.mutate(editData);
  };

  const handleAddEquipment = () => {
    if (newEquipment.name && newEquipment.inventoryNumber) {
      addEquipmentMutation.mutate(newEquipment);
    }
  };

  const handleArchive = () => {
    if (window.confirm('Вы уверены, что хотите уволить этого сотрудника?')) {
      archiveEmployeeMutation.mutate();
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch(`/api/employees/${employeeId}/photo`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: [`/api/employees/${employeeId}`] });
        toast({
          title: "Фото обновлено",
          description: "Фотография сотрудника успешно обновлена",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить фотографию",
        variant: "destructive",
      });
    }
  };

  const handlePrintResponsibilityAct = async () => {
    try {
      const response = await fetch(`/api/docx/responsibility-act/${employeeId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Ошибка генерации акта');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `акт-${employee?.fullName || 'сотрудник'}.docx`;
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
        title: "Обходной лист создан",
        description: "Документ для увольнения сгенерирован",
      });
    } catch (error) {
      toast({
        title: "Ошибка создания документа",
        description: "Не удалось создать обходной лист",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Загрузка...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !employee) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ошибка</DialogTitle>
          </DialogHeader>
          <p>Не удалось загрузить данные сотрудника</p>
        </DialogContent>
      </Dialog>
    );
  }

  const canEdit = canEditEmployee(user.role);
  const canArchive = canArchiveEmployee(user.role);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{employee.fullName}</span>
            <div className="flex gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Отменить' : 'Редактировать'}
                </Button>
              )}
              {canArchive && !employee.isArchived && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleArchive}
                  disabled={archiveEmployeeMutation.isPending}
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  {archiveEmployeeMutation.isPending ? 'Увольнение...' : 'Уволить'}
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Employee Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={employee.photoUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {employee.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {canEdit && (
                    <div>
                      <Label htmlFor="photo-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Загрузить фото
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="fullName">ФИО</Label>
                      <Input
                        id="fullName"
                        value={editData.fullName || employee.fullName}
                        onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Должность</Label>
                      <Input
                        id="position"
                        value={editData.position || employee.position}
                        onChange={(e) => setEditData({...editData, position: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="grade">Грейд</Label>
                      <Input
                        id="grade"
                        value={editData.grade || employee.grade}
                        onChange={(e) => setEditData({...editData, grade: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleSave} disabled={updateEmployeeMutation.isPending}>
                      {updateEmployeeMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Должность</Label>
                      <p className="text-sm">{employee.position}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Грейд</Label>
                      <Badge variant="secondary">{employee.grade}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Отдел</Label>
                      <p className="text-sm">{employee.department?.name || 'Не указан'}</p>
                    </div>
                    {employee.isArchived && (
                      <Badge variant="destructive">Уволен</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Passport Info - only for admin/accountant */}
            {(user.role === 'admin' || user.role === 'accountant') && (
              <Card>
                <CardHeader>
                  <CardTitle>Паспортные данные</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="passportSeries">Серия</Label>
                          <Input
                            id="passportSeries"
                            value={editData.passportSeries || employee.passportSeries || ''}
                            onChange={(e) => setEditData({...editData, passportSeries: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="passportNumber">Номер</Label>
                          <Input
                            id="passportNumber"
                            value={editData.passportNumber || employee.passportNumber || ''}
                            onChange={(e) => setEditData({...editData, passportNumber: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="passportIssuedBy">Кем выдан</Label>
                        <Input
                          id="passportIssuedBy"
                          value={editData.passportIssuedBy || employee.passportIssuedBy || ''}
                          onChange={(e) => setEditData({...editData, passportIssuedBy: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="passportDate">Дата выдачи</Label>
                        <Input
                          id="passportDate"
                          value={editData.passportDate || employee.passportDate || ''}
                          onChange={(e) => setEditData({...editData, passportDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Адрес прописки</Label>
                        <Input
                          id="address"
                          value={editData.address || employee.address || ''}
                          onChange={(e) => setEditData({...editData, address: e.target.value})}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">Серия и номер</Label>
                        <p className="text-sm">{employee.passportSeries} {employee.passportNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Кем выдан</Label>
                        <p className="text-sm">{employee.passportIssuedBy || 'Не указано'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Дата выдачи</Label>
                        <p className="text-sm">{employee.passportDate || 'Не указано'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Адрес прописки</Label>
                        <p className="text-sm">{employee.address || 'Не указан'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Equipment */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Закрепленное оборудование</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintEquipment}
                    >
                      <PrinterCheck className="w-4 h-4 mr-2" />
                      Печать списка
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintResponsibilityAct}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Акт ответственности
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintTermination}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Обходной лист
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {canEdit && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingEquipment(!isAddingEquipment)}
                    >
                      {isAddingEquipment ? 'Отменить' : 'Добавить оборудование'}
                    </Button>
                  </div>
                )}

                {isAddingEquipment && (
                  <div className="mb-4 p-4 border rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="equipment-name">Наименование</Label>
                        <Input
                          id="equipment-name"
                          value={newEquipment.name || ''}
                          onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                          placeholder="Введите наименование"
                        />
                      </div>
                      <div>
                        <Label htmlFor="equipment-inventory">Инвентарный номер</Label>
                        <Input
                          id="equipment-inventory"
                          value={newEquipment.inventoryNumber || ''}
                          onChange={(e) => setNewEquipment({...newEquipment, inventoryNumber: e.target.value})}
                          placeholder="Введите номер"
                        />
                      </div>
                      <div>
                        <Label htmlFor="equipment-cost">Стоимость (руб.)</Label>
                        <Input
                          id="equipment-cost"
                          value={newEquipment.cost || ''}
                          onChange={(e) => setNewEquipment({...newEquipment, cost: e.target.value})}
                          placeholder="Введите стоимость"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddEquipment}
                      disabled={!newEquipment.name || !newEquipment.inventoryNumber || addEquipmentMutation.isPending}
                    >
                      {addEquipmentMutation.isPending ? 'Добавление...' : 'Добавить оборудование'}
                    </Button>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>№</TableHead>
                        <TableHead>Наименование</TableHead>
                        <TableHead>Инвентарный номер</TableHead>
                        <TableHead>Стоимость</TableHead>
                        {canEdit && <TableHead>Действия</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employee.equipment?.length > 0 ? (
                        employee.equipment.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.inventoryNumber}</TableCell>
                            <TableCell>{item.cost} руб.</TableCell>
                            {canEdit && (
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteEquipmentMutation.mutate(item.id)}
                                  disabled={deleteEquipmentMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground">
                            Оборудование не закреплено
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
