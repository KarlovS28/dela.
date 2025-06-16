import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, User, Users, MapPin, Calendar, Hash, UserX, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { EmployeeWithEquipment } from "@shared/schema";

interface EmployeeCardProps {
  employee: EmployeeWithEquipment;
  isArchived?: boolean;
}

export default function EmployeeCard({ employee, isArchived = false }: EmployeeCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Определяем права пользователя
  const canEdit = user?.role === "admin" || user?.role === "sysadmin";
  const canViewSensitive = user?.role === "admin" || user?.role === "sysadmin" || user?.role === "office-manager";

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/employees/${id}/archive`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to archive employee");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsDialogOpen(false);
    },
  });

  const handleArchiveEmployee = () => {
    if (confirm("Вы уверены, что хотите уволить этого сотрудника? Это действие приведет к автоматической генерации документов увольнения.")) {
      archiveMutation.mutate(employee.id);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Здесь будет логика загрузки фото
      console.log("Uploading photo:", file);
    }
  };

  const handlePrintResponsibilityAct = async () => {
    try {
      const response = await fetch(`/api/docx/responsibility-act/${employee.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `akt-otvetstvennosti-${employee.fullName}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading responsibility act:", error);
    }
  };

  const handleTermination = async () => {
    if (!confirm("Вы уверены, что хотите уволить этого сотрудника?")) return;

    try {
      // Архивируем сотрудника
      await archiveMutation.mutateAsync(employee.id);

      // Автоматически генерируем обходной лист
      const response = await fetch(`/api/docx/termination-checklist/${employee.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `obhodnoy-list-${employee.fullName}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error during termination:", error);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <img
                    src={employee.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
                    alt={employee.fullName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  {canEdit && !isArchived && (
                    <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600">
                      <Upload className="h-3 w-3" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm">{employee.fullName}</h3>
                  <p className="text-xs text-gray-600">{employee.position}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {employee.grade}
                  </Badge>
                  {employee.department && (
                    <p className="text-xs text-gray-500 mt-1">{employee.department.name}</p>
                  )}
                </div>
              </div>
            </div>
          </DialogTrigger>

          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Карточка сотрудника
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Основная информация */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={employee.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
                    alt={employee.fullName}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{employee.fullName}</h2>
                    <p className="text-gray-600">{employee.position}</p>
                    <Badge variant="outline">{employee.grade}</Badge>
                  </div>
                </div>

                {/* Паспортные данные - только для админа и офис-менеджера */}
                {canViewSensitive && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Паспортные данные
                    </h3>
                    <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                      {employee.passportSeries && employee.passportNumber && (
                        <p><span className="font-medium">Серия и номер:</span> {employee.passportSeries} {employee.passportNumber}</p>
                      )}
                      {employee.passportIssuedBy && (
                        <p><span className="font-medium">Кем выдан:</span> {employee.passportIssuedBy}</p>
                      )}
                      {employee.passportDate && (
                        <p><span className="font-medium">Дата выдачи:</span> {employee.passportDate}</p>
                      )}
                      {employee.address && (
                        <p className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-1" />
                          <span>{employee.address}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Документы - только для админа */}
                {user?.role === "admin" && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Документы
                    </h3>
                    <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                      {employee.orderNumber && (
                        <p><span className="font-medium">Приказ о приеме:</span> {employee.orderNumber}</p>
                      )}
                      {employee.orderDate && (
                        <p><span className="font-medium">Дата приказа:</span> {employee.orderDate}</p>
                      )}
                      {employee.responsibilityActNumber && (
                        <p><span className="font-medium">Акт мат. ответственности:</span> {employee.responsibilityActNumber}</p>
                      )}
                      {employee.responsibilityActDate && (
                        <p><span className="font-medium">Дата акта:</span> {employee.responsibilityActDate}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Оборудование */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Закрепленное оборудование
                </h3>

                {employee.equipment && employee.equipment.length > 0 ? (
                  <div className="border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Наименование</TableHead>
                          <TableHead>Инв. номер</TableHead>
                          <TableHead>Стоимость</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employee.equipment.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.inventoryNumber}</TableCell>
                            <TableCell>{item.cost || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Оборудование не закреплено</p>
                )}

                {/* Действия - только для админа */}
                {canEdit && !isArchived && (
                  <div className="space-y-2 pt-4">
                    <Button
                      onClick={handlePrintResponsibilityAct}
                      variant="outline"
                      className="w-full"
                      disabled={!employee.equipment || employee.equipment.length === 0}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Печать акта мат. ответственности
                    </Button>

                    <Button
                      onClick={handleTermination}
                      variant="destructive"
                      className="w-full"
                      disabled={archiveMutation.isPending}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      {archiveMutation.isPending ? "Увольнение..." : "Увольнение"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}