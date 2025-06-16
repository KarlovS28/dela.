// Компонент экспорта и импорта Excel файлов
// Поддерживает 3 типа экспорта: инвентаризация, данные сотрудников, публичные данные
// Включает функциональность импорта для автоматического заполнения базы данных
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { canImportExport } from "@/lib/auth-utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export function ExcelExport() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const equipmentFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!user || !canImportExport(user.role)) {
    return null;
  }

  const handleExport = async (type: 'inventory' | 'employees' | 'employees-public') => {
    setIsExporting(type);
    
    try {
      const response = await fetch(`/api/export/${type}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Ошибка экспорта');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const filename = type === 'inventory' 
        ? 'инвентаризация.xlsx' 
        : type === 'employees' 
        ? 'сотрудники.xlsx' 
        : 'сотрудники-публичные.xlsx';
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Экспорт завершен",
        description: `Файл ${filename} успешно скачан`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  // Функция импорта сотрудников
  const handleImportEmployees = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting('employees');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/employees', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Ошибка импорта');
      }

      const result = await response.json();
      
      // Обновляем кэш данных
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });

      toast({
        title: "Импорт завершен",
        description: result.message,
      });

      if (result.errors) {
        console.warn('Ошибки импорта:', result.errors);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать данные",
        variant: "destructive",
      });
    } finally {
      setIsImporting(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Функция импорта оборудования
  const handleImportEquipment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting('equipment');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/equipment', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Ошибка импорта оборудования');
      }

      const result = await response.json();
      
      // Обновляем кэш данных
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });

      toast({
        title: "Импорт завершен",
        description: result.message,
      });

      if (result.errors) {
        console.warn('Ошибки импорта:', result.errors);
      }
    } catch (error) {
      console.error('Import equipment error:', error);
      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать данные оборудования",
        variant: "destructive",
      });
    } finally {
      setIsImporting(null);
      if (equipmentFileInputRef.current) {
        equipmentFileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Экспорт данных Excel
        </CardTitle>
        <CardDescription>
          Экспорт данных сотрудников и оборудования в формате Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Button
            onClick={() => handleExport('inventory')}
            disabled={isExporting === 'inventory'}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting === 'inventory' ? 'Экспорт...' : 'Инвентаризация'}
          </Button>
          
          <Button
            onClick={() => handleExport('employees')}
            disabled={isExporting === 'employees'}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting === 'employees' ? 'Экспорт...' : 'Данные сотрудников'}
          </Button>
          
          <Button
            onClick={() => handleExport('employees-public')}
            disabled={isExporting === 'employees-public'}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting === 'employees-public' ? 'Экспорт...' : 'Без личных данных'}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Инвентаризация:</strong> ФИО, наименование имущества, инвентарный номер, стоимость</p>
          <p><strong>Данные сотрудников:</strong> ФИО, паспортные данные, должность, грейд, отдел</p>
          <p><strong>Без личных данных:</strong> ФИО, должность, грейд, отдел</p>
        </div>
        
        <Separator className="my-6" />
        
        {/* Секция импорта */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Импорт данных Excel
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Импорт сотрудников */}
            <div className="space-y-2">
              <Label htmlFor="employee-upload">Импорт сотрудников</Label>
              <Input
                id="employee-upload"
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                onChange={handleImportEmployees}
                disabled={isImporting === 'employees'}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Загрузите Excel файл с данными сотрудников
              </p>
            </div>
            
            {/* Импорт оборудования */}
            <div className="space-y-2">
              <Label htmlFor="equipment-upload">Импорт оборудования</Label>
              <Input
                id="equipment-upload"
                type="file"
                accept=".xlsx,.xls"
                ref={equipmentFileInputRef}
                onChange={handleImportEquipment}
                disabled={isImporting === 'equipment'}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Загрузите Excel файл с инвентаризацией
              </p>
            </div>
          </div>
          
          {(isImporting) && (
            <div className="text-center text-sm text-muted-foreground">
              {isImporting === 'employees' ? 'Импорт сотрудников...' : 'Импорт оборудования...'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}