import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { DepartmentSection } from "@/components/department/department-section";
import { Skeleton } from "@/components/ui/skeleton";
import type { DepartmentWithEmployees } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { AddEmployeeModal } from "@/components/employee/add-employee-modal";
import { ArchivedEmployees } from "@/components/employee/archived-employees";
import { canViewAllPersonalData } from "@/lib/auth-utils";

export default function Home() {
  const { data: departments, isLoading, error } = useQuery<DepartmentWithEmployees[]>({
    queryKey: ["/api/departments"],
  });
  const { user } = useAuth();
  const [showAddEmployeeModal, setShowAddEmployeeModal] = React.useState(false);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Ошибка загрузки данных</h2>
            <p className="text-muted-foreground">Попробуйте обновить страницу</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-12">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex flex-col items-center space-y-3">
                      <Skeleton className="w-20 h-20 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          departments?.map((department) => (
            <DepartmentSection 
              key={department.id} 
              department={department}
              onAddEmployee={() => setShowAddEmployeeModal(true)}
            />
          ))
        )}

        {/* Archived Employees Section - Only visible to admin and accountant */}
        {user && canViewAllPersonalData(user.role) && (
          <div className="mt-8">
            <ArchivedEmployees />
          </div>
        )}
      </main>

      <AddEmployeeModal
        open={showAddEmployeeModal}
        onOpenChange={setShowAddEmployeeModal}
      />
    </div>
  );
}