
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Trash2, Upload, Plus, Edit, Save, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import type { EmployeeWithEquipment } from "@shared/schema";

interface EmployeeCardProps {
  employeeId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeCard({ employeeId, open, onOpenChange }: EmployeeCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [newEquipment, setNewEquipment] = useState({ name: '', inventoryNumber: '', cost: '' });
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch employee data
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ["/api/employees", employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch employee");
      }
      
      return response.json() as Promise<EmployeeWithEquipment>;
    },
    enabled: !!employeeId && open,
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !employee) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`/api/employees/${employee.id}/photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки фото");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employee.id] });

      toast({
        title: "Успешно",
        description: "Фото обновлено",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const updateEmployeeMutation = useMutation({
    mutationFn: async (updateData: any) => {
      if (!employee) throw new Error("No employee data");
      
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Ошибка обновления сотрудника");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employee?.id] });

      toast({
        title: "Успешно",
        description: "Данные сотрудника обновлены",
      });

      setEditingSection(null);
      setEditData({});
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные сотрудника",
        variant: "destructive",
      });
    },
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async (equipmentData: any) => {
      const response = await fetch(`/api/equipment`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...equipmentData,
          employeeId: employee?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка добавления имущества");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employee?.id] });
      
      toast({
        title: "Успешно",
        description: "Имущество добавлено",
      });

      setNewEquipment({ name: '', inventoryNumber: '', cost: '' });
      setShowAddEquipment(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить имущество",
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: number) => {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Ошибка удаления имущества");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employee?.id] });
      
      toast({
        title: "Успешно",
        description: "Имущество удалено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить имущество",
        variant: "destructive",
      });
    },
  });

  const archiveEmployeeMutation = useMutation({
    mutationFn: async () => {
      if (!employee) throw new Error("No employee data");
      
      const response = await fetch(`/api/employees/${employee.id}/archive`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Ошибка архивирования сотрудника");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      if (employee) {
        queryClient.invalidateQueries({ queryKey: ["/api/employees", employee.id] });
      }

      toast({
        title: "Успешно",
        description: "Сотрудник перемещен в архив",
      });

      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось архивировать сотрудника",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (section: string) => {
    setEditingSection(section);
    if (employee) {
      setEditData({
        fullName: employee.fullName,
        position: employee.position,
        grade: employee.grade,
        passportSeries: employee.passportSeries || '',
        passportNumber: employee.passportNumber || '',
        passportIssuedBy: employee.passportIssuedBy || '',
        passportDate: employee.passportDate || '',
        address: employee.address || '',
        orderNumber: employee.orderNumber || '',
        orderDate: employee.orderDate || '',
        responsibilityActNumber: employee.responsibilityActNumber || '',
        responsibilityActDate: employee.responsibilityActDate || '',
      });
    }
  };

  const handleSaveEdit = () => {
    if (editingSection === 'basic') {
      updateEmployeeMutation.mutate({
        fullName: editData.fullName,
        position: editData.position,
        grade: editData.grade,
      });
    } else if (editingSection === 'personal') {
      updateEmployeeMutation.mutate({
        passportSeries: editData.passportSeries,
        passportNumber: editData.passportNumber,
        passportIssuedBy: editData.passportIssuedBy,
        passportDate: editData.passportDate,
        address: editData.address,
      });
    } else if (editingSection === 'work') {
      updateEmployeeMutation.mutate({
        orderNumber: editData.orderNumber,
        orderDate: editData.orderDate,
        responsibilityActNumber: editData.responsibilityActNumber,
        responsibilityActDate: editData.responsibilityActDate,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditData({});
  };

  const handleDownloadAct = async () => {
    if (!employee) return;
    
    try {
      const response = await fetch(`/api/docx/responsibility-act/${employee.id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Ошибка генерации документа");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `act-${employee.fullName}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать акт",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTermination = async () => {
    if (!employee) return;
    
    try {
      const response = await fetch(`/api/docx/termination-checklist/${employee.id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Ошибка генерации документа");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `termination-${employee.fullName}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать обходной лист",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Загрузка...</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">Загрузка данных сотрудника...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !employee) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Ошибка</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center text-red-600">
            Не удалось загрузить данные сотрудника
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canEdit = user?.role === 'admin' || user?.role === 'accountant' || user?.role === 'sysadmin';
  const canArchive = user?.role === 'admin' || user?.role === 'accountant';
  const canViewWorkDocs = user?.role === 'admin' || user?.role === 'accountant';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Карточка сотрудника</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo and Basic Info */}
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={employee.photoUrl || undefined} alt={employee.fullName} />
                <AvatarFallback className="text-lg">
                  {employee.fullName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              {canEdit && (
                <div className="absolute -bottom-2 -right-2">
                  <Button
                    size="sm"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
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

            <div className="flex-1">
              {editingSection === 'basic' ? (
                <div className="space-y-4">
                  <div>
                    <Label>ФИО</Label>
                    <Input
                      value={editData.fullName}
                      onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Должность</Label>
                    <Input
                      value={editData.position}
                      onChange={(e) => setEditData({...editData, position: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Грейд</Label>
                    <Input
                      value={editData.grade}
                      onChange={(e) => setEditData({...editData, grade: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{employee.fullName}</h2>
                    {canEdit && (
                      <Button size="sm" variant="ghost" onClick={() => handleStartEdit('basic')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">{employee.position}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{employee.grade}</Badge>
                    <Badge variant="outline">{employee.department?.name}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Личная информация</CardTitle>
              {canEdit && editingSection !== 'personal' && (
                <Button size="sm" variant="ghost" onClick={() => handleStartEdit('personal')}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingSection === 'personal' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Серия паспорта</Label>
                      <Input
                        value={editData.passportSeries}
                        onChange={(e) => setEditData({...editData, passportSeries: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Номер паспорта</Label>
                      <Input
                        value={editData.passportNumber}
                        onChange={(e) => setEditData({...editData, passportNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Кем выдан</Label>
                      <Input
                        value={editData.passportIssuedBy}
                        onChange={(e) => setEditData({...editData, passportIssuedBy: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Дата выдачи</Label>
                      <Input
                        value={editData.passportDate}
                        onChange={(e) => setEditData({...editData, passportDate: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Адрес прописки</Label>
                      <Input
                        value={editData.address}
                        onChange={(e) => setEditData({...editData, address: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Серия паспорта</Label>
                    <p>{employee.passportSeries || 'Не указана'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Номер паспорта</Label>
                    <p>{employee.passportNumber || 'Не указан'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Кем выдан</Label>
                    <p>{employee.passportIssuedBy || 'Не указано'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Дата выдачи</Label>
                    <p>{employee.passportDate || 'Не указана'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Адрес прописки</Label>
                    <p>{employee.address || 'Не указан'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Documents - Only visible for admin and accountant */}
          {canViewWorkDocs && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Документы о приеме на работу</CardTitle>
                {canEdit && editingSection !== 'work' && (
                  <Button size="sm" variant="ghost" onClick={() => handleStartEdit('work')}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editingSection === 'work' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Номер приказа</Label>
                        <Input
                          value={editData.orderNumber}
                          onChange={(e) => setEditData({...editData, orderNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Дата приказа</Label>
                        <Input
                          value={editData.orderDate}
                          onChange={(e) => setEditData({...editData, orderDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Номер акта мат. ответственности</Label>
                        <Input
                          value={editData.responsibilityActNumber}
                          onChange={(e) => setEditData({...editData, responsibilityActNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Дата акта</Label>
                        <Input
                          value={editData.responsibilityActDate}
                          onChange={(e) => setEditData({...editData, responsibilityActDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-2" />
                        Сохранить
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Номер приказа</Label>
                      <p>{employee.orderNumber || 'Не указан'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Дата приказа</Label>
                      <p>{employee.orderDate || 'Не указана'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Номер акта мат. ответственности</Label>
                      <p>{employee.responsibilityActNumber || 'Не указан'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Дата акта</Label>
                      <p>{employee.responsibilityActDate || 'Не указана'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Equipment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Закрепленное имущество
                <div className="flex gap-2">
                  {canEdit && (
                    <Button onClick={() => setShowAddEquipment(true)} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить
                    </Button>
                  )}
                  <Button onClick={handleDownloadAct} size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Скачать акт
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAddEquipment && (
                <div className="mb-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Добавить имущество</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Наименование</Label>
                      <Input
                        value={newEquipment.name}
                        onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                        placeholder="Название имущества"
                      />
                    </div>
                    <div>
                      <Label>Инвентарный номер</Label>
                      <Input
                        value={newEquipment.inventoryNumber}
                        onChange={(e) => setNewEquipment({...newEquipment, inventoryNumber: e.target.value})}
                        placeholder="Инв. номер"
                      />
                    </div>
                    <div>
                      <Label>Стоимость</Label>
                      <Input
                        value={newEquipment.cost}
                        onChange={(e) => setNewEquipment({...newEquipment, cost: e.target.value})}
                        placeholder="Стоимость"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => addEquipmentMutation.mutate(newEquipment)}
                      disabled={!newEquipment.name || !newEquipment.inventoryNumber}
                    >
                      Добавить
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddEquipment(false)}>
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

              {employee.equipment && employee.equipment.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Наименование</TableHead>
                      <TableHead>Инвентарный номер</TableHead>
                      <TableHead>Стоимость</TableHead>
                      {canEdit && <TableHead>Действия</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.equipment.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.inventoryNumber}</TableCell>
                        <TableCell>{item.cost}</TableCell>
                        {canEdit && (
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteEquipmentMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">Нет закрепленного имущества</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {canArchive && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Действия</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadTermination} variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Обходной лист
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Уволить
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Увольнение сотрудника</AlertDialogTitle>
                        <AlertDialogDescription>
                          Вы уверены, что хотите уволить сотрудника {employee.fullName}? 
                          Сотрудник будет перемещен в архив.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => archiveEmployeeMutation.mutate()}
                          disabled={archiveEmployeeMutation.isPending}
                        >
                          {archiveEmployeeMutation.isPending ? "Увольнение..." : "Уволить"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
