import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  // Все хуки должны быть объявлены ПЕРЕД любыми условными возвратами
  const [isUploading, setIsUploading] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [newEquipment, setNewEquipment] = useState({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<number | null>(null);
  const [editEquipmentData, setEditEquipmentData] = useState({ name: '', inventoryNumber: '', characteristics: '', cost: '' });

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

  // Мутации
  const updateEmployee = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update employee");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setEditingSection(null);
      setEditData({});
      toast({
        title: "Успешно",
        description: "Данные обновлены",
      });
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные",
        variant: "destructive",
      });
    },
  });

  const addEquipment = useMutation({
    mutationFn: async (equipmentData: any) => {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...equipmentData, employeeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add equipment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setNewEquipment({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
      setShowAddEquipment(false);
      toast({
        title: "Успешно",
        description: "Имущество добавлено. Акт материальной ответственности автоматически обновлен.",
      });
    },
    onError: (error) => {
      console.error("Add equipment error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить имущество",
        variant: "destructive",
      });
    },
  });

  const updateEquipment = useMutation({
    mutationFn: async ({ equipmentId, data }: { equipmentId: number; data: any }) => {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update equipment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setEditingEquipment(null);
      setEditEquipmentData({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
      toast({
        title: "Успешно",
        description: "Имущество обновлено. Акт материальной ответственности автоматически обновлен.",
      });
    },
    onError: (error) => {
      console.error("Update equipment error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить имущество",
        variant: "destructive",
      });
    },
  });

  const deleteEquipment = useMutation({
    mutationFn: async (equipmentId: number) => {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete equipment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "Успешно",
        description: "Имущество удалено. Акт материальной ответственности автоматически обновлен.",
      });
    },
    onError: (error) => {
      console.error("Delete equipment error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить имущество",
        variant: "destructive",
      });
    },
  });

  const archiveEmployee = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}/archive`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to archive employee");
      }

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
    onError: (error) => {
      console.error("Archive error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать сотрудника",
        variant: "destructive",
      });
    },
  });

  // Обработчики событий
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
        throw new Error("Failed to upload photo");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });

      toast({
        title: "Успешно",
        description: "Фото загружено",
      });
    } catch (error) {
      console.error("Photo upload error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSection = (section: string) => {
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

  const handleSaveSection = () => {
    updateEmployee.mutate(editData);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditData({});
  };

  const handleEditEquipment = (equipment: any) => {
    setEditingEquipment(equipment.id);
    setEditEquipmentData({
      name: equipment.name,
      inventoryNumber: equipment.inventoryNumber,
      characteristics: equipment.characteristics || '',
      cost: equipment.cost
    });
  };

  const handleSaveEquipment = () => {
    if (editingEquipment) {
      updateEquipment.mutate({ equipmentId: editingEquipment, data: editEquipmentData });
    }
  };

  const handleCancelEditEquipment = () => {
    setEditingEquipment(null);
    setEditEquipmentData({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
  };

  const canEdit = user && ['admin', 'accountant'].includes(user.role);
  const canEditEquipment = user && ['admin', 'sysadmin', 'office-manager', 'accountant'].includes(user.role);
  const canViewDocs = user && ['admin', 'accountant'].includes(user.role);

  // ТОЛЬКО ТЕПЕРЬ мы можем использовать условные возвраты
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Загрузка...</DialogTitle>
          </DialogHeader>
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
          <p>Не удалось загрузить данные сотрудника</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee.fullName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Фотография
                {canEdit && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Загрузка...' : 'Загрузить'}
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Avatar className="w-32 h-32">
                <AvatarImage src={employee.photoUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {employee.fullName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </CardContent>
          </Card>

          {/* Basic Info Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Основная информация
                {canEdit && (
                  <div className="flex gap-2">
                    {editingSection === 'basic' ? (
                      <>
                        <Button size="sm" onClick={handleSaveSection}>
                          <Save className="w-4 h-4 mr-2" />
                          Сохранить
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="w-4 h-4 mr-2" />
                          Отменить
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEditSection('basic')}>
                        <Edit className="w-4 h-4 mr-2" />
                        Редактировать
                      </Button>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingSection === 'basic' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>ФИО</Label>
                    <Input
                      value={editData.fullName || ''}
                      onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Должность</Label>
                    <Input
                      value={editData.position || ''}
                      onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Грейд</Label>
                    <Input
                      value={editData.grade || ''}
                      onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">ФИО:</span>
                    <p className="font-medium">{employee.fullName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Должность:</span>
                    <p>{employee.position}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Грейд:</span>
                    <Badge variant="secondary">{employee.grade}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Отдел:</span>
                    <p>{employee.department?.name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Passport Info Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Паспортные данные
                {canEdit && (
                  <div className="flex gap-2">
                    {editingSection === 'passport' ? (
                      <>
                        <Button size="sm" onClick={handleSaveSection}>
                          <Save className="w-4 h-4 mr-2" />
                          Сохранить
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="w-4 h-4 mr-2" />
                          Отменить
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEditSection('passport')}>
                        <Edit className="w-4 h-4 mr-2" />
                        Редактировать
                      </Button>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingSection === 'passport' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Серия паспорта</Label>
                    <Input
                      value={editData.passportSeries || ''}
                      onChange={(e) => setEditData({ ...editData, passportSeries: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Номер паспорта</Label>
                    <Input
                      value={editData.passportNumber || ''}
                      onChange={(e) => setEditData({ ...editData, passportNumber: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Кем выдан</Label>
                    <Input
                      value={editData.passportIssuedBy || ''}
                      onChange={(e) => setEditData({ ...editData, passportIssuedBy: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Дата выдачи</Label>
                    <Input
                      value={editData.passportDate || ''}
                      onChange={(e) => setEditData({ ...editData, passportDate: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Адрес прописки</Label>
                    <Input
                      value={editData.address || ''}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Серия:</span>
                    <p>{employee.passportSeries || 'Не указана'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Номер:</span>
                    <p>{employee.passportNumber || 'Не указан'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Кем выдан:</span>
                    <p>{employee.passportIssuedBy || 'Не указано'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Дата выдачи:</span>
                    <p>{employee.passportDate || 'Не указана'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Адрес:</span>
                    <p>{employee.address || 'Не указан'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Section - visible only for admin and accountant */}
          {canViewDocs && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Документы о приеме на работу
                  {canEdit && (
                    <div className="flex gap-2">
                      {editingSection === 'documents' ? (
                        <>
                          <Button size="sm" onClick={handleSaveSection}>
                            <Save className="w-4 h-4 mr-2" />
                            Сохранить
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 mr-2" />
                            Отменить
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditSection('documents')}>
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать
                        </Button>
                      )}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingSection === 'documents' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Номер приказа о приеме</Label>
                      <Input
                        value={editData.orderNumber || ''}
                        onChange={(e) => setEditData({ ...editData, orderNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Дата приказа о приеме</Label>
                      <Input
                        value={editData.orderDate || ''}
                        onChange={(e) => setEditData({ ...editData, orderDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Номер акта мат. ответственности</Label>
                      <Input
                        value={editData.responsibilityActNumber || ''}
                        onChange={(e) => setEditData({ ...editData, responsibilityActNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Дата акта мат. ответственности</Label>
                      <Input
                        value={editData.responsibilityActDate || ''}
                        onChange={(e) => setEditData({ ...editData, responsibilityActDate: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Номер приказа:</span>
                      <p>{employee.orderNumber || 'Не указан'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Дата приказа:</span>
                      <p>{employee.orderDate || 'Не указана'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Номер акта мат. ответственности:</span>
                      <p>{employee.responsibilityActNumber || 'Не указан'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Дата акта мат. ответственности:</span>
                      <p>{employee.responsibilityActDate || 'Не указана'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Equipment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Закрепленное имущество ({employee.equipment?.length || 0})
                {canEditEquipment && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddEquipment(!showAddEquipment)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAddEquipment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded">
                  <div>
                    <Label>Наименование</Label>
                    <Input
                      value={newEquipment.name}
                      onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                      placeholder="Наименование"
                    />
                  </div>
                  <div>
                    <Label>Инвентарный номер</Label>
                    <Input
                      value={newEquipment.inventoryNumber}
                      onChange={(e) => setNewEquipment({ ...newEquipment, inventoryNumber: e.target.value })}
                      placeholder="Инвентарный номер"
                    />
                  </div>
                  <div>
                    <Label>Характеристики</Label>
                    <Input
                      value={newEquipment.characteristics || ''}
                      onChange={(e) => setNewEquipment({ ...newEquipment, characteristics: e.target.value })}
                      placeholder="Описание характеристик"
                    />
                  </div>
                  <div>
                    <Label>Стоимость</Label>
                    <Input
                      value={newEquipment.cost}
                      onChange={(e) => setNewEquipment({ ...newEquipment, cost: e.target.value })}
                      placeholder="Стоимость"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => addEquipment.mutate(newEquipment)}
                      disabled={!newEquipment.name || !newEquipment.inventoryNumber}
                    >
                      Добавить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddEquipment(false);
                        setNewEquipment({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
                      }}
                    >
                      Отменить
                    </Button>
                  </div>
                </div>
              )}

              {employee.equipment && employee.equipment.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Наименование</TableHead>
                      <TableHead>Инв. номер</TableHead>
                      <TableHead>Характеристики</TableHead>
                      <TableHead>Стоимость</TableHead>
                      {canEditEquipment && <TableHead>Действия</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.equipment.map((item) => (
                      <TableRow key={item.id}>
                        {editingEquipment === item.id ? (
                          <>
                            <TableCell>
                              <Input
                                value={editEquipmentData.name}
                                onChange={(e) => setEditEquipmentData({ ...editEquipmentData, name: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editEquipmentData.inventoryNumber}
                                onChange={(e) => setEditEquipmentData({ ...editEquipmentData, inventoryNumber: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editEquipmentData.characteristics}
                                onChange={(e) => setEditEquipmentData({ ...editEquipmentData, characteristics: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editEquipmentData.cost}
                                onChange={(e) => setEditEquipmentData({ ...editEquipmentData, cost: e.target.value })}
                              />
                            </TableCell>
                            {canEditEquipment && (
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveEquipment}>
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelEditEquipment}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </>
                        ) : (
                          <>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.inventoryNumber}</TableCell>
                            <TableCell>{item.characteristics || '-'}</TableCell>
                            <TableCell>{item.cost}</TableCell>
                            {canEditEquipment && (
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => handleEditEquipment(item)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Удалить имущество?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Это действие нельзя отменить. Имущество будет удалено из системы.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Отменить</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteEquipment.mutate(item.id)}>
                                          Удалить
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            )}
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">Имущество не закреплено</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    onClick={() => window.open(`/api/docx/responsibility-act/${employee.id}`, '_blank')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Акт мат. ответственности
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Увольнение
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Уволить сотрудника?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Сотрудник будет перемещен в архив. Будет сгенерирован обходной лист и список имущества.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отменить</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            // Сначала открываем документы
                            window.open(`/api/docx/termination-checklist/${employee.id}`, '_blank');
                            window.open(`/api/print/employee/${employee.id}/equipment`, '_blank');
                            // Затем архивируем
                            setTimeout(() => archiveEmployee.mutate(), 1000);
                          }}
                        >
                          Уволить
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