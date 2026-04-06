import { UserRole } from "@prisma/client"

export type CanManageEmployeeInput = {
  role: UserRole
  currentEmployeeId?: string | null
  targetEmployeeId: string
  isDirectManager?: boolean
}

export type CanManageEmployeeResult = {
  allowed: boolean
  reason?: string
}

export function canManageEmployee({
  role,
  currentEmployeeId,
  targetEmployeeId,
  isDirectManager = false,
}: CanManageEmployeeInput): CanManageEmployeeResult {
  if (role === UserRole.ADMIN) {
    return { allowed: true }
  }

  if (!currentEmployeeId) {
    return {
      allowed: false,
      reason: "Current user is not linked to an employee",
    }
  }

  if (currentEmployeeId === targetEmployeeId) {
    return { allowed: true }
  }

  if (role === UserRole.MANAGER && isDirectManager) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: "Not enough permissions to manage target employee",
  }
}