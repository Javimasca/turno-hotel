import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { roomTypeService } from "@/lib/room-types/room-type.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdminOrManager();
  if (auth) return auth;

  const { searchParams } = new URL(request.url);
  const workplaceId = searchParams.get("workplaceId");

  try {
    return NextResponse.json(await roomTypeService.getAll(workplaceId));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminOrManager();
  if (auth) return auth;

  try {
    const body = await request.json();
    const item = await roomTypeService.create(body);
    return NextResponse.json(item, { status: 201 });
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
  const status =
    message.includes("Unique constraint failed") || message.includes("Ya existe")
      ? 409
      : 400;
  return NextResponse.json({ error: message }, { status });
}
