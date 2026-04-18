import { NextResponse } from "next/server";
import { restaurantCoverageRuleService } from "@/lib/planning/restaurant-coverage-rule.service";
import { getRequestContext } from "@/lib/auth/getRequestContext";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const ctx = await getRequestContext();

  if (!ctx.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.user.isActive) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ctx.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rule = await restaurantCoverageRuleService.getById(params.id);

  if (!rule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rule);
}

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await getRequestContext();

  if (!ctx.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.user.isActive) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ctx.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  try {
    const updated = await restaurantCoverageRuleService.update(params.id, {
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

export async function DELETE(_: Request, { params }: Params) {
  const ctx = await getRequestContext();

  if (!ctx.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.user.isActive) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ctx.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await restaurantCoverageRuleService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error deleting rule" },
      { status: 400 }
    );
  }
}