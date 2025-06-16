import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar } from "lucide-react";
import EmployeeCard from "./employee-card";
import type { EmployeeWithEquipment } from "@shared/schema";

export default function ArchivedEmployees() {
  const { data: archivedEmployees, isLoading, error } = useQuery<EmployeeWithEquipment[]>({
    queryKey: ["/api/employees/archived"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Архив уволенных сотрудников
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Архив уволенных сотрудников
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Ошибка загрузки архива</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Архив уволенных сотрудников
          <Badge variant="secondary" className="ml-2">
            {archivedEmployees?.length || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!archivedEmployees || archivedEmployees.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Архив пуст</p>
            <p className="text-sm text-gray-400">Уволенные сотрудники будут отображаться здесь</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {archivedEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                isArchived={true}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}