
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmployeeCard } from "./employee-card";
import { Archive, Eye } from "lucide-react";
import type { EmployeeWithEquipment } from "@shared/schema";

export function ArchivedEmployees() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const { data: archivedEmployees, isLoading } = useQuery<EmployeeWithEquipment[]>({
    queryKey: ["/api/employees/archived"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Архив уволенных сотрудников
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Архив уволенных сотрудников ({archivedEmployees?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archivedEmployees && archivedEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ФИО</TableHead>
                    <TableHead>Должность</TableHead>
                    <TableHead>Отдел</TableHead>
                    <TableHead>Приказ о приеме</TableHead>
                    <TableHead>Акт мат. ответственности</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.fullName}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department?.name || "Не указан"}</TableCell>
                      <TableCell>{employee.orderNumber || "Не указан"}</TableCell>
                      <TableCell>{employee.responsibilityActNumber || "Не указан"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmployeeId(employee.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Просмотр
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>В архиве нет уволенных сотрудников</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmployeeId && (
        <EmployeeCard
          employeeId={selectedEmployeeId}
          open={!!selectedEmployeeId}
          onOpenChange={(open) => !open && setSelectedEmployeeId(null)}
        />
      )}
    </>
  );
}
