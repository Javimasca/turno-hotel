import { NextRequest, NextResponse } from "next/server";
import { absenceService } from "./absence.service";
import { AbsenceStatus, AbsenceUnit } from "@prisma/client";

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

export async function GET() {
  const result = await absenceService.list();

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 }
    );
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.employeeId) {
      return NextResponse.json(
        { error: "employeeId es obligatorio." },
        { status: 400 }
      );
    }

    if (!body.absenceTypeId) {
      return NextResponse.json(
        { error: "absenceTypeId es obligatorio." },
        { status: 400 }
      );
    }

    if (!body.unit || !isAbsenceUnit(body.unit)) {
      return NextResponse.json(
        { error: "unit debe ser FULL_DAY o HOURLY." },
        { status: 400 }
      );
    }

    const startDate = parseDate(body.startDate);
    const endDate = parseDate(body.endDate);

    if (!startDate) {
      return NextResponse.json(
        { error: "startDate es obligatorio y debe ser válido." },
        { status: 400 }
      );
    }

    if (!endDate) {
      return NextResponse.json(
        { error: "endDate es obligatorio y debe ser válido." },
        { status: 400 }
      );
    }

    if (body.status && !isAbsenceStatus(body.status)) {
      return NextResponse.json(
        { error: "status no es válido." },
        { status: 400 }
      );
    }

    const result = await absenceService.create({
      employeeId: body.employeeId,
      absenceTypeId: body.absenceTypeId,
      unit: body.unit,
      startDate,
      endDate,
      startMinutes:
        body.startMinutes == null ? undefined : Number(body.startMinutes),
      endMinutes: body.endMinutes == null ? undefined : Number(body.endMinutes),
      status: body.status,
      notes: body.notes,
      documentUrl: body.documentUrl,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la petición." },
      { status: 400 }
    );
  }
}