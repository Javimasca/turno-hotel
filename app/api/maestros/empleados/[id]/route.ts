import { NextRequest, NextResponse } from "next/server";
import {
  EmployeeCodeAlreadyExistsError,
  EmployeeCannotManageThemselfError,
  EmployeeDepartmentNotFoundError,
  EmployeeDepartmentWorkplaceMismatchError,
  EmployeeDirectManagerNotFoundError,
  EmployeeEmailAlreadyExistsError,
  EmployeeNotFoundError,
  EmployeeWorkplaceNotFoundError,
  employeeService,
} from "@/lib/employees/employee.service";
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

export async function PATCH(req: NextRequest, context: RouteContext) {
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

    if (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER") {
      return NextResponse.json({ error: "Sin permisos." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const employee = await employeeService.update(id, {
      code: body.code,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      photoUrl: body.photoUrl,
      directManagerEmployeeId: body.directManagerEmployeeId,
      weeklyDaysOffMode: body.weeklyDaysOffMode,
      fixedDayOff1: body.fixedDayOff1,
      fixedDayOff2: body.fixedDayOff2,
      workplaceId: body.workplaceId,
      departmentId: body.departmentId,
      workAreaIds: body.workAreaIds,
      primaryWorkAreaId: body.primaryWorkAreaId,
      isActive: body.isActive,
    });

    return NextResponse.json(employee);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error instanceof EmployeeCodeAlreadyExistsError ||
      error instanceof EmployeeEmailAlreadyExistsError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (
      error instanceof EmployeeCannotManageThemselfError ||
      error instanceof EmployeeDirectManagerNotFoundError ||
      error instanceof EmployeeWorkplaceNotFoundError ||
      error instanceof EmployeeDepartmentNotFoundError ||
      error instanceof EmployeeDepartmentWorkplaceMismatchError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Error actualizando empleado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getSessionUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autenticado." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos." }, { status: 403 });
    }

    const { id } = await context.params;
    await employeeService.delete(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error eliminando empleado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
