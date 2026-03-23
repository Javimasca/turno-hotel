import { NextRequest, NextResponse } from "next/server";

import {
  employeeService,
  EmployeeNotFoundError,
  EmployeeCodeAlreadyExistsError,
  EmployeeEmailAlreadyExistsError,
  EmployeeDirectManagerNotFoundError,
  EmployeeCannotManageThemselfError,
} from "@/lib/employees/employee.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const employee = await employeeService.getById(id);

    return NextResponse.json(employee);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Error al obtener el empleado.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") || "";

    let code: string | undefined;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let email: string | null | undefined;
    let phone: string | null | undefined;
    let photoUrl: string | null | undefined;
    let directManagerEmployeeId: string | null | undefined;
    let isActive: boolean | undefined;

    if (contentType.includes("application/json")) {
      const body = await request.json();

      if ("code" in body) {
        code = body.code ?? "";
      }

      if ("firstName" in body) {
        firstName = body.firstName ?? "";
      }

      if ("lastName" in body) {
        lastName = body.lastName ?? "";
      }

      if ("email" in body) {
        email = body.email ?? null;
      }

      if ("phone" in body) {
        phone = body.phone ?? null;
      }

      if ("photoUrl" in body) {
        photoUrl = body.photoUrl ?? null;
      }

      if ("directManagerEmployeeId" in body) {
        directManagerEmployeeId = body.directManagerEmployeeId ?? null;
      }

      if (typeof body.isActive === "boolean") {
        isActive = body.isActive;
      }
    } else {
      const formData = await request.formData();
      const method = String(formData.get("_method") ?? "").toUpperCase();

      if (method === "DELETE") {
        await employeeService.delete(id);

        return NextResponse.redirect(new URL("/maestros/empleados", request.url), {
          status: 303,
        });
      }

      if (formData.has("code")) {
        code = formData.get("code")?.toString() ?? "";
      }

      if (formData.has("firstName")) {
        firstName = formData.get("firstName")?.toString() ?? "";
      }

      if (formData.has("lastName")) {
        lastName = formData.get("lastName")?.toString() ?? "";
      }

      if (formData.has("email")) {
        email = formData.get("email")?.toString() ?? null;
      }

      if (formData.has("phone")) {
        phone = formData.get("phone")?.toString() ?? null;
      }

      if (formData.has("photoUrl")) {
        photoUrl = formData.get("photoUrl")?.toString() ?? null;
      }

      if (formData.has("directManagerEmployeeId")) {
        directManagerEmployeeId =
          formData.get("directManagerEmployeeId")?.toString() ?? null;
      }

      if (formData.has("isActive")) {
        isActive = formData.get("isActive")?.toString() === "true";
      } else {
        isActive = false;
      }
    }

    const employee = await employeeService.update(id, {
      ...(code !== undefined ? { code } : {}),
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(directManagerEmployeeId !== undefined
        ? { directManagerEmployeeId }
        : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    });

    return NextResponse.json(employee);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof EmployeeCodeAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof EmployeeEmailAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof EmployeeDirectManagerNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof EmployeeCannotManageThemselfError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Error al actualizar el empleado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await employeeService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Error al eliminar el empleado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const formData = await request.formData();
  const method = String(formData.get("_method") ?? "").toUpperCase();

  if (method === "PATCH") {
    return PATCH(request, context);
  }

  if (method === "DELETE") {
    return PATCH(request, context);
  }

  return NextResponse.json({ error: "Método no soportado." }, { status: 405 });
}