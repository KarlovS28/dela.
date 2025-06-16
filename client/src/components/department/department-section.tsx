import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/employee/employee-avatar";
import { EmployeeCard } from "@/components/employee/employee-card";
import { useAuth } from "@/hooks/use-auth";
import { canCreateEmployee } from "@/lib/auth-utils";
import { Plus } from "lucide-react";
import type { DepartmentWithEmployees } from "@shared/schema";

interface DepartmentSectionProps {
  department: DepartmentWithEmployees;
  onAddEmployee?: () => void;
}

export function DepartmentSection({ department, onAddEmployee }: DepartmentSectionProps) {
  const { user } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const canCreate = user && canCreateEmployee(user.role);

  const handleAddEmployee = () => {
    if (onAddEmployee) {
      onAddEmployee();
    }
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{department.name}</h2>
        {canCreate && (
          <Button onClick={handleAddEmployee}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить сотрудника
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
        {department.employees.map((employee) => (
          <EmployeeAvatar
            key={employee.id}
            employee={employee}
            onClick={() => setSelectedEmployeeId(employee.id)}
          />
        ))}
        
        {department.employees.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            В отделе пока нет сотрудников
          </div>
        )}
      </div>

      {selectedEmployeeId && (
        <EmployeeCard
          employeeId={selectedEmployeeId}
          open={!!selectedEmployeeId}
          onOpenChange={(open) => !open && setSelectedEmployeeId(null)}
        />
      )}
    </div>
  );
}
