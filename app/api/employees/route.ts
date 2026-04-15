import { NextResponse } from "next/server";
import { employeeRepository } from "@/lib/employees/employee.repository";
import { getSessionUser } from "@/lib/auth/auth-session";

export async function GET() {
  try {
    const currentUser = await getSessionUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autenticado." },
        { status: 401 }
      );
    }

    if (!currentUser.isActive) {
      return NextResponse.json(
        { error: "Tu usuario está inactivo." },
        { status: 403 }
      );
    }

    if (currentUser.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "No tienes permisos para consultar empleados." },
        { status: 403 }
      );
    }

    const employees =
      currentUser.role === "ADMIN"
        ? await employeeRepository.findMany({})
        : await employeeRepository.findMany({
            employeeIds: currentUser.employeeId
              ? [currentUser.employeeId]
              : [],
            directManagerEmployeeId: currentUser.employeeId ?? undefined,
          });

    return NextResponse.json(employees);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ha ocurrido un error inesperado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}