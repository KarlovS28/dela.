export function isUnauthorizedError(error: Error): boolean {
  return error.message.includes("401") || error.message.includes("Unauthorized");
}

// Администратор - все права
export function canEditEmployee(userRole: string): boolean {
  return ["admin", "accountant"].includes(userRole);
}

export function canCreateEmployee(userRole: string): boolean {
  return ["admin", "sysadmin"].includes(userRole);
}

export function canArchiveEmployee(userRole: string): boolean {
  return ["admin", "accountant"].includes(userRole);
}

export function canManageUsers(userRole: string): boolean {
  return userRole === "admin";
}

export function canManageDepartments(userRole: string): boolean {
  return userRole === "admin";
}

export const canImportExport = (role: string) => {
  return role === 'admin' || role === 'accountant';
};

export const canViewPassport = (userPermissions: string[]) => {
  return userPermissions.includes('documents.passport');
};

export const canDownloadInventoryReport = (userPermissions: string[]) => {
  return userPermissions.includes('reports.inventory');
};

export const canDownloadEmployeesList = (userPermissions: string[]) => {
  return userPermissions.includes('reports.employees_list');
};

export function canViewAllPersonalData(userRole: string): boolean {
  return ["admin", "accountant"].includes(userRole);
}

// Системный администратор и офис-менеджер - только оборудование
export function canEditEquipment(userRole: string): boolean {
  return ["admin", "sysadmin", "office-manager", "accountant"].includes(userRole);
}

export function canViewEquipmentOnly(userRole: string): boolean {
  return ["sysadmin", "office-manager"].includes(userRole);
}

// Бухгалтер - все кроме управления пользователями
export function canPrintDocuments(userRole: string): boolean {
  return ["admin", "accountant"].includes(userRole);
}

export function canViewArchive(userRole: string): boolean {
  return userRole === "admin";
}