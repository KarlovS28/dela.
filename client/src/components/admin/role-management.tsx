import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Role, Permission, RoleWithPermissions } from "@shared/schema";

interface RoleManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleManagement({ open, onOpenChange }: RoleManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    displayName: "",
    description: "",
  });

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    enabled: open,
  });

  // Fetch permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
    enabled: open,
  });

  // Fetch role details with permissions
  const { data: roleDetails } = useQuery<RoleWithPermissions>({
    queryKey: ["/api/roles", selectedRole?.id],
    enabled: !!selectedRole?.id,
  });

  // Create role mutation
  const createRole = useMutation({
    mutationFn: async (roleData: typeof newRole) => {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(roleData),
      });
      if (!response.ok) throw new Error("Failed to create role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowCreateRole(false);
      setNewRole({ name: "", displayName: "", description: "" });
      toast({
        title: "Успешно",
        description: "Роль создана",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать роль",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRole = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setSelectedRole(null);
      toast({
        title: "Успешно",
        description: "Роль удалена",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить роль",
        variant: "destructive",
      });
    },
  });

  // Assign/remove permission mutations
  const togglePermission = useMutation({
    mutationFn: async ({ roleId, permissionId, assign }: { roleId: number; permissionId: number; assign: boolean }) => {
      const method = assign ? "POST" : "DELETE";
      const response = await fetch(`/api/roles/${roleId}/permissions/${permissionId}`, {
        method,
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to ${assign ? 'assign' : 'remove'} permission`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", selectedRole?.id] });
      toast({
        title: "Успешно",
        description: "Разрешения обновлены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить разрешения",
        variant: "destructive",
      });
    },
  });

  const groupedPermissions = permissions?.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>) || {};

  const hasPermission = (permissionId: number) => {
    return roleDetails?.permissions.some(p => p.id === permissionId) || false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Управление ролями и разрешениями
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Список ролей */}
          <div className="w-1/3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Роли</h3>
              <Button
                size="sm"
                onClick={() => setShowCreateRole(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {rolesLoading ? (
              <div className="text-center py-4">Загрузка...</div>
            ) : (
              <div className="space-y-2">
                {roles?.map((role) => (
                  <Card
                    key={role.id}
                    className={`cursor-pointer transition-colors ${
                      selectedRole?.id === role.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{role.displayName}</h4>
                          <p className="text-sm text-muted-foreground">{role.name}</p>
                          {role.isSystemRole && (
                            <Badge variant="outline" className="mt-1">
                              Системная
                            </Badge>
                          )}
                        </div>
                        {!role.isSystemRole && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRole.mutate(role.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Разрешения для выбранной роли */}
          <div className="flex-1">
            {selectedRole ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">
                    Разрешения для роли: {selectedRole.displayName}
                  </h3>
                </div>

                {permissionsLoading ? (
                  <div className="text-center py-4">Загрузка...</div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                      <Card key={category}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm capitalize">{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {categoryPermissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={hasPermission(permission.id)}
                                  onCheckedChange={(checked) => {
                                    togglePermission.mutate({
                                      roleId: selectedRole.id,
                                      permissionId: permission.id,
                                      assign: !!checked,
                                    });
                                  }}
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`permission-${permission.id}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {permission.displayName}
                                  </label>
                                  {permission.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Выберите роль для настройки разрешений</p>
              </div>
            )}
          </div>
        </div>

        {/* Диалог создания роли */}
        <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую роль</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Системное имя</Label>
                <Input
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="role-name"
                />
              </div>
              <div>
                <Label>Отображаемое имя</Label>
                <Input
                  value={newRole.displayName}
                  onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                  placeholder="Название роли"
                />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Описание роли"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => createRole.mutate(newRole)}
                  disabled={!newRole.name || !newRole.displayName}
                >
                  Создать
                </Button>
                <Button variant="outline" onClick={() => setShowCreateRole(false)}>
                  Отменить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}