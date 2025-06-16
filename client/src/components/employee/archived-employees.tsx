
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, FileText, PrinterCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmployeeCard from "./employee-card";
import type { EmployeeWithEquipment } from "@shared/schema";

export default function ArchivedEmployees() {
  const { toast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const { data: archivedEmployees, isLoading, error } = useQuery<EmployeeWithEquipment[]>({
    queryKey: ["/api/employees/archived"],
  });

  const handlePrintResponsibilityAct = async (employeeId: number, employeeName: string) => {
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
      a.download = `акт-${employeeName}.docx`;
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

  const handlePrintTermination = async (employeeId: number, employeeName: string) => {
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
      a.download = `обходной-лист-${employeeName}.docx`;
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Архив уволенных сотрудников</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Архив уволенных сотрудников</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Ошибка загрузки архивных данных</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Архив уволенных сотрудников ({archivedEmployees?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!archivedEmployees || archivedEmployees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет уволенных сотрудников
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сотрудник</TableHead>
                    <TableHead>Должность</TableHead>
                    <TableHead>Отдел</TableHead>
                    <TableHead>Грейд</TableHead>
                    <TableHead>Оборудование</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={employee.photoUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {employee.fullName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.fullName}</p>
                            <Badge variant="destructive" className="text-xs">Уволен</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department?.name || 'Не указан'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{employee.grade}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {employee.equipment?.length || 0} ед.
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEmployeeId(employee.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintResponsibilityAct(employee.id, employee.fullName)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintTermination(employee.id, employee.fullName)}
                          >
                            <PrinterCheck className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmployeeId && (
        <EmployeeCard
          employeeId={selectedEmployeeId}
          isOpen={!!selectedEmployeeId}
          onClose={() => setSelectedEmployeeId(null)}
        />
      )}
    </>
  );
}
