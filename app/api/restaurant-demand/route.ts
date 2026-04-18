import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { restaurantDemandService } from "@/lib/planning/restaurant-demand.service";

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
    const demand = await restaurantDemandService.calculateDailyDemand({
      workplaceId: body.workplaceId,
      date: new Date(body.date),
      breakfastCovers: body.breakfastCovers,
      lunchCovers: body.lunchCovers,
      dinnerCovers: body.dinnerCovers,
    });

    return NextResponse.json(demand);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error calculating restaurant demand" },
      { status: 400 }
    );
  }
}