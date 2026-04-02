import { NextRequest, NextResponse } from "next/server";
import type { ShiftMasterType } from "@prisma/client";
import { shiftMasterService } from "@/lib/shift-masters/shift-master.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const workplaceId = searchParams.get("workplaceId");
    const departmentId = searchParams.get("departmentId");

    const shiftMasters = departmentId
      ? await shiftMasterService.getByDepartment(departmentId)
      : workplaceId
      ? await shiftMasterService.getByWorkplace(workplaceId)
      : await shiftMasterService.getAll();

    return NextResponse.json(shiftMasters);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const shiftMaster = await shiftMasterService.create({
      code: body.code,
      name: body.name,
      description: body.description ?? null,
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

    return NextResponse.json(shiftMaster, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";

  return NextResponse.json({ error: message }, { status: 400 });
}