import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { housekeepingForecastService } from "@/lib/planning/housekeeping-forecast.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdminOrManager();
  if (auth) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const workplaceId = searchParams.get("workplaceId") ?? "";
    const weekStart = searchParams.get("weekStart") ?? "";

    return NextResponse.json(
      await housekeepingForecastService.getWeek({ workplaceId, weekStart })
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminOrManager();
  if (auth) return auth;

  try {
    const body = await request.json();
    return NextResponse.json(
      await housekeepingForecastService.saveWeek({
        workplaceId: body.workplaceId,
        weekStart: body.weekStart,
        lines: Array.isArray(body.lines) ? body.lines : [],
      })
    );
  } catch (error) {
    return handleError(error);
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

function handleError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";
  return NextResponse.json({ error: message }, { status: 400 });
}
