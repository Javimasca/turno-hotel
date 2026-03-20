import { NextRequest, NextResponse } from "next/server";

import { departmentService } from "@/lib/departments/department.service";

function parseBoolean(value: string | null) {
  if (value === null) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const workplaceId = searchParams.get("workplaceId")?.trim() || undefined;
    const isActive = parseBoolean(searchParams.get("isActive"));

    const departments = await departmentService.list({
      ...(workplaceId ? { workplaceId } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    });

    return NextResponse.json(departments);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al obtener los departamentos.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const workplaceId = String(formData.get("workplaceId") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    const rawDescription = String(formData.get("description") ?? "").trim();
    const description = rawDescription.length > 0 ? rawDescription : null;

    const isActive = formData.get("isActive") === "true";

    await departmentService.create({
      workplaceId,
      code,
      name,
      description,
      isActive,
    });

    return NextResponse.redirect(
      new URL("/maestros/departamentos", request.url),
      { status: 303 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear el departamento.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}