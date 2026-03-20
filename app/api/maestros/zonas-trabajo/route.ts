import { NextRequest, NextResponse } from "next/server";

import { workAreaService } from "@/lib/work-areas/work-area.service";

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

function parseInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const departmentId = searchParams.get("departmentId")?.trim() || undefined;
    const isActive = parseBoolean(searchParams.get("isActive"));

    const workAreas = await workAreaService.list({
      ...(departmentId ? { departmentId } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    });

    return NextResponse.json(workAreas);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al obtener las zonas de trabajo.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const departmentId = String(formData.get("departmentId") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    const rawDescription = String(formData.get("description") ?? "").trim();
    const description = rawDescription.length > 0 ? rawDescription : null;

    const rawDisplayOrder = String(formData.get("displayOrder") ?? "").trim();
    const displayOrder = parseInteger(rawDisplayOrder);

    const isActive = formData.get("isActive") === "true";

    await workAreaService.create({
      departmentId,
      code,
      name,
      description,
      displayOrder,
      isActive,
    });

    return NextResponse.redirect(
      new URL(`/maestros/departamentos/${departmentId}/zonas-trabajo`, request.url),
      { status: 303 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear la zona de trabajo.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}