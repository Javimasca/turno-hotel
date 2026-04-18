import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { restaurantShiftGeneratorService } from "@/lib/planning/restaurant-shift-generator.service";

export async function POST(req: Request) {
  const ctx = await getRequestContext();

  if (!ctx.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.user.isActive) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ctx.user.role !== "ADMIN" && ctx.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  try {
    const proposal =
      await restaurantShiftGeneratorService.generateDailyProposal({
        workplaceId: body.workplaceId,
        departmentId: body.departmentId,
        date: new Date(body.date),
        breakfastCovers: body.breakfastCovers,
        lunchCovers: body.lunchCovers,
        dinnerCovers: body.dinnerCovers,
      });

    return NextResponse.json(proposal);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error generating restaurant shift proposal" },
      { status: 400 }
    );
  }
}