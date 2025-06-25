
import { useAuth } from "./use-auth";

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    
    // Админ имеет все разрешения
    if (user.role === 'admin') return true;
    
    // В реальном приложении здесь была бы проверка через API
    // Для демонстрации используем простую логику на основе ролей
    switch (permissionName) {
      case 'documents.view_passport':
        return ['admin', 'accountant'].includes(user.role);
      case 'employees.view':
        return ['admin', 'accountant', 'sysadmin', 'office-manager'].includes(user.role);
      case 'employees.create':
        return ['admin', 'sysadmin'].includes(user.role);
      case 'employees.edit':
        return ['admin', 'accountant', 'sysadmin'].includes(user.role);
      case 'equipment.manage':
        return ['admin', 'sysadmin', 'office-manager'].includes(user.role);
      default:
        return false;
    }
  };

  const canViewPassportData = hasPermission('documents.view_passport');

  return {
    hasPermission,
    canViewPassportData
  };
}
