import { NextResponse } from "next/server";
import { restaurantCoverageRuleService } from "@/lib/planning/restaurant-coverage-rule.service";
import { getRequestContext } from "@/lib/auth/getRequestContext";

export async function GET() {
  const ctx = await getRequestContext();

  if (!ctx.userId || ctx.userId === "system-anonymous") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.isActive) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rules = await restaurantCoverageRuleService.list();

  return NextResponse.json(rules);
}

export async function POST(req: Request) {
  const ctx = await getRequestContext();

  if (!ctx.userId || ctx.userId === "system-anonymous") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.isActive) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  try {
    const rule = await restaurantCoverageRuleService.create({
      workplaceId: body.workplaceId,
      serviceType: body.serviceType,
      ratioCoversPerEmployee: body.ratioCoversPerEmployee,
      validFrom: new Date(body.validFrom),
      validTo: new Date(body.validTo),
      isActive: body.isActive,
    });

    return NextResponse.json(rule);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error creating rule" },
      { status: 400 }
    );
  }
}