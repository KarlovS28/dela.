
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Activity, User, Package, Building, Archive } from "lucide-react";

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  oldValues?: string;
  newValues?: string;
  description: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
}

const actionLabels: Record<string, string> = {
  create: "Создание",
  update: "Изменение",
  delete: "Удаление",
  archive: "Архивирование"
};

const entityLabels: Record<string, string> = {
  employee: "Сотрудник",
  equipment: "Оборудование",
  user: "Пользователь",
  department: "Отдел"
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  archive: "bg-orange-100 text-orange-800"
};

const entityIcons: Record<string, React.ComponentType<any>> = {
  employee: User,
  equipment: Package,
  department: Building,
  user: User
};

export function AuditLogs() {
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            История изменений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          История изменений
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              История изменений пуста
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const IconComponent = entityIcons[log.entityType] || Activity;
                
                return (
                  <div key={log.id}>
                    <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card">
                      <div className="flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-muted-foreground mt-0.5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            className={actionColors[log.action] || "bg-gray-100 text-gray-800"}
                            variant="secondary"
                          >
                            {actionLabels[log.action] || log.action}
                          </Badge>
                          <Badge variant="outline">
                            {entityLabels[log.entityType] || log.entityType}
                          </Badge>
                        </div>
                        
                        <p className="text-sm font-medium text-foreground mb-1">
                          {log.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Пользователь: {log.user?.fullName || 'Неизвестно'}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(log.createdAt), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </span>
                        </div>

                        {/* Показываем детали изменений для действия "update" */}
                        {log.action === 'update' && log.oldValues && log.newValues && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              Показать детали изменений
                            </summary>
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <strong>Было:</strong>
                                  <pre className="mt-1 whitespace-pre-wrap text-xs">
                                    {JSON.stringify(JSON.parse(log.oldValues), null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <strong>Стало:</strong>
                                  <pre className="mt-1 whitespace-pre-wrap text-xs">
                                    {JSON.stringify(JSON.parse(log.newValues), null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                    
                    {index < logs.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
