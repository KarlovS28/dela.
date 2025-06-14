export function isUnauthorizedError(error: Error): boolean {
  return error.message.includes("401") || error.message.includes("Unauthorized");
}

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

export function canImportExport(userRole: string): boolean {
  return userRole === "admin";
}

export function canViewAllPersonalData(userRole: string): boolean {
  return ["admin", "accountant"].includes(userRole);
}
