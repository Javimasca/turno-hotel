import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { housekeepingAssignmentPreviewService } from "@/lib/planning/housekeeping-assignment-preview.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdminOrManager();
  if (auth) return auth;

  try {
    const { searchParams } = new URL(request.url);
    return NextResponse.json(
      await housekeepingAssignmentPreviewService.getWeek({
        workplaceId: searchParams.get("workplaceId") ?? "",
        departmentId: searchParams.get("departmentId") ?? "",
        weekStart: searchParams.get("weekStart") ?? "",
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function requireAdminOrManager() {
  const ctx = await getRequestContext();
  if (!ctx.userId || ctx.userId === "system-anonymous") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ctx.isActive || (ctx.role !== "ADMIN" && ctx.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
