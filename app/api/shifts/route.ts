import { NextRequest, NextResponse } from "next/server";
import { shiftService } from "@/lib/shifts/shift.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const startAtParam = searchParams.get("startAt");
    const endAtParam = searchParams.get("endAt");
    const workplaceId = searchParams.get("workplaceId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const workAreaId = searchParams.get("workAreaId") || undefined;

    if (!startAtParam || !endAtParam) {
      return NextResponse.json(
        { error: "Los parámetros startAt y endAt son obligatorios." },
        { status: 400 }
      );
    }

    const startAt = new Date(startAtParam);
    const endAt = new Date(endAtParam);

    const shifts = await shiftService.getByRange({
      startAt,
      endAt,
      workplaceId,
      departmentId,
      workAreaId,
    });

    return NextResponse.json(shifts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const shift = await shiftService.create({
      employeeId: body.employeeId,
      workplaceId: body.workplaceId,
      departmentId: body.departmentId,
      workAreaId: body.workAreaId ?? null,
      jobCategoryId: body.jobCategoryId ?? null,
      shiftMasterId: body.shiftMasterId ?? null,
      date: body.date ? new Date(body.date) : undefined,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
      status: body.status,
      notes: body.notes ?? null,
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";

  return NextResponse.json({ error: message }, { status: 400 });
}