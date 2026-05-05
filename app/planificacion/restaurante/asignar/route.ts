import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { restaurantShiftAssignmentService } from "@/lib/planning/restaurant-shift-assignment.service";

export async function POST(req: Request) {
  const ctx = await getRequestContext();

  if (!ctx.userId || ctx.userId === "system-anonymous") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.isActive) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ctx.role !== "ADMIN" && ctx.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const result =
      await restaurantShiftAssignmentService.assignFromWeeklyProposal(
        {
          workplaceId: body.workplaceId,
          departmentId: body.departmentId,
          weekStart: body.weekStart,
        },
        ctx
      );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error asignando turnos" },
      { status: 400 }
    );
  }
}