import { NextRequest, NextResponse } from "next/server";
import { workAreaService } from "@/lib/work-areas/work-area.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const departmentId = searchParams.get("departmentId");
    const isActiveParam = searchParams.get("isActive");

    const workAreas = await workAreaService.list({
      departmentId: departmentId || undefined,
      isActive:
        isActiveParam === null ? true : isActiveParam === "true",
    });

    return NextResponse.json(workAreas);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ha ocurrido un error inesperado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}