import { cookies, headers } from "next/headers";
import type { RequestContext } from "./auth.types";
import {
  DEV_AUTH_COOKIE,
  getDefaultDevAuthUser,
  isUserRole,
  parseDevAuthCookie,
} from "./dev-auth";

export async function getRequestContext(): Promise<RequestContext> {
  if (process.env.NODE_ENV !== "development") {
    return {
      userId: "system-anonymous",
      role: "EMPLOYEE",
      employeeId: null,
      isActive: false,
    };
  }

  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieValue = cookieStore.get(DEV_AUTH_COOKIE)?.value;
  const cookieUser = parseDevAuthCookie(cookieValue);

  if (cookieUser) {
    return cookieUser;
  }

  const userId = headerStore.get("x-dev-user-id")?.trim() || "dev-admin";
  const rawRole = headerStore.get("x-dev-role")?.trim() || "ADMIN";
  const employeeId = headerStore.get("x-dev-employee-id")?.trim() || null;
  const rawIsActive = headerStore.get("x-dev-is-active")?.trim() || "true";

  if (isUserRole(rawRole)) {
    return {
      userId,
      role: rawRole,
      employeeId,
      isActive: rawIsActive !== "false",
    };
  }

  return getDefaultDevAuthUser();
}