import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import {
  employeeService,
  EmployeeCodeAlreadyExistsError,
  EmployeeEmailAlreadyExistsError,
  EmployeeDirectManagerNotFoundError,
  EmployeeWorkplaceNotFoundError,
  EmployeeDepartmentNotFoundError,
  EmployeeDepartmentWorkplaceMismatchError,
} from "@/lib/employees/employee.service";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function parseBoolean(value: string | null) {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "jpg" : "jpg";
}

function isSupportedImageType(mimeType: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
    mimeType,
  );
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
    let workplaceId: string | null | undefined = undefined;
    let departmentId: string | null | undefined = undefined;
    let isActive: boolean | undefined = undefined;
    let photoFile: File | null = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();

      code = body.code ?? "";
      firstName = body.firstName ?? "";
      lastName = body.lastName ?? "";
      email = body.email ?? undefined;
      phone = body.phone ?? undefined;
      directManagerEmployeeId = body.directManagerEmployeeId ?? undefined;
      workplaceId = body.workplaceId ?? undefined;
      departmentId = body.departmentId ?? undefined;
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

      const workplaceValue = formData.get("workplaceId")?.toString();
      workplaceId =
        typeof workplaceValue === "string" ? workplaceValue : undefined;

      const departmentValue = formData.get("departmentId")?.toString();
      departmentId =
        typeof departmentValue === "string" ? departmentValue : undefined;

      const isActiveValue = formData.get("isActive")?.toString() ?? null;
      isActive = parseBoolean(isActiveValue);

      const candidatePhoto = formData.get("photo");

      if (candidatePhoto instanceof File && candidatePhoto.size > 0) {
        photoFile = candidatePhoto;
      }
    }

    if (photoFile) {
      if (!photoFile.name) {
        return NextResponse.json(
          { error: "El archivo de foto no tiene un nombre válido." },
          { status: 400 },
        );
      }

      if (!isSupportedImageType(photoFile.type)) {
        return NextResponse.json(
          {
            error: "Formato no soportado. Solo admitimos JPG, PNG, WEBP o GIF.",
          },
          { status: 400 },
        );
      }

      if (photoFile.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: "La imagen supera el tamaño máximo permitido de 5 MB.",
          },
          { status: 400 },
        );
      }
    }

    const employee = await employeeService.create({
      code,
      firstName,
      lastName,
      email,
      phone,
      directManagerEmployeeId,
      workplaceId,
      departmentId,
      isActive,
    });

    let finalEmployee = employee;

    if (photoFile) {
      const extension = getFileExtension(photoFile.name);
      const safeName = `empleados/${employee.id}/${Date.now()}.${extension}`;

      const blob = await put(safeName, photoFile, {
        access: "public",
        addRandomSuffix: false,
      });

      finalEmployee = await employeeService.update(employee.id, {
        photoUrl: blob.url,
      });
    }

    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(
        new URL("/maestros/empleados", request.url),
        { status: 303 },
      );
    }

    return NextResponse.json(finalEmployee, { status: 201 });
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

    if (error instanceof EmployeeWorkplaceNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof EmployeeDepartmentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof EmployeeDepartmentWorkplaceMismatchError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Error al crear el empleado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}