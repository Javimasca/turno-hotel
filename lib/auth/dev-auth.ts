import type { UserRole } from "@prisma/client";
import type { DevAuthUser } from "./auth.types";

export const DEV_AUTH_COOKIE = "turnohotel_dev_auth";

export function isUserRole(value: string): value is UserRole {
  return value === "ADMIN" || value === "MANAGER" || value === "EMPLOYEE";
}

export function getDefaultDevAuthUser(): DevAuthUser {
  return {
    userId: "dev-admin",
    role: "ADMIN",
    employeeId: null,
    isActive: true,
  };
}

export function parseDevAuthCookie(value?: string | null): DevAuthUser | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<DevAuthUser>;

    if (!parsed.userId || typeof parsed.userId !== "string") return null;
    if (!parsed.role || !isUserRole(parsed.role)) return null;

    return {
      userId: parsed.userId,
      role: parsed.role,
      employeeId:
        typeof parsed.employeeId === "string" && parsed.employeeId.trim().length
          ? parsed.employeeId
          : null,
      isActive: parsed.isActive !== false,
    };
  } catch {
    return null;
  }
}