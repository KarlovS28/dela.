
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Archive } from "lucide-react";
import type { Equipment } from "@shared/schema";

interface DecommissionedEquipmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DecommissionedEquipment({ open, onOpenChange }: DecommissionedEquipmentProps) {
  const { toast } = useToast();

  // Получение списанного оборудования
  const { data: decommissionedItems, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/decommissioned/equipment"],
    queryFn: async () => {
      const response = await fetch("/api/decommissioned/equipment", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch decommissioned equipment");
      }

      return response.json();
    },
    enabled: open,
  });

  // Скачивание списанного имущества
  const handleDownloadDecommissioned = async () => {
    try {
      const response = await fetch('/api/export/decommissioned', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Ошибка экспорта');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'decommissioned-equipment.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Экспорт завершен",
        description: "Файл со списанным имуществом загружен",
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Списание</DialogTitle>
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Archive className="w-5 h-5" />
              <span>Списание ({decommissionedItems?.length || 0} единиц)</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadDecommissioned}
              disabled={!decommissionedItems?.length}
            >
              <Download className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Списанное имущество</CardTitle>
            </CardHeader>
            <CardContent>
              {decommissionedItems && decommissionedItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Наименование</TableHead>
                      <TableHead>Инв. номер</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead className="hidden sm:table-cell">Характеристики</TableHead>
                      <TableHead className="hidden sm:table-cell">Стоимость</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decommissionedItems.map((item) => (
                      <TableRow key={item.id}>
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
                          <Badge variant="destructive">Списано</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Нет списанного имущества</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
