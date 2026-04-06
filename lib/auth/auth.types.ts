import type { UserRole } from "@prisma/client";

export type RequestContext = {
  userId: string;
  role: UserRole;
  employeeId: string | null;
  isActive: boolean;
};

export type DevAuthUser = {
  userId: string;
  role: UserRole;
  employeeId: string | null;
  isActive: boolean;
};