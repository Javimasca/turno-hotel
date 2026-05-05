import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { restaurantShiftGeneratorService } from "@/lib/planning/restaurant-shift-generator.service";

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

  const body = await req.json();

  if (!body.workplaceId || !body.departmentId || !body.date) {
    return NextResponse.json(
      { error: "Faltan datos obligatorios" },
      { status: 400 }
    );
  }

  try {
    const proposal =
      await restaurantShiftGeneratorService.generateDailyProposal({
        workplaceId: body.workplaceId,
        departmentId: body.departmentId,
        date: new Date(body.date),
        breakfastCovers: Number(body.breakfastCovers ?? 0),
        lunchCovers: Number(body.lunchCovers ?? 0),
        dinnerCovers: Number(body.dinnerCovers ?? 0),
      });

    return NextResponse.json(proposal);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error generating restaurant shift proposal" },
      { status: 400 }
    );
  }
}