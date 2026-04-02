import { NextRequest, NextResponse } from "next/server";
import type { ShiftMasterType } from "@prisma/client";
import { shiftMasterService } from "@/lib/shift-masters/shift-master.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const shiftMaster = await shiftMasterService.getById(id);

    if (!shiftMaster) {
      return NextResponse.json(
        { error: "El maestro de turno no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json(shiftMaster);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const shiftMaster = await shiftMasterService.update(id, {
      code: body.code,
      name: body.name,
      description: body.description === undefined ? undefined : body.description,
      workplaceId: body.workplaceId,
      departmentId: body.departmentId,
      type: body.type as ShiftMasterType | undefined,
      startMinute: body.startMinute,
      endMinute: body.endMinute,
      crossesMidnight: body.crossesMidnight,
      isPartial: body.isPartial,
      coversBreakfast: body.coversBreakfast,
      coversLunch: body.coversLunch,
      coversDinner: body.coversDinner,
      countsForRoomAssignment: body.countsForRoomAssignment,
      isActive: body.isActive,
    });

    return NextResponse.json(shiftMaster);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await shiftMasterService.remove(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";

  const status = message === "El maestro de turno no existe." ? 404 : 400;

  return NextResponse.json({ error: message }, { status });
}