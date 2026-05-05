import { NextRequest, NextResponse } from "next/server";
import {
  saveRestaurantShiftProposal,
  getRestaurantShiftProposalsByWeek,
} from "@/services/restaurant-shift-proposal.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { workplaceId, departmentId, weekStart, shifts } = body;

    if (!workplaceId || !departmentId || !weekStart || !Array.isArray(shifts)) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const invalidShift = shifts.find(
  (shift) =>
    !shift?.serviceType ||
    !shift?.workAreaId ||
    !shift?.startAt ||
    !shift?.endAt ||
    typeof shift?.employeesNeeded !== "number" ||
    Number.isNaN(shift?.employeesNeeded)
);

if (invalidShift) {
  return NextResponse.json(
    {
      error: "Hay turnos de propuesta inválidos",
      invalidShift,
    },
    { status: 400 }
  );
}

    await saveRestaurantShiftProposal({
      workplaceId,
      departmentId,
      weekStart,
      shifts,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST restaurante/propuesta]", error);
    return NextResponse.json(
      { error: "Error guardando propuesta" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const workplaceId = searchParams.get("workplaceId");
    const departmentId = searchParams.get("departmentId");
    const weekStart = searchParams.get("weekStart");

    if (!workplaceId || !departmentId || !weekStart) {
      return NextResponse.json(
        { error: "workplaceId, departmentId y weekStart son obligatorios" },
        { status: 400 }
      );
    }

    const shifts = await getRestaurantShiftProposalsByWeek({
      workplaceId,
      departmentId,
      weekStart,
    });

    return NextResponse.json({ ok: true, shifts });
  } catch (error) {
    console.error("[GET restaurante/propuesta]", error);
    return NextResponse.json(
      { error: "Error obteniendo propuesta" },
      { status: 500 }
    );
  }
}