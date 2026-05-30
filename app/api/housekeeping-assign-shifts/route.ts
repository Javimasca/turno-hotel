import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { housekeepingShiftAssignmentService } from "@/lib/planning/housekeeping-shift-assignment.service";

export async function POST(request: Request) {
  const ctx = await getRequestContext();

  if (!ctx.userId || ctx.userId === "system-anonymous") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.isActive || (ctx.role !== "ADMIN" && ctx.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    return NextResponse.json(
      await housekeepingShiftAssignmentService.assignWeek({
        workplaceId: body.workplaceId,
        departmentId: body.departmentId,
        weekStart: body.weekStart,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
