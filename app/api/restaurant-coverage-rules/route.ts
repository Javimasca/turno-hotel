import { NextResponse } from "next/server";
import { restaurantCoverageRuleService } from "@/lib/planning/restaurant-coverage-rule.service";
import { getRequestContext } from "@/lib/auth/getRequestContext";

export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const workplaceId = searchParams.get("workplaceId");

  if (!workplaceId) {
    return NextResponse.json(
      { error: "workplaceId is required" },
      { status: 400 }
    );
  }

  const rules = await restaurantCoverageRuleService.list({
    workplaceId,
  });

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
      ratioCoversPerEmployee: Number(body.ratioCoversPerEmployee),
      validFrom: new Date(body.validFrom),
      validTo: body.validTo ? new Date(body.validTo) : null,
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

export async function PATCH(req: Request) {
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
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rule = await restaurantCoverageRuleService.update(body.id, {
      workplaceId: body.workplaceId,
      serviceType: body.serviceType,
      ratioCoversPerEmployee: Number(body.ratioCoversPerEmployee),
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validTo:
        body.validTo === null || body.validTo === ""
          ? null
          : new Date(body.validTo),
      isActive: body.isActive,
    });

    return NextResponse.json(rule);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error updating rule" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const deleted = await restaurantCoverageRuleService.delete(id);
    return NextResponse.json(deleted);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error deleting rule" },
      { status: 400 }
    );
  }
}