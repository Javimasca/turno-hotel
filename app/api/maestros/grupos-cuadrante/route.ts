import { NextRequest, NextResponse } from "next/server";

import {
  QuadrantGroupCodeAlreadyExistsError,
  QuadrantGroupNameAlreadyExistsError,
  quadrantGroupService,
} from "@/lib/quadrant-groups/quadrant-group.service";

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

    const workAreaId = searchParams.get("workAreaId")?.trim() || undefined;
    const departmentId = searchParams.get("departmentId")?.trim() || undefined;
    const isActive = parseBoolean(searchParams.get("isActive"));

    const groups = await quadrantGroupService.list({
      ...(workAreaId ? { workAreaId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    });

    return NextResponse.json(groups);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al obtener los grupos de cuadrante.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let workAreaId = "";
    let code = "";
    let name = "";
    let description: string | null | undefined = undefined;
    let displayOrder: number | undefined = undefined;
    let isActive: boolean | undefined = undefined;

    if (contentType.includes("application/json")) {
      const body = await request.json();

      workAreaId = typeof body.workAreaId === "string" ? body.workAreaId : "";
      code = typeof body.code === "string" ? body.code : "";
      name = typeof body.name === "string" ? body.name : "";
      description =
        typeof body.description === "string" || body.description === null
          ? body.description
          : undefined;
      displayOrder = parseInteger(body.displayOrder);
      isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;
    } else {
      const formData = await request.formData();

      workAreaId = formData.get("workAreaId")?.toString() ?? "";
      code = formData.get("code")?.toString() ?? "";
      name = formData.get("name")?.toString() ?? "";

      const descriptionValue = formData.get("description")?.toString();
      description =
        typeof descriptionValue === "string" ? descriptionValue : undefined;

      displayOrder = parseInteger(formData.get("displayOrder")?.toString() ?? undefined);

      const isActiveValue = formData.get("isActive")?.toString() ?? null;
      isActive = parseBoolean(isActiveValue);
    }

    const created = await quadrantGroupService.create({
      workAreaId,
      code,
      name,
      description,
      displayOrder,
      isActive,
    });

    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(
        new URL(
          `/maestros/departamentos/${created.workArea.departmentId}/zonas-trabajo/${created.workAreaId}/grupos-cuadrante`,
          request.url
        )
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof QuadrantGroupCodeAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof QuadrantGroupNameAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const message =
      error instanceof Error ? error.message : "Error al crear el grupo de cuadrante.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}