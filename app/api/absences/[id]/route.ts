import { NextRequest, NextResponse } from "next/server";
import { absenceService } from "../absence.service";
import { AbsenceStatus, AbsenceUnit } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function isAbsenceUnit(value: string): value is AbsenceUnit {
  return value === "FULL_DAY" || value === "HOURLY";
}

function isAbsenceStatus(value: string): value is AbsenceStatus {
  return (
    value === "PENDING" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "CANCELLED"
  );
}

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await absenceService.getById(id);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 404 }
    );
  }

  return NextResponse.json(result.data);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const payload: {
      employeeId?: string;
      absenceTypeId?: string;
      unit?: AbsenceUnit;
      startDate?: Date;
      endDate?: Date;
      startMinutes?: number | null;
      endMinutes?: number | null;
      status?: AbsenceStatus;
      notes?: string | null;
      documentUrl?: string | null;
    } = {};

    if (body.employeeId !== undefined) payload.employeeId = body.employeeId;
    if (body.absenceTypeId !== undefined) {
      payload.absenceTypeId = body.absenceTypeId;
    }

    if (body.unit !== undefined) {
      if (!isAbsenceUnit(body.unit)) {
        return NextResponse.json(
          { error: "unit debe ser FULL_DAY o HOURLY." },
          { status: 400 }
        );
      }
      payload.unit = body.unit;
    }

    if (body.startDate !== undefined) {
      const parsed = parseDate(body.startDate);
      if (!parsed) {
        return NextResponse.json(
          { error: "startDate no es válida." },
          { status: 400 }
        );
      }
      payload.startDate = parsed;
    }

    if (body.endDate !== undefined) {
      const parsed = parseDate(body.endDate);
      if (!parsed) {
        return NextResponse.json(
          { error: "endDate no es válida." },
          { status: 400 }
        );
      }
      payload.endDate = parsed;
    }

    if (body.startMinutes !== undefined) {
      payload.startMinutes =
        body.startMinutes == null ? null : Number(body.startMinutes);
    }

    if (body.endMinutes !== undefined) {
      payload.endMinutes =
        body.endMinutes == null ? null : Number(body.endMinutes);
    }

    if (body.status !== undefined) {
      if (!isAbsenceStatus(body.status)) {
        return NextResponse.json(
          { error: "status no es válido." },
          { status: 400 }
        );
      }
      payload.status = body.status;
    }

    if (body.notes !== undefined) payload.notes = body.notes;
    if (body.documentUrl !== undefined) payload.documentUrl = body.documentUrl;

    const result = await absenceService.update(id, payload);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la petición." },
      { status: 400 }
    );
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await absenceService.delete(id);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 404 }
    );
  }

  return NextResponse.json(result.data);
}