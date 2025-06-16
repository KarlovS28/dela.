import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DepartmentSection } from "@/components/department/department-section";
import { AddEmployeeModal } from "@/components/employee/add-employee-modal";
import { ExcelExport } from "@/components/export/excel-export";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { canAddEmployee } from "@/lib/auth-utils";
import { Archive, Users } from "lucide-react";
import type { DepartmentWithEmployees } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [showArchived, setShowArchived] = useState(false);

  const { data: departments, isLoading } = useQuery<DepartmentWithEmployees[]>({
    queryKey: ["/api/departments"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Filter departments based on archive status
  const filteredDepartments = departments?.map(department => ({
    ...department,
    employees: department.employees.filter(employee => 
      showArchived ? employee.isArchived : !employee.isArchived
    )
  })).filter(department => department.employees.length > 0);

  const archivedCount = departments?.reduce((total, dept) => 
    total + dept.employees.filter(emp => emp.isArchived).length, 0
  ) || 0;

  const activeCount = departments?.reduce((total, dept) => 
    total + dept.employees.filter(emp => !emp.isArchived).length, 0
  ) || 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Управление сотрудниками</h1>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={!showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(false)}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Активные сотрудники
              <Badge variant="secondary">{activeCount}</Badge>
            </Button>
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(true)}
              className="flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              Архив (уволенные)
              <Badge variant="secondary">{archivedCount}</Badge>
            </Button>
          </div>

          <div className="flex gap-2 ml-auto">
            {canAddEmployee(user?.role) && <AddEmployeeModal />}
            <ExcelExport />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredDepartments?.length > 0 ? (
          filteredDepartments.map((department) => (
            <DepartmentSection
              key={department.id}
              department={department}
              showArchived={showArchived}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {showArchived 
              ? "Нет уволенных сотрудников" 
              : "Нет активных сотрудников"}
          </div>
        )}
      </div>
    </main>
  );
}