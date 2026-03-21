import { NextRequest, NextResponse } from "next/server";

import {
  employeeService,
  EmployeeCodeAlreadyExistsError,
  EmployeeEmailAlreadyExistsError,
  EmployeeDirectManagerNotFoundError,
} from "@/lib/employees/employee.service";

function parseBoolean(value: string | null) {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const isActive = parseBoolean(searchParams.get("isActive"));
    const search = searchParams.get("search")?.trim() || undefined;

    const employees = await employeeService.list({
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(search ? { search } : {}),
    });

    return NextResponse.json(employees);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al obtener los empleados.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let code = "";
    let firstName = "";
    let lastName = "";
    let email: string | null | undefined = undefined;
    let phone: string | null | undefined = undefined;
    let directManagerEmployeeId: string | null | undefined = undefined;
    let isActive: boolean | undefined = undefined;

    if (contentType.includes("application/json")) {
      const body = await request.json();

      code = body.code ?? "";
      firstName = body.firstName ?? "";
      lastName = body.lastName ?? "";
      email = body.email ?? undefined;
      phone = body.phone ?? undefined;
      directManagerEmployeeId =
        body.directManagerEmployeeId ?? undefined;
      isActive =
        typeof body.isActive === "boolean" ? body.isActive : undefined;
    } else {
      const formData = await request.formData();

      code = formData.get("code")?.toString() ?? "";
      firstName = formData.get("firstName")?.toString() ?? "";
      lastName = formData.get("lastName")?.toString() ?? "";

      const emailValue = formData.get("email")?.toString();
      email = typeof emailValue === "string" ? emailValue : undefined;

      const phoneValue = formData.get("phone")?.toString();
      phone = typeof phoneValue === "string" ? phoneValue : undefined;

      const managerValue = formData.get("directManagerEmployeeId")?.toString();
      directManagerEmployeeId =
        typeof managerValue === "string" ? managerValue : undefined;

      const isActiveValue = formData.get("isActive")?.toString() ?? null;
      isActive = parseBoolean(isActiveValue);
    }

    await employeeService.create({
      code,
      firstName,
      lastName,
      email,
      phone,
      directManagerEmployeeId,
      isActive,
    });

    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(
        new URL("/maestros/empleados", request.url),
        { status: 303 },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof EmployeeCodeAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof EmployeeEmailAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof EmployeeDirectManagerNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Error al crear el empleado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}