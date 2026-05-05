import { NextRequest, NextResponse } from "next/server";
import { employeeService } from "@/lib/employees/employee.service";
import { getSessionUser } from "@/lib/auth/auth-session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
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
        { error: "Usuario inactivo." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const employee = await employeeService.getById(id);

    return NextResponse.json(employee);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}