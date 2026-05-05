import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  dateOnlyToLocalEndOfDay,
  dateOnlyToLocalStartOfDay,
  dateOnlyToUtcNoonDate,
  formatDateOnly,
  parseDateOnly,
  type DateOnly,
} from "@/lib/date-only";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const employeeId = searchParams.get("employeeId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let normalizedStartDate: DateOnly;
  let normalizedEndDate: DateOnly;

  try {
    normalizedStartDate = parseDateOnly(startDate, "startDate");
    normalizedEndDate = parseDateOnly(endDate, "endDate");
  } catch {
    return NextResponse.json(
      { error: "startDate y endDate deben tener formato YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const blocks = await prisma.employeeAvailabilityBlock.findMany({
  where: {
    ...(employeeId ? { employeeId } : {}),
    date: {
      gte: dateOnlyToLocalStartOfDay(normalizedStartDate),
      lte: dateOnlyToLocalEndOfDay(normalizedEndDate),
    },
  },
    orderBy: [{ date: "asc" }, { startAt: "asc" }],
  });

  return NextResponse.json(
    blocks.map((block) => ({
      ...block,
      date: formatDateOnly(block.date),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const employeeId = body.employeeId;
  const date = body.date;
  const startAt = body.startAt ?? null;
  const endAt = body.endAt ?? null;
  const type = body.type ?? "DAY_OFF";
  const reason = body.reason ?? null;

  let normalizedDate: DateOnly;

  try {
    normalizedDate = parseDateOnly(date, "date");
  } catch {
    return NextResponse.json(
      { error: "employeeId es obligatorio y date debe tener formato YYYY-MM-DD." },
      { status: 400 }
    );
  }

  if (!employeeId) {
    return NextResponse.json(
      { error: "employeeId es obligatorio." },
      { status: 400 }
    );
  }

  const block = await prisma.employeeAvailabilityBlock.create({
    data: {
      employeeId,
      date: dateOnlyToUtcNoonDate(normalizedDate),
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      type,
      reason,
    },
  });

  return NextResponse.json(
    {
      ...block,
      date: formatDateOnly(block.date),
    },
    { status: 201 }
  );
}
