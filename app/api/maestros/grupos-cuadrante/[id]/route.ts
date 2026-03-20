import { NextRequest, NextResponse } from "next/server";

import {
  quadrantGroupService,
  QuadrantGroupCodeAlreadyExistsError,
  QuadrantGroupNameAlreadyExistsError,
  QuadrantGroupNotFoundError,
} from "@/lib/quadrant-groups/quadrant-group.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();

  return {
    _method: formData.get("_method"),
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
    displayOrder: formData.get("displayOrder"),
    isActive:
      formData.get("isActive") === null
        ? false
        : formData.get("isActive") === "true",
  };
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

function buildUpdateInput(body: {
  code?: FormDataEntryValue | null;
  name?: FormDataEntryValue | null;
  description?: FormDataEntryValue | null;
  displayOrder?: FormDataEntryValue | null;
  isActive?: boolean;
}) {
  return {
    ...(typeof body.code === "string" ? { code: body.code.trim() } : {}),
    ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
    ...(typeof body.description === "string" || body.description === null
      ? {
          description:
            typeof body.description === "string"
              ? body.description.trim() === ""
                ? null
                : body.description.trim()
              : null,
        }
      : {}),
    ...(body.displayOrder !== undefined
      ? { displayOrder: parseInteger(body.displayOrder) }
      : {}),
    ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
  };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const quadrantGroup = await quadrantGroupService.getById(id);

    return NextResponse.json(quadrantGroup);
  } catch (error) {
    if (error instanceof QuadrantGroupNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Grupo de cuadrante no encontrado.";

    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const body = await getRequestBody(request);

    const updated = await quadrantGroupService.update(id, buildUpdateInput(body));

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof QuadrantGroupNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error instanceof QuadrantGroupCodeAlreadyExistsError ||
      error instanceof QuadrantGroupNameAlreadyExistsError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar el grupo de cuadrante.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    await quadrantGroupService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof QuadrantGroupNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Error al eliminar el grupo de cuadrante.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const body = await getRequestBody(request);
    const method =
      typeof body._method === "string" ? body._method.toUpperCase() : "POST";

    if (method === "PATCH") {
      const updated = await quadrantGroupService.update(id, buildUpdateInput(body));

      return NextResponse.json(updated);
    }

    if (method === "DELETE") {
      await quadrantGroupService.delete(id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Método no soportado." },
      { status: 405 },
    );
  } catch (error) {
    if (error instanceof QuadrantGroupNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error instanceof QuadrantGroupCodeAlreadyExistsError ||
      error instanceof QuadrantGroupNameAlreadyExistsError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const message =
      error instanceof Error ? error.message : "Error al procesar la solicitud.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}