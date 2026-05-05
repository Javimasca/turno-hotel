import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const workplaceId = body.workplaceId;
  const departmentId = body.departmentId;
  const weekStart = body.weekStart;

  if (!workplaceId || !departmentId || !weekStart) {
    return NextResponse.json(
      { error: "workplaceId, departmentId y weekStart son obligatorios" },
      { status: 400 }
    );
  }

  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7);

  const result = await prisma.shift.deleteMany({
    where: {
      workplaceId,
      departmentId,
      startAt: {
        gte: startDate,
        lt: endDate,
      },
      status: "BORRADOR",
      notes: {
        startsWith: "Asignación automática",
      },
    },
  });

  return NextResponse.json({
    deleted: result.count,
  });
}