import { NextRequest, NextResponse } from "next/server";
import { departmentService } from "@/lib/departments/department.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workplaceId = searchParams.get("workplaceId");

    const departments = await departmentService.list({
      workplaceId: workplaceId || undefined,
      isActive: true,
    });

    return NextResponse.json(departments);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ha ocurrido un error inesperado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}