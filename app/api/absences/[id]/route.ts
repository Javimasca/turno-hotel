import { NextRequest, NextResponse } from "next/server";
import { AbsenceStatus, AbsenceUnit } from "@prisma/client";
import { absenceService } from "../absence.service";
import { getRequestContext } from "@/lib/auth/getRequestContext";

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
    const ctx = await getRequestContext();

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
      if (body.startMinutes === null) {
        payload.startMinutes = null;
      } else {
        const parsed = parseOptionalNumber(body.startMinutes);

        if (parsed === undefined) {
          return NextResponse.json(
            { error: "startMinutes debe ser un número válido." },
            { status: 400 }
          );
        }

        payload.startMinutes = parsed;
      }
    }

    if (body.endMinutes !== undefined) {
      if (body.endMinutes === null) {
        payload.endMinutes = null;
      } else {
        const parsed = parseOptionalNumber(body.endMinutes);

        if (parsed === undefined) {
          return NextResponse.json(
            { error: "endMinutes debe ser un número válido." },
            { status: 400 }
          );
        }

        payload.endMinutes = parsed;
      }
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

    const result = await absenceService.update(id, payload, ctx);

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
  const ctx = await getRequestContext();

  const result = await absenceService.delete(id, ctx);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 }
    );
  }

  return NextResponse.json(result.data);
}