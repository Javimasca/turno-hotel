import { NextResponse, type NextRequest } from "next/server";
import { restaurantCoverageRuleService } from "@/lib/planning/restaurant-coverage-rule.service";
import { getRequestContext } from "@/lib/auth/getRequestContext";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;
  const rule = await restaurantCoverageRuleService.getById(id);

  if (!rule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rule);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;
  const body = await req.json();

  try {
    const updated = await restaurantCoverageRuleService.update(id, {
      workplaceId: body.workplaceId,
      serviceType: body.serviceType,
      ratioCoversPerEmployee: body.ratioCoversPerEmployee,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validTo: body.validTo ? new Date(body.validTo) : undefined,
      isActive: body.isActive,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error updating rule" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;

  try {
    await restaurantCoverageRuleService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error deleting rule" },
      { status: 400 }
    );
  }
}