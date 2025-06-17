

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Save, X, Trash2, Filter, Download, Upload, FileText, UserPlus, Archive } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Equipment, Employee } from "@shared/schema";

interface WarehouseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Warehouse({ open, onOpenChange }: WarehouseProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Техника' | 'Мебель'>('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningItemId, setAssigningItemId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ name: '', inventoryNumber: '', characteristics: '', cost: '', category: 'Техника' });
  const [editData, setEditData] = useState({ name: '', inventoryNumber: '', characteristics: '', cost: '', category: 'Техника' });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получение оборудования на складе
  const { data: warehouseItems, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/warehouse/equipment"],
    queryFn: async () => {
      const response = await fetch("/api/warehouse/equipment", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch warehouse equipment");
      }

      return response.json();
    },
    enabled: open,
  });

  // Получение списка сотрудников для назначения
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch("/api/departments", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const departments = await response.json();
      return departments.flatMap((dept: any) => dept.employees || []);
    },
    enabled: showAssignDialog,
  });

  // Добавление нового оборудования на склад
  const addItem = useMutation({
    mutationFn: async (itemData: any) => {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...itemData, employeeId: null, category: itemData.category || 'Техника' }),
      });

      if (!response.ok) {
        throw new Error("Failed to add equipment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/equipment"] });
      setNewItem({ name: '', inventoryNumber: '', characteristics: '', cost: '', category: 'Техника' });
      setShowAddItem(false);
      toast({
        title: "Успешно",
        description: "Оборудование добавлено на склад",
      });
    },
    onError: (error) => {
      console.error("Add equipment error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить оборудование",
        variant: "destructive",
      });
    },
  });

  // Обновление оборудования
  const updateItem = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: number; data: any }) => {
      const response = await fetch(`/api/equipment/${itemId}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/equipment"] });
      setEditingItem(null);
      setEditData({ name: '', inventoryNumber: '', characteristics: '', cost: '', category: 'Техника' });
      toast({
        title: "Успешно",
        description: "Оборудование обновлено",
      });
    },
    onError: (error) => {
      console.error("Update equipment error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить оборудование",
        variant: "destructive",
      });
    },
  });

  // Удаление оборудования
  const deleteItem = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch(`/api/equipment/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete equipment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/equipment"] });
      toast({
        title: "Успешно",
        description: "Оборудование удалено",
      });
    },
    onError: (error) => {
      console.error("Delete equipment error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить оборудование",
        variant: "destructive",
      });
    },
  });

  // Списание оборудования
  const decommissionItem = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch(`/api/equipment/${itemId}/decommission`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to decommission equipment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/equipment"] });
      toast({
        title: "Успешно",
        description: "Оборудование списано",
      });
    },
    onError: (error) => {
      console.error("Decommission equipment error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось списать оборудование",
        variant: "destructive",
      });
    },
  });

  // Назначение оборудования сотруднику
  const assignItem = useMutation({
    mutationFn: async ({ itemId, employeeId }: { itemId: number; employeeId: number }) => {
      const response = await fetch(`/api/equipment/${itemId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ employeeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign equipment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setShowAssignDialog(false);
      setAssigningItemId(null);
      toast({
        title: "Успешно",
        description: "Оборудование назначено сотруднику",
      });
    },
    onError: (error) => {
      console.error("Assign equipment error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить оборудование",
        variant: "destructive",
      });
    },
  });

  const handleEditItem = (item: Equipment) => {
    setEditingItem(item.id);
    setEditData({
      name: item.name,
      inventoryNumber: item.inventoryNumber,
      characteristics: item.characteristics || '',
      cost: item.cost || '',
      category: (item as any).category || 'Техника'
    });
  };

  const handleSaveItem = () => {
    if (editingItem) {
      updateItem.mutate({ itemId: editingItem, data: editData });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditData({ name: '', inventoryNumber: '', characteristics: '', cost: '', category: 'Техника' });
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // Скачивание выбранного оборудования
  const handleDownloadSelected = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите оборудование для скачивания",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/export/selected-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ equipmentIds: selectedItems })
      });

      if (!response.ok) throw new Error('Ошибка экспорта');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected-equipment.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Экспорт завершен",
        description: "Файл с выбранным оборудованием загружен",
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать выбранное оборудование",
        variant: "destructive",
      });
    }
  };

  // Скачивание шаблона
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/template/warehouse-equipment', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Ошибка загрузки шаблона');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-warehouse-equipment.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Шаблон загружен",
        description: "Шаблон для импорта оборудования загружен",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить шаблон",
        variant: "destructive",
      });
    }
  };

  // Импорт оборудования
  const handleImportEquipment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/warehouse-equipment', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const result = await response.json();

      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/equipment'] });

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

  // Фильтрация оборудования по категории
  const filteredItems = warehouseItems?.filter(item => {
    if (categoryFilter === 'all') return true;
    return (item as any).category === categoryFilter;
  }) || [];

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Склад</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Склад ({filteredItems.length} из {warehouseItems?.length || 0} единиц)</span>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <Select value={categoryFilter} onValueChange={(value: 'all' | 'Техника' | 'Мебель') => setCategoryFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="Техника">Техника</SelectItem>
                      <SelectItem value="Мебель">Мебель</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadTemplate}>
                  <FileText className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                  <Upload className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadSelected} disabled={selectedItems.length === 0}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddItem(!showAddItem)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportEquipment}
            accept=".xlsx,.xls"
            className="hidden"
          />

          <div className="space-y-6">
            {/* Форма добавления нового оборудования */}
            {showAddItem && (
              <Card>
                <CardHeader>
                  <CardTitle>Добавить оборудование на склад</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Наименование</Label>
                      <Input
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="Наименование оборудования"
                      />
                    </div>
                    <div>
                      <Label>Инвентарный номер</Label>
                      <Input
                        value={newItem.inventoryNumber}
                        onChange={(e) => setNewItem({ ...newItem, inventoryNumber: e.target.value })}
                        placeholder="Инвентарный номер"
                      />
                    </div>
                    <div>
                      <Label>Характеристики</Label>
                      <Input
                        value={newItem.characteristics}
                        onChange={(e) => setNewItem({ ...newItem, characteristics: e.target.value })}
                        placeholder="Описание характеристик"
                      />
                    </div>
                    <div>
                      <Label>Стоимость</Label>
                      <Input
                        value={newItem.cost}
                        onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                        placeholder="Стоимость"
                      />
                    </div>
                    <div>
                      <Label>Категория</Label>
                      <Select value={newItem.category} onValueChange={(value: 'Техника' | 'Мебель') => setNewItem({ ...newItem, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Техника">Техника</SelectItem>
                          <SelectItem value="Мебель">Мебель</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => addItem.mutate(newItem)}
                      disabled={!newItem.name || !newItem.inventoryNumber}
                    >
                      Добавить
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddItem(false);
                        setNewItem({ name: '', inventoryNumber: '', characteristics: '', cost: '', category: 'Техника' });
                      }}
                    >
                      Отменить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Список оборудования на складе */}
            <Card>
              <CardHeader>
                <CardTitle>Оборудование на складе</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredItems && filteredItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Наименование</TableHead>
                        <TableHead>Инв. номер</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead className="hidden sm:table-cell">Характеристики</TableHead>
                        <TableHead className="hidden sm:table-cell">Стоимость</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          {editingItem === item.id ? (
                            <>
                              <TableCell>
                                <Checkbox
                                  checked={selectedItems.includes(item.id)}
                                  onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editData.name}
                                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editData.inventoryNumber}
                                  onChange={(e) => setEditData({ ...editData, inventoryNumber: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <Select value={editData.category} onValueChange={(value: 'Техника' | 'Мебель') => setEditData({ ...editData, category: value })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Техника">Техника</SelectItem>
                                    <SelectItem value="Мебель">Мебель</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Input
                                  value={editData.characteristics}
                                  onChange={(e) => setEditData({ ...editData, characteristics: e.target.value })}
                                />
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Input
                                  value={editData.cost}
                                  onChange={(e) => setEditData({ ...editData, cost: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" onClick={handleSaveItem}>
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>
                                <Checkbox
                                  checked={selectedItems.includes(item.id)}
                                  onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">{item.name}</TableCell>
                              <TableCell className="text-xs sm:text-sm">{item.inventoryNumber}</TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                <Badge variant={(item as any).category === 'Техника' ? 'default' : 'secondary'}>
                                  {(item as any).category || 'Техника'}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{item.characteristics || '-'}</TableCell>
                              <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{item.cost || '-'}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => {
                                      setAssigningItemId(item.id);
                                      setShowAssignDialog(true);
                                    }}
                                  >
                                    <UserPlus className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <Archive className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Списать оборудование?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Оборудование будет перемещено в раздел "Списание".
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Отменить</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => decommissionItem.mutate(item.id)}>
                                          Списать
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Удалить оборудование?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Это действие нельзя отменить. Оборудование будет удалено из системы.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Отменить</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteItem.mutate(item.id)}>
                                          Удалить
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Склад пуст</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог назначения оборудования */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выдать оборудование сотруднику</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Выберите сотрудника</Label>
            <Select onValueChange={(value) => {
              if (assigningItemId) {
                assignItem.mutate({ itemId: assigningItemId, employeeId: parseInt(value) });
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите сотрудника" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.fullName} - {employee.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

