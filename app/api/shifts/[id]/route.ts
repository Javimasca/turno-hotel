import { NextRequest, NextResponse } from "next/server";
import { shiftService } from "@/lib/shifts/shift.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const shift = await shiftService.getById(id);

    if (!shift) {
      return NextResponse.json(
        { error: "El turno no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json(shift);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const shift = await shiftService.update(id, {
      employeeId: body.employeeId,
      workplaceId: body.workplaceId,
      departmentId: body.departmentId,
      jobCategoryId:
        body.jobCategoryId === undefined ? undefined : body.jobCategoryId,
      shiftMasterId:
        body.shiftMasterId === undefined ? undefined : body.shiftMasterId,
      date: body.date ? new Date(body.date) : undefined,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
      status: body.status,
      notes: body.notes === undefined ? undefined : body.notes,
    });

    return NextResponse.json(shift);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await shiftService.remove(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";

  const status = message === "El turno no existe." ? 404 : 400;

  return NextResponse.json({ error: message }, { status });
}