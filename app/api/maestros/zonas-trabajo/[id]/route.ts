import { NextRequest, NextResponse } from "next/server";

import { workAreaService } from "@/lib/work-areas/work-area.service";

function parseInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const workArea = await workAreaService.getById(params.id);

    return NextResponse.json(workArea);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Zona de trabajo no encontrada.";

    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    const updated = await workAreaService.update(params.id, {
      ...(typeof body.code === "string" ? { code: body.code } : {}),
      ...(typeof body.name === "string" ? { name: body.name } : {}),
      ...(typeof body.description === "string" || body.description === null
        ? { description: body.description }
        : {}),
      ...(body.displayOrder !== undefined
        ? { displayOrder: parseInteger(body.displayOrder) }
        : {}),
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar la zona de trabajo.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await workAreaService.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar la zona de trabajo.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}