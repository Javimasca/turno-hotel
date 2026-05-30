import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { roomTypeService } from "@/lib/room-types/room-type.service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    return NextResponse.json(await roomTypeService.update(id, body));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth) return auth;

  try {
    const { id } = await params;
    await roomTypeService.remove(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

async function requireAdmin() {
  const ctx = await getRequestContext();
  if (!ctx.userId || ctx.userId === "system-anonymous") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ctx.isActive || ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

function handleError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";
  return NextResponse.json({ error: message }, { status: 400 });
}
