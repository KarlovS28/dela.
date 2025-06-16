
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrinterCheck, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EmployeeWithEquipment } from "@shared/schema";

interface ArchivedEmployeesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchivedEmployees({ open, onOpenChange }: ArchivedEmployeesProps) {
  const { toast } = useToast();
  
  const { data: archivedEmployees, isLoading } = useQuery<EmployeeWithEquipment[]>({
    queryKey: ["/api/employees/archived"],
    enabled: open,
  });

  const handlePrintEquipment = async (employeeId: number, employeeName: string) => {
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
      a.download = `техника-${employeeName}.xlsx`;
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

  const handlePrintResponsibility = async (employeeId: number, employeeName: string) => {
    try {
      const response = await fetch(`/api/docx/responsibility-act/${employeeId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Ошибка генерации документа');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `акт-ответственности-${employeeName}.docx`;
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

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Архив уволенных сотрудников</DialogTitle>
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
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Архив уволенных сотрудников</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {archivedEmployees && archivedEmployees.length > 0 ? (
            archivedEmployees.map((employee) => (
              <Card key={employee.id} className="border-2 border-red-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage 
                          src={employee.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"} 
                          alt={employee.fullName}
                        />
                        <AvatarFallback>
                          {employee.fullName.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{employee.fullName}</CardTitle>
                        <p className="text-muted-foreground">{employee.position}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.department?.name} • {employee.grade}
                        </p>
                        <Badge variant="destructive" className="mt-2">Уволен</Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintEquipment(employee.id, employee.fullName)}
                      >
                        <PrinterCheck className="w-4 h-4 mr-2" />
                        Список техники
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintResponsibility(employee.id, employee.fullName)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Акт ответственности
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Паспортные данные */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Паспортные данные:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Серия и номер:</span>
                        <p>{employee.passportSeries} {employee.passportNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Дата выдачи:</span>
                        <p>{employee.passportDate}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Адрес:</span>
                        <p>{employee.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Документы о приеме */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Документы о приеме на работу:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Номер приказа:</span>
                        <p>{employee.orderNumber || 'Не указан'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Номер акта мат. ответственности:</span>
                        <p>{employee.responsibilityActNumber || 'Не указан'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Закрепленное имущество */}
                  <div>
                    <h4 className="font-medium mb-2">Закрепленное имущество:</h4>
                    {employee.equipment && employee.equipment.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>№</TableHead>
                              <TableHead>Наименование</TableHead>
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
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Имущество не было закреплено</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Архив пуст</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
