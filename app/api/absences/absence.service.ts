import {
  Absence,
  AbsenceDurationMode,
  AbsenceStatus,
  AbsenceUnit,
} from "@prisma/client";
import {
  absenceRepository,
  CreateAbsenceInput,
  UpdateAbsenceInput,
} from "./absence.repository";
import { employeeRepository } from "@/lib/employees/employee.repository";
import { canManageEmployee } from "@/lib/permissions/canManageEmployee";

type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

type ServiceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      status?: number;
    };

type ServiceError = {
  ok: false;
  error: string;
  status?: number;
};

type RequestContext = {
  userId: string;
  role: UserRole;
  employeeId: string | null;
  isActive: boolean;
};

type CreateAbsenceDto = {
  employeeId: string;
  absenceTypeId: string;
  unit: AbsenceUnit;
  startDate: Date | string;
  endDate: Date | string;
  startMinutes?: number | null;
  endMinutes?: number | null;
  status?: AbsenceStatus;
  notes?: string | null;
  documentUrl?: string | null;
};

type UpdateAbsenceDto = Partial<CreateAbsenceDto>;

function isManagerOrAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

function canCreateApprovedAbsence(role: UserRole): boolean {
  return isManagerOrAdmin(role);
}

function normalizeText(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toDateOnly(value: Date | string): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha inválida.");
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

function validateMinutes(value: number | null | undefined, fieldName: string) {
  if (value == null) return;

  if (!Number.isInteger(value) || value < 0 || value > 1440) {
    throw new Error(`${fieldName} debe ser un entero entre 0 y 1440.`);
  }
}

function validateUnitCompatibility(
  durationMode: AbsenceDurationMode,
  unit: AbsenceUnit
) {
  if (
    (durationMode === AbsenceDurationMode.FULL_DAY &&
      unit !== AbsenceUnit.FULL_DAY) ||
    (durationMode === AbsenceDurationMode.HOURLY &&
      unit !== AbsenceUnit.HOURLY)
  ) {
    throw new Error("La unidad no es válida para el tipo de ausencia.");
  }
}

function validateStructure(data: {
  unit: AbsenceUnit;
  startDate: Date;
  endDate: Date;
  startMinutes?: number | null;
  endMinutes?: number | null;
}) {
  validateMinutes(data.startMinutes, "startMinutes");
  validateMinutes(data.endMinutes, "endMinutes");

  if (data.unit === AbsenceUnit.FULL_DAY) {
    if (data.startDate.getTime() > data.endDate.getTime()) {
      throw new Error("La fecha de inicio no puede ser mayor que la fecha de fin.");
    }

    if (data.startMinutes != null || data.endMinutes != null) {
      throw new Error("Una ausencia de día completo no debe incluir horas.");
    }
  }

  if (data.unit === AbsenceUnit.HOURLY) {
    if (!isSameDay(data.startDate, data.endDate)) {
      throw new Error("Una ausencia por horas debe estar dentro del mismo día.");
    }

    if (data.startMinutes == null || data.endMinutes == null) {
      throw new Error("Una ausencia por horas requiere hora de inicio y fin.");
    }

    if (data.startMinutes >= data.endMinutes) {
      throw new Error("La hora de inicio debe ser menor que la hora de fin.");
    }
  }
}

function toCreateInput(
  dto: CreateAbsenceDto,
  ctx: RequestContext
): CreateAbsenceInput {
  const startDate = toDateOnly(dto.startDate);
  const endDate = toDateOnly(dto.endDate);

  const resolvedStatus =
    dto.status === AbsenceStatus.APPROVED && canCreateApprovedAbsence(ctx.role)
      ? AbsenceStatus.APPROVED
      : AbsenceStatus.PENDING;

  const data: CreateAbsenceInput = {
    employeeId: dto.employeeId,
    absenceTypeId: dto.absenceTypeId,
    unit: dto.unit,
    startDate,
    endDate,
    startMinutes:
      dto.unit === AbsenceUnit.HOURLY ? (dto.startMinutes ?? null) : null,
    endMinutes:
      dto.unit === AbsenceUnit.HOURLY ? (dto.endMinutes ?? null) : null,
    status: resolvedStatus,
    notes: normalizeText(dto.notes),
    documentUrl: normalizeText(dto.documentUrl),
  };

  validateStructure(data);

  return data;
}

function toUpdateInput(dto: UpdateAbsenceDto): UpdateAbsenceInput {
  const data: UpdateAbsenceInput = {};

  if (dto.employeeId !== undefined) data.employeeId = dto.employeeId;
  if (dto.absenceTypeId !== undefined) data.absenceTypeId = dto.absenceTypeId;
  if (dto.unit !== undefined) data.unit = dto.unit;
  if (dto.startDate !== undefined) data.startDate = toDateOnly(dto.startDate);
  if (dto.endDate !== undefined) data.endDate = toDateOnly(dto.endDate);
  if (dto.startMinutes !== undefined) data.startMinutes = dto.startMinutes;
  if (dto.endMinutes !== undefined) data.endMinutes = dto.endMinutes;
  if (dto.status !== undefined) data.status = dto.status;
  if (dto.notes !== undefined) data.notes = normalizeText(dto.notes);

  if (dto.documentUrl !== undefined) {
    data.documentUrl = normalizeText(dto.documentUrl);
  }

  return data;
}

function ensureActiveUser(ctx: RequestContext): ServiceError | null {
  if (!ctx.isActive) {
    return {
      ok: false,
      error: "Usuario inactivo.",
      status: 403,
    };
  }

  return null;
}

async function ensureCanManageEmployee(params: {
  ctx: RequestContext;
  targetEmployeeId: string;
}): Promise<ServiceError | null> {
  const { ctx, targetEmployeeId } = params;

  const isDirectManager =
    ctx.employeeId && ctx.role === "MANAGER"
      ? await employeeRepository.isDirectManagerOf(
          ctx.employeeId,
          targetEmployeeId
        )
      : false;

  const result = canManageEmployee({
    role: ctx.role,
    currentEmployeeId: ctx.employeeId,
    targetEmployeeId,
    isDirectManager,
  });

  if (!result.allowed) {
    return {
      ok: false,
      error: result.reason ?? "No tienes permisos para gestionar este empleado.",
      status: 403,
    };
  }

  return null;
}

async function validateOverlap(params: {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  excludeId?: string;
}) {
  const conflicts = await absenceRepository.findForOverlapValidation({
    employeeId: params.employeeId,
    startDate: params.startDate,
    endDate: params.endDate,
    excludeId: params.excludeId,
    statuses: [AbsenceStatus.PENDING, AbsenceStatus.APPROVED],
  });

  if (conflicts.length > 0) {
    throw new Error("Ya existe otra ausencia para ese empleado en ese rango o día.");
  }
}

async function validateFullDayApprovalConflicts(absence: {
  employeeId: string;
  unit: AbsenceUnit;
  startDate: Date;
  endDate: Date;
}) {
  if (absence.unit !== AbsenceUnit.FULL_DAY) return;

  const hasShiftConflict = await absenceRepository.existsShiftConflict({
    employeeId: absence.employeeId,
    startDate: absence.startDate,
    endDate: absence.endDate,
  });

  if (hasShiftConflict) {
    throw new Error(
      "No se puede aprobar la ausencia porque existen turnos en ese rango."
    );
  }
}

export const absenceService = {
  async list(): Promise<ServiceResult<Absence[]>> {
    const data = await absenceRepository.findAll();
    return { ok: true, data };
  },

  async getById(id: string): Promise<ServiceResult<Absence>> {
    const item = await absenceRepository.findById(id);

    if (!item) {
      return {
        ok: false,
        error: "Ausencia no encontrada.",
        status: 404,
      };
    }

    return { ok: true, data: item };
  },

  async create(
    dto: CreateAbsenceDto,
    ctx: RequestContext
  ): Promise<ServiceResult<Absence>> {
    try {
      const inactiveError = ensureActiveUser(ctx);
      if (inactiveError) return inactiveError;

      const manageError = await ensureCanManageEmployee({
        ctx,
        targetEmployeeId: dto.employeeId,
      });

      if (manageError) {
        return {
          ...manageError,
          error: "No tienes permisos para crear ausencias para este empleado.",
        };
      }

      const absenceType = await absenceRepository.findAbsenceTypeById(
        dto.absenceTypeId
      );

      if (!absenceType) {
        return {
          ok: false,
          error: "Tipo de ausencia no encontrado.",
          status: 404,
        };
      }

      const employee = await absenceRepository.findEmployeeById(dto.employeeId);

      if (!employee) {
        return {
          ok: false,
          error: "Empleado no encontrado.",
          status: 404,
        };
      }

      const data = toCreateInput(dto, ctx);

      validateUnitCompatibility(absenceType.durationMode, data.unit);

      await validateOverlap({
        employeeId: data.employeeId,
        startDate: data.startDate,
        endDate: data.endDate,
      });

      if (data.status === AbsenceStatus.APPROVED) {
        await validateFullDayApprovalConflicts(data);
      }

      const created = await absenceRepository.create(data);
      return { ok: true, data: created };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error al crear la ausencia.",
        status: 400,
      };
    }
  },

  async update(
    id: string,
    dto: UpdateAbsenceDto,
    ctx: RequestContext
  ): Promise<ServiceResult<Absence>> {
    try {
      const inactiveError = ensureActiveUser(ctx);
      if (inactiveError) return inactiveError;

      const existing = await absenceRepository.findById(id);

      if (!existing) {
        return {
          ok: false,
          error: "Ausencia no encontrada.",
          status: 404,
        };
      }

      const manageExistingError = await ensureCanManageEmployee({
        ctx,
        targetEmployeeId: existing.employeeId,
      });

      if (manageExistingError) {
        return {
          ...manageExistingError,
          error: "No tienes permisos para editar esta ausencia.",
        };
      }

      if (
        ctx.role === "EMPLOYEE" &&
        existing.employeeId === ctx.employeeId &&
        existing.status !== AbsenceStatus.PENDING
      ) {
        return {
          ok: false,
          error: "Solo puedes editar tus propias ausencias pendientes.",
          status: 403,
        };
      }

      const data = toUpdateInput(dto);

      const nextEmployeeId = data.employeeId ?? existing.employeeId;
      const nextAbsenceTypeId = data.absenceTypeId ?? existing.absenceTypeId;
      const nextUnit = data.unit ?? existing.unit;
      const nextStartDate = data.startDate ?? existing.startDate;
      const nextEndDate = data.endDate ?? existing.endDate;
      const nextStartMinutes =
        data.startMinutes !== undefined
          ? data.startMinutes
          : existing.startMinutes;
      const nextEndMinutes =
        data.endMinutes !== undefined ? data.endMinutes : existing.endMinutes;

      const manageTargetError = await ensureCanManageEmployee({
        ctx,
        targetEmployeeId: nextEmployeeId,
      });

      if (manageTargetError) {
        return {
          ...manageTargetError,
          error: "No tienes permisos para mover esta ausencia a ese empleado.",
        };
      }

      let nextStatus = data.status ?? existing.status;

      if (!canCreateApprovedAbsence(ctx.role)) {
        nextStatus = existing.status;
        delete data.status;
      }

      const absenceType = await absenceRepository.findAbsenceTypeById(
        nextAbsenceTypeId
      );

      if (!absenceType) {
        return {
          ok: false,
          error: "Tipo de ausencia no encontrado.",
          status: 404,
        };
      }

      const employee = await absenceRepository.findEmployeeById(nextEmployeeId);

      if (!employee) {
        return {
          ok: false,
          error: "Empleado no encontrado.",
          status: 404,
        };
      }

      validateUnitCompatibility(absenceType.durationMode, nextUnit);

      validateStructure({
        unit: nextUnit,
        startDate: nextStartDate,
        endDate: nextEndDate,
        startMinutes: nextUnit === AbsenceUnit.HOURLY ? nextStartMinutes : null,
        endMinutes: nextUnit === AbsenceUnit.HOURLY ? nextEndMinutes : null,
      });

      if (nextUnit === AbsenceUnit.FULL_DAY) {
        data.startMinutes = null;
        data.endMinutes = null;
      }

      await validateOverlap({
        employeeId: nextEmployeeId,
        startDate: nextStartDate,
        endDate: nextEndDate,
        excludeId: id,
      });

      if (nextStatus === AbsenceStatus.APPROVED) {
        await validateFullDayApprovalConflicts({
          employeeId: nextEmployeeId,
          unit: nextUnit,
          startDate: nextStartDate,
          endDate: nextEndDate,
        });
      }

      const updated = await absenceRepository.update(id, data);
      return { ok: true, data: updated };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar la ausencia.",
        status: 400,
      };
    }
  },

  async approve(
    id: string,
    ctx: RequestContext
  ): Promise<ServiceResult<Absence>> {
    try {
      const inactiveError = ensureActiveUser(ctx);
      if (inactiveError) return inactiveError;

      if (!isManagerOrAdmin(ctx.role)) {
        return {
          ok: false,
          error: "No tienes permisos para aprobar ausencias.",
          status: 403,
        };
      }

      const existing = await absenceRepository.findById(id);

      if (!existing) {
        return {
          ok: false,
          error: "Ausencia no encontrada.",
          status: 404,
        };
      }

      const manageError = await ensureCanManageEmployee({
        ctx,
        targetEmployeeId: existing.employeeId,
      });

      if (manageError) {
        return {
          ...manageError,
          error: "No tienes permisos para aprobar esta ausencia.",
        };
      }

      await validateFullDayApprovalConflicts(existing);

      const updated = await absenceRepository.update(id, {
        status: AbsenceStatus.APPROVED,
      });

      return { ok: true, data: updated };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al aprobar la ausencia.",
        status: 400,
      };
    }
  },

  async delete(
    id: string,
    ctx: RequestContext
  ): Promise<ServiceResult<Absence>> {
    const inactiveError = ensureActiveUser(ctx);
    if (inactiveError) return inactiveError;

    const existing = await absenceRepository.findById(id);

    if (!existing) {
      return {
        ok: false,
        error: "Ausencia no encontrada.",
        status: 404,
      };
    }

    const manageError = await ensureCanManageEmployee({
      ctx,
      targetEmployeeId: existing.employeeId,
    });

    if (manageError) {
      return {
        ...manageError,
        error: "No tienes permisos para eliminar esta ausencia.",
        status: 403,
      };
    }

    if (
      ctx.role === "EMPLOYEE" &&
      existing.employeeId === ctx.employeeId &&
      existing.status !== AbsenceStatus.PENDING
    ) {
      return {
        ok: false,
        error: "Solo puedes eliminar tus propias ausencias pendientes.",
        status: 403,
      };
    }

    const deleted = await absenceRepository.delete(id);
    return { ok: true, data: deleted };
  },
};