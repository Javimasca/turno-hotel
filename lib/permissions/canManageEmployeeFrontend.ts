export type FrontendUserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export type FrontendPermissionUser = {
  userId: string;
  role: FrontendUserRole;
  employeeId: string | null;
  isActive: boolean;
};

export type FrontendManageableEmployee = {
  id: string;
  directManagerEmployeeId: string | null;
};

export function canManageEmployeeFrontend(
  currentUser: FrontendPermissionUser | null | undefined,
  targetEmployee: FrontendManageableEmployee | null | undefined
): boolean {
  if (!currentUser || !currentUser.isActive || !targetEmployee) {
    return false;
  }

  if (currentUser.role === "ADMIN") {
    return true;
  }

  if (!currentUser.employeeId) {
    return false;
  }

  if (currentUser.employeeId === targetEmployee.id) {
    return true;
  }

  if (
    currentUser.role === "MANAGER" &&
    targetEmployee.directManagerEmployeeId === currentUser.employeeId
  ) {
    return true;
  }

  return false;
}

export function canManageShiftsForEmployeeFrontend(
  currentUser: FrontendPermissionUser | null | undefined,
  targetEmployee: FrontendManageableEmployee | null | undefined
): boolean {
  if (!currentUser || !currentUser.isActive) {
    return false;
  }

  if (currentUser.role === "EMPLOYEE") {
    return false;
  }

  return canManageEmployeeFrontend(currentUser, targetEmployee);
}

export function canCreateAbsenceForEmployeeFrontend(
  currentUser: FrontendPermissionUser | null | undefined,
  targetEmployee: FrontendManageableEmployee | null | undefined
): boolean {
  return canManageEmployeeFrontend(currentUser, targetEmployee);
}

export function canInteractWithEmployeeRowFrontend(
  currentUser: FrontendPermissionUser | null | undefined,
  targetEmployee: FrontendManageableEmployee | null | undefined
): boolean {
  return canManageEmployeeFrontend(currentUser, targetEmployee);
}