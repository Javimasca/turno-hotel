import { NextRequest, NextResponse } from "next/server";
import { shiftService } from "@/lib/shifts/shift.service";
import { getRequestContext } from "@/lib/auth/getRequestContext";
import { canManageEmployee } from "@/lib/permissions/canManageEmployee";
import { employeeRepository } from "@/lib/employees/employee.repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

type RequestContext = {
  userId: string;
  role: UserRole;
  employeeId: string | null;
  isActive: boolean;
};

async function canAccessShiftEmployee(
  ctx: RequestContext,
  targetEmployeeId: string
) {
  const isDirectManager =
    ctx.employeeId && ctx.role === "MANAGER"
      ? await employeeRepository.isDirectManagerOf(
          ctx.employeeId,
          targetEmployeeId
        )
      : false;

  return canManageEmployee({
    role: ctx.role,
    currentEmployeeId: ctx.employeeId,
    targetEmployeeId,
    isDirectManager,
  });
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await context.params;

    if (!ctx.isActive) {
      return NextResponse.json(
        { error: "Usuario inactivo." },
        { status: 403 }
      );
    }

    const shift = await shiftService.getById(id);

    if (!shift) {
      return NextResponse.json(
        { error: "El turno no existe." },
        { status: 404 }
      );
    }

    const permission = await canAccessShiftEmployee(ctx, shift.employeeId);

    if (!permission.allowed) {
      return NextResponse.json(
        { error: "No tienes permisos para consultar este turno." },
        { status: 403 }
      );
    }

    return NextResponse.json(shift);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const ctx = await getRequestContext();

    const shift = await shiftService.update(
      id,
      {
        employeeId: body.employeeId,
        workplaceId: body.workplaceId,
        departmentId: body.departmentId,
        workAreaId: body.workAreaId ?? undefined,
        jobCategoryId: body.jobCategoryId ?? undefined,
        shiftMasterId: body.shiftMasterId ?? undefined,
        date: body.date ? new Date(body.date) : undefined,
        startAt: body.startAt ? new Date(body.startAt) : undefined,
        endAt: body.endAt ? new Date(body.endAt) : undefined,
        status: body.status,
        notes: body.notes,
      },
      ctx
    );

    return NextResponse.json(shift);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const ctx = await getRequestContext();

    const deleted = await shiftService.remove(id, ctx);

    return NextResponse.json(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";

  return NextResponse.json({ error: message }, { status: 400 });
}