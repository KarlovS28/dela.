
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Save, X, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Equipment } from "@shared/schema";

interface WarehouseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Warehouse({ open, onOpenChange }: WarehouseProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
  const [editData, setEditData] = useState({ name: '', inventoryNumber: '', characteristics: '', cost: '' });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получение оборудования на складе (без привязки к сотрудникам)
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

  // Добавление нового оборудования на склад
  const addItem = useMutation({
    mutationFn: async (itemData: any) => {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...itemData, employeeId: null }),
      });

      if (!response.ok) {
        throw new Error("Failed to add equipment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/equipment"] });
      setNewItem({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
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
      setEditData({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
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

  const handleEditItem = (item: Equipment) => {
    setEditingItem(item.id);
    setEditData({
      name: item.name,
      inventoryNumber: item.inventoryNumber,
      characteristics: item.characteristics || '',
      cost: item.cost || ''
    });
  };

  const handleSaveItem = () => {
    if (editingItem) {
      updateItem.mutate({ itemId: editingItem, data: editData });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditData({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
  };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Склад ({warehouseItems?.length || 0} единиц)
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddItem(!showAddItem)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

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
                      setNewItem({ name: '', inventoryNumber: '', characteristics: '', cost: '' });
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
              {warehouseItems && warehouseItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Наименование</TableHead>
                      <TableHead>Инв. номер</TableHead>
                      <TableHead className="hidden sm:table-cell">Характеристики</TableHead>
                      <TableHead className="hidden sm:table-cell">Стоимость</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouseItems.map((item) => (
                      <TableRow key={item.id}>
                        {editingItem === item.id ? (
                          <>
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
                              <Badge variant="secondary">На складе</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
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
                            <TableCell className="text-xs sm:text-sm">{item.name}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{item.inventoryNumber}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{item.characteristics || '-'}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{item.cost || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">На складе</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)}>
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
  );
}
