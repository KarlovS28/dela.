
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Department, InsertEmployee } from "@shared/schema";

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEmployeeModal({ open, onOpenChange }: AddEmployeeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<InsertEmployee>>({
    fullName: "",
    position: "",
    grade: "Junior",
    departmentId: undefined,
    photoUrl: "",
    passportSeries: "",
    passportNumber: "",
    passportDate: "",
    address: "",
    orderNumber: "",
    responsibilityActNumber: ""
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      onOpenChange(false);
      setFormData({
        fullName: "",
        position: "",
        grade: "Junior",
        departmentId: undefined,
        photoUrl: "",
        passportSeries: "",
        passportNumber: "",
        passportDate: "",
        address: "",
        orderNumber: "",
        responsibilityActNumber: ""
      });
      toast({
        title: "Успешно",
        description: "Сотрудник добавлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить сотрудника",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.position || !formData.departmentId) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля",
        variant: "destructive",
      });
      return;
    }

    createEmployeeMutation.mutate(formData as InsertEmployee);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить сотрудника</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">ФИО *</Label>
              <Input
                id="fullName"
                value={formData.fullName || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="position">Должность *</Label>
              <Input
                id="position"
                value={formData.position || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="grade">Уровень</Label>
              <Select
                value={formData.grade || "Junior"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Middle">Middle</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="department">Отдел *</Label>
              <Select
                value={formData.departmentId?.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите отдел" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map(dept => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="photoUrl">URL фото</Label>
              <Input
                id="photoUrl"
                value={formData.photoUrl || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="passportSeries">Серия паспорта</Label>
              <Input
                id="passportSeries"
                value={formData.passportSeries || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, passportSeries: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="passportNumber">Номер паспорта</Label>
              <Input
                id="passportNumber"
                value={formData.passportNumber || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, passportNumber: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="passportDate">Дата выдачи паспорта</Label>
              <Input
                id="passportDate"
                value={formData.passportDate || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, passportDate: e.target.value }))}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="orderNumber">Номер приказа о приеме</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="responsibilityActNumber">Номер акта мат. ответственности</Label>
              <Input
                id="responsibilityActNumber"
                value={formData.responsibilityActNumber || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, responsibilityActNumber: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={createEmployeeMutation.isPending}>
              {createEmployeeMutation.isPending ? "Добавление..." : "Добавить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
