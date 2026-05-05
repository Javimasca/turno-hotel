import { NextRequest, NextResponse } from "next/server";
import { AbsenceStatus, AbsenceUnit } from "@prisma/client";
import { absenceService } from "./absence.service";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { parseDateOnly, type DateOnly } from "@/lib/date-only";
import {
  serializeAbsence,
  serializeAbsences,
} from "@/lib/absences/absence-serializer";

function parseOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) return undefined;

  return parsed;
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
  const ctx = await getRequestContext();

  const result = await absenceService.list(ctx);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 }
    );
  }

  return NextResponse.json(serializeAbsences(result.data));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ctx = await getRequestContext();

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

    let startDate: DateOnly;
    let endDate: DateOnly;

    try {
      startDate = parseDateOnly(body.startDate, "startDate");
      endDate = parseDateOnly(body.endDate, "endDate");
    } catch {
      return NextResponse.json(
        { error: "startDate y endDate deben tener formato YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (body.status && !isAbsenceStatus(body.status)) {
      return NextResponse.json(
        { error: "status no es válido." },
        { status: 400 }
      );
    }

    const startMinutes = parseOptionalNumber(body.startMinutes);
    const endMinutes = parseOptionalNumber(body.endMinutes);

    if (body.startMinutes != null && startMinutes === undefined) {
      return NextResponse.json(
        { error: "startMinutes debe ser un número válido." },
        { status: 400 }
      );
    }

    if (body.endMinutes != null && endMinutes === undefined) {
      return NextResponse.json(
        { error: "endMinutes debe ser un número válido." },
        { status: 400 }
      );
    }

    const result = await absenceService.create(
      {
        employeeId: body.employeeId,
        absenceTypeId: body.absenceTypeId,
        unit: body.unit,
        startDate,
        endDate: body.unit === "HOURLY" ? startDate : endDate,
        startMinutes,
        endMinutes,
        status: body.status,
        notes: body.notes,
        documentUrl: body.documentUrl,
      },
      ctx
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json(serializeAbsence(result.data), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la petición." },
      { status: 400 }
    );
  }
}
