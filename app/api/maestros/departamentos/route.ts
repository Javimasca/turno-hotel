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

function buildNewDepartmentUrl(
  request: NextRequest,
  values: {
    error: string;
    workplaceId?: string;
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  },
) {
  const url = new URL("/maestros/departamentos/nuevo", request.url);

  url.searchParams.set("error", values.error);

  if (values.workplaceId) {
    url.searchParams.set("workplaceId", values.workplaceId);
  }

  if (values.code) {
    url.searchParams.set("code", values.code);
  }

  if (values.name) {
    url.searchParams.set("name", values.name);
  }

  if (values.description) {
    url.searchParams.set("description", values.description);
  }

  if (typeof values.isActive === "boolean") {
    url.searchParams.set("isActive", values.isActive ? "true" : "false");
  }

  return url;
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
      error instanceof Error
        ? error.message
        : "Error al obtener los departamentos.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let workplaceId = "";
  let code = "";
  let name = "";
  let description: string | null = null;
  let isActive = false;

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();

      workplaceId = String(body.workplaceId ?? "").trim();
      code = String(body.code ?? "").trim();
      name = String(body.name ?? "").trim();

      const rawDescription = String(body.description ?? "").trim();
      description = rawDescription.length > 0 ? rawDescription : null;

      isActive = body.isActive === true;
    } else {
      const formData = await request.formData();

      workplaceId = String(formData.get("workplaceId") ?? "").trim();
      code = String(formData.get("code") ?? "").trim();
      name = String(formData.get("name") ?? "").trim();

      const rawDescription = String(formData.get("description") ?? "").trim();
      description = rawDescription.length > 0 ? rawDescription : null;

      isActive = formData.get("isActive") === "true";
    }

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

    const contentType = request.headers.get("content-type") ?? "";
    const isHtmlFormRequest =
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data") ||
      contentType === "";

    if (isHtmlFormRequest) {
      return NextResponse.redirect(
        buildNewDepartmentUrl(request, {
          error: message,
          workplaceId,
          code,
          name,
          description: description ?? undefined,
          isActive,
        }),
        { status: 303 },
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}