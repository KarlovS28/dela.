import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { canImportExport } from "@/lib/auth-utils";
import { useAuth } from "@/hooks/use-auth";

export function ExcelExport() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
      </CardContent>
    </Card>
  );
}