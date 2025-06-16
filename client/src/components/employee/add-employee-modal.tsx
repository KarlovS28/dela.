import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import type { Department } from "@shared/schema";

// Схема валидации для формы добавления сотрудника
const addEmployeeSchema = z.object({
  fullName: z.string().min(1, "ФИО обязательно"),
  position: z.string().min(1, "Должность обязательна"),
  grade: z.string().min(1, "Грейд обязателен"),
  departmentId: z.string().min(1, "Отдел обязателен"),
  photoUrl: z.string().optional(),
  passportSeries: z.string().optional(),
  passportNumber: z.string().optional(),
  passportIssuedBy: z.string().optional(),
  passportDate: z.string().optional(),
  address: z.string().optional(),
  orderNumber: z.string().optional(),
  orderDate: z.string().optional(),
  responsibilityActNumber: z.string().optional(),
  responsibilityActDate: z.string().optional(),
});

type AddEmployeeFormData = z.infer<typeof addEmployeeSchema>;

interface AddEmployeeModalProps {
  departmentId?: number;
  children: React.ReactNode;
}

export function AddEmployeeModal({ departmentId, children }: AddEmployeeModalProps) {
  const [open, setOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загружаем список отделов для выбора
  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const form = useForm<AddEmployeeFormData>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      fullName: "",
      position: "",
      grade: "",
      departmentId: departmentId?.toString() || "",
      photoUrl: "",
      passportSeries: "",
      passportNumber: "",
      passportIssuedBy: "",
      passportDate: "",
      address: "",
      orderNumber: "",
      orderDate: "",
      responsibilityActNumber: "",
      responsibilityActDate: "",
    },
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Мутация для создания сотрудника
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: AddEmployeeFormData) => {
      // Сначала создаем сотрудника
      const response = await fetch("/api/employees", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          departmentId: parseInt(data.departmentId),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Ошибка создания сотрудника");
      }
      
      const employee = await response.json();
      
      // Если есть фото, загружаем его
      if (photoFile && employee.id) {
        const formData = new FormData();
        formData.append("photo", photoFile);
        
        await fetch(`/api/employees/${employee.id}/photo`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      }
      
      return employee;
    },
    onSuccess: () => {
      // Обновляем кэш данных
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      
      toast({
        title: "Успешно",
        description: "Сотрудник добавлен",
      });
      
      // Закрываем модал и сбрасываем форму
      setOpen(false);
      form.reset();
      setPhotoFile(null);
      setPhotoPreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить сотрудника",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddEmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить сотрудника</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Основная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ФИО *</FormLabel>
                    <FormControl>
                      <Input placeholder="Иванов Иван Иванович" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Должность *</FormLabel>
                    <FormControl>
                      <Input placeholder="Менеджер" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Грейд *</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Отдел *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите отдел" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Паспортные данные */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Паспортные данные</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passportSeries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Серия паспорта</FormLabel>
                      <FormControl>
                        <Input placeholder="1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер паспорта</FormLabel>
                      <FormControl>
                        <Input placeholder="567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passportIssuedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Кем выдан</FormLabel>
                      <FormControl>
                        <Input placeholder="РОВД Центрального района" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата выдачи</FormLabel>
                      <FormControl>
                        <Input placeholder="01.01.2020" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Адрес прописки</FormLabel>
                    <FormControl>
                      <Input placeholder="г. Москва, ул. Примерная, д. 1, кв. 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Документы о приеме на работу */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Документы</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер приказа</FormLabel>
                      <FormControl>
                        <Input placeholder="№123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата приказа</FormLabel>
                      <FormControl>
                        <Input placeholder="01.01.2023" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsibilityActNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер акта мат. ответственности</FormLabel>
                      <FormControl>
                        <Input placeholder="№456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsibilityActDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата акта</FormLabel>
                      <FormControl>
                        <Input placeholder="01.01.2023" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL фото</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/photo.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Кнопки действий */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={createEmployeeMutation.isPending}>
                {createEmployeeMutation.isPending ? "Добавление..." : "Добавить"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}