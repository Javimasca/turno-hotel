import { NextRequest, NextResponse } from "next/server";

import { departmentService } from "@/lib/departments/department.service";

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
    isActive:
      formData.get("isActive") === null
        ? false
        : formData.get("isActive") === "true",
    jobCategoryIds: formData.getAll("jobCategoryIds").map(String),
  };
}

function buildUpdateInput(body: {
  code?: FormDataEntryValue | null | string;
  name?: FormDataEntryValue | null | string;
  description?: FormDataEntryValue | null | string;
  isActive?: boolean;
  jobCategoryIds?: string[];
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
    ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
    ...(Array.isArray(body.jobCategoryIds)
      ? {
          jobCategoryIds: [...new Set(body.jobCategoryIds)],
        }
      : {}),
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const department = await departmentService.getById(id);

    return NextResponse.json(department);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Departamento no encontrado.";

    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await getRequestBody(request);

    const updated = await departmentService.update(id, buildUpdateInput(body));

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar el departamento.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await departmentService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al eliminar el departamento.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await getRequestBody(request);
    const method =
      typeof body._method === "string" ? body._method.toUpperCase() : "POST";

    if (method === "PATCH") {
      await departmentService.update(id, buildUpdateInput(body));

      return NextResponse.redirect(
        new URL(`/maestros/departamentos/${id}/editar?success=updated`, request.url),
        { status: 303 }
      );
    }

    if (method === "DELETE") {
      await departmentService.delete(id);

      return NextResponse.redirect(
        new URL("/maestros/departamentos?success=deleted", request.url),
        { status: 303 }
      );
    }

    return NextResponse.json(
      { error: "Método no soportado." },
      { status: 405 }
    );
  } catch (_error) {
    const body = await getRequestBody(request).catch(() => null);
    const method =
      typeof body?._method === "string" ? body._method.toUpperCase() : "POST";

    if (method === "DELETE") {
      return NextResponse.redirect(
        new URL("/maestros/departamentos?error=delete_failed", request.url),
        { status: 303 }
      );
    }

    return NextResponse.redirect(
      new URL(`/maestros/departamentos/${id}/editar?error=save_failed`, request.url),
      { status: 303 }
    );
  }
}