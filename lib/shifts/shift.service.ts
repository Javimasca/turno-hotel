import { prisma } from "@/lib/prisma";
import { shiftRepository } from "@/lib/shifts/shift.repository";
import type {
  CreateShiftInput,
  UpdateShiftInput,
} from "@/lib/shifts/shift.types";
import { canManageEmployee } from "@/lib/permissions/canManageEmployee";
import { employeeRepository } from "@/lib/employees/employee.repository";
import {
  dateOnlyToUtcNoonDate,
  formatLocalDateOnly,
} from "@/lib/date-only";

const MAX_SHIFT_DURATION_HOURS = 16;

type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

type RequestContext = {
  userId: string;
  role: UserRole;
  employeeId: string | null;
  isActive: boolean;
};

type ServiceError = {
  ok: false;
  error: string;
  status?: number;
};

type GetShiftsByRangeInput = {
  startAt: Date;
  endAt: Date;
  workplaceId?: string;
  departmentId?: string;
  workAreaId?: string;
};

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

function ensureCanManageShifts(ctx: RequestContext): ServiceError | null {
  if (ctx.role === "EMPLOYEE") {
    return {
      ok: false,
      error: "No tienes permisos para gestionar turnos.",
      status: 403,
    };
  }

  return null;
}

async function getReadableEmployeeIds(ctx: RequestContext): Promise<string[]> {
  if (!ctx.isActive) {
    return [];
  }

  if (ctx.role === "ADMIN") {
    return [];
  }

  if (!ctx.employeeId) {
    return [];
  }

  if (ctx.role === "EMPLOYEE") {
    return [ctx.employeeId];
  }

  const subordinates = await prisma.employee.findMany({
    where: {
      directManagerEmployeeId: ctx.employeeId,
    },
    select: {
      id: true,
    },
  });

  return [ctx.employeeId, ...subordinates.map((employee) => employee.id)];
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

export const shiftService = {
  async getById(id: string) {
    return shiftRepository.findById(id);
  },

  async getByRange(input: GetShiftsByRangeInput, ctx: RequestContext) {
  validateDateRange(input.startAt, input.endAt);

  const inactiveError = ensureActiveUser(ctx);
  if (inactiveError) {
    throw new Error(inactiveError.error);
  }

  if (ctx.role === "ADMIN") {
    return shiftRepository.findByRange(input);
  }

  const readableEmployeeIds = await getReadableEmployeeIds(ctx);

  if (readableEmployeeIds.length === 0) {
    return [];
  }

  return shiftRepository.findByRange({
    ...input,
    employeeIds: readableEmployeeIds,
  });
},

  async getAbsencesByRange(input: GetShiftsByRangeInput, ctx: RequestContext) {
    validateDateRange(input.startAt, input.endAt);

    const inactiveError = ensureActiveUser(ctx);
    if (inactiveError) {
      throw new Error(inactiveError.error);
    }

    if (ctx.role === "ADMIN") {
      return shiftRepository.findAbsencesByRange(input);
    }

    const readableEmployeeIds = await getReadableEmployeeIds(ctx);

    if (readableEmployeeIds.length === 0) {
      return [];
    }

    return shiftRepository.findAbsencesByRange({
      ...input,
      employeeIds: readableEmployeeIds,
    });
  },

  async create(input: CreateShiftInput, ctx: RequestContext) {
    const inactiveError = ensureActiveUser(ctx);
    if (inactiveError) {
      throw new Error(inactiveError.error);
    }

    const shiftPermissionError = ensureCanManageShifts(ctx);
    if (shiftPermissionError) {
      throw new Error(shiftPermissionError.error);
    }

    const manageEmployeeError = await ensureCanManageEmployee({
      ctx,
      targetEmployeeId: input.employeeId,
    });

    if (manageEmployeeError) {
      throw new Error("No tienes permisos para crear turnos para este empleado.");
    }

    validateRequiredCreateFields(input);

    const resolvedData = await resolveShiftCreateData(input);

    validateShiftTimes(resolvedData.startAt, resolvedData.endAt);

    await validateEmployeeExists(resolvedData.employeeId);
    await validateWorkplaceExists(resolvedData.workplaceId);
    await validateDepartmentExists(resolvedData.departmentId);

    if (resolvedData.workAreaId) {
      await validateWorkAreaExists(resolvedData.workAreaId);
      await validateWorkAreaBelongsToDepartment(
        resolvedData.workAreaId,
        resolvedData.departmentId
      );
    }

    if (resolvedData.jobCategoryId) {
      await validateJobCategoryExists(resolvedData.jobCategoryId);
    }

    await validateDepartmentBelongsToWorkplace(
      resolvedData.departmentId,
      resolvedData.workplaceId
    );
    await validateEmployeeOrganization(
      resolvedData.employeeId,
      resolvedData.workplaceId,
      resolvedData.departmentId
    );
    await validateActiveContractAtDate(
      resolvedData.employeeId,
      resolvedData.startAt
    );

    if (resolvedData.jobCategoryId) {
      await validateJobCategoryMatchesActiveContract(
        resolvedData.employeeId,
        resolvedData.jobCategoryId,
        resolvedData.startAt
      );
    }

    await validateEmployeeOverlap(
      resolvedData.employeeId,
      resolvedData.startAt,
      resolvedData.endAt
    );

    await validateApprovedFullDayAbsenceConflict(
      resolvedData.employeeId,
      resolvedData.startAt,
      resolvedData.endAt
    );

    return shiftRepository.create({
      employeeId: resolvedData.employeeId,
      workplaceId: resolvedData.workplaceId,
      departmentId: resolvedData.departmentId,
      workAreaId: resolvedData.workAreaId ?? null,
      jobCategoryId: resolvedData.jobCategoryId ?? null,
      shiftMasterId: resolvedData.shiftMasterId ?? null,
      startAt: resolvedData.startAt,
      endAt: resolvedData.endAt,
      status: resolvedData.status ?? "BORRADOR",
      notes: normalizeNotes(resolvedData.notes),
    });
  },

  async update(id: string, input: UpdateShiftInput, ctx: RequestContext) {
    const inactiveError = ensureActiveUser(ctx);
    if (inactiveError) {
      throw new Error(inactiveError.error);
    }

    const shiftPermissionError = ensureCanManageShifts(ctx);
    if (shiftPermissionError) {
      throw new Error(shiftPermissionError.error);
    }

    const existingShift = await shiftRepository.findById(id);

    if (!existingShift) {
      throw new Error("El turno no existe.");
    }

    const manageExistingEmployeeError = await ensureCanManageEmployee({
      ctx,
      targetEmployeeId: existingShift.employeeId,
    });

    if (manageExistingEmployeeError) {
      throw new Error("No tienes permisos para editar este turno.");
    }

    const resolvedData = await resolveShiftUpdateData(existingShift, input);

    const manageTargetEmployeeError = await ensureCanManageEmployee({
      ctx,
      targetEmployeeId: resolvedData.employeeId,
    });

    if (manageTargetEmployeeError) {
      throw new Error("No tienes permisos para mover este turno a ese empleado.");
    }

    validateShiftTimes(resolvedData.startAt, resolvedData.endAt);

    await validateEmployeeExists(resolvedData.employeeId);
    await validateWorkplaceExists(resolvedData.workplaceId);
    await validateDepartmentExists(resolvedData.departmentId);

    if (resolvedData.workAreaId) {
      await validateWorkAreaExists(resolvedData.workAreaId);
      await validateWorkAreaBelongsToDepartment(
        resolvedData.workAreaId,
        resolvedData.departmentId
      );
    }

    if (resolvedData.jobCategoryId) {
      await validateJobCategoryExists(resolvedData.jobCategoryId);
    }

    await validateDepartmentBelongsToWorkplace(
      resolvedData.departmentId,
      resolvedData.workplaceId
    );
    await validateEmployeeOrganization(
      resolvedData.employeeId,
      resolvedData.workplaceId,
      resolvedData.departmentId
    );
    await validateActiveContractAtDate(
      resolvedData.employeeId,
      resolvedData.startAt
    );

    if (resolvedData.jobCategoryId) {
      await validateJobCategoryMatchesActiveContract(
        resolvedData.employeeId,
        resolvedData.jobCategoryId,
        resolvedData.startAt
      );
    }

    await validateEmployeeOverlap(
      resolvedData.employeeId,
      resolvedData.startAt,
      resolvedData.endAt,
      id
    );

    await validateApprovedFullDayAbsenceConflict(
      resolvedData.employeeId,
      resolvedData.startAt,
      resolvedData.endAt
    );

    return shiftRepository.update(id, {
      employeeId: resolvedData.employeeId,
      workplaceId: resolvedData.workplaceId,
      departmentId: resolvedData.departmentId,
      workAreaId: resolvedData.workAreaId ?? null,
      jobCategoryId: resolvedData.jobCategoryId ?? null,
      shiftMasterId: resolvedData.shiftMasterId ?? null,
      startAt: resolvedData.startAt,
      endAt: resolvedData.endAt,
      status: resolvedData.status,
      notes: normalizeNotes(resolvedData.notes),
    });
  },

  async remove(id: string, ctx: RequestContext) {
    const inactiveError = ensureActiveUser(ctx);
    if (inactiveError) {
      throw new Error(inactiveError.error);
    }

    const shiftPermissionError = ensureCanManageShifts(ctx);
    if (shiftPermissionError) {
      throw new Error(shiftPermissionError.error);
    }

    const existingShift = await shiftRepository.findById(id);

    if (!existingShift) {
      throw new Error("El turno no existe.");
    }

    const manageEmployeeError = await ensureCanManageEmployee({
      ctx,
      targetEmployeeId: existingShift.employeeId,
    });

    if (manageEmployeeError) {
      throw new Error("No tienes permisos para eliminar este turno.");
    }

    return shiftRepository.delete(id);
  },
};

async function resolveShiftCreateData(input: CreateShiftInput) {
  const employeeId = input.employeeId;
  const workAreaId = input.workAreaId ?? null;
  const jobCategoryId = input.jobCategoryId ?? null;
  const shiftMasterId = input.shiftMasterId ?? null;
  const status = input.status ?? "BORRADOR";
  const notes = input.notes ?? null;

  if (shiftMasterId) {
    if (!input.date) {
      throw new Error(
        "La fecha es obligatoria cuando se crea un turno desde un maestro."
      );
    }

    const shiftMaster = await validateShiftMasterExists(shiftMasterId);

    const startAt = buildDateTime(input.date, shiftMaster.startMinute);
    const endAt = buildShiftEndDateTime(
      input.date,
      shiftMaster.endMinute,
      shiftMaster.crossesMidnight
    );

    return {
      employeeId,
      workplaceId: shiftMaster.workplaceId,
      departmentId: shiftMaster.departmentId,
      workAreaId: shiftMaster.workAreaId ?? null,
      jobCategoryId,
      shiftMasterId: shiftMaster.id,
      startAt,
      endAt,
      status,
      notes,
    };
  }

  if (!input.workplaceId) {
    throw new Error("El centro es obligatorio.");
  }

  if (!input.departmentId) {
    throw new Error("El departamento es obligatorio.");
  }

  if (!input.startAt) {
    throw new Error("La fecha/hora de inicio es obligatoria.");
  }

  if (!input.endAt) {
    throw new Error("La fecha/hora de fin es obligatoria.");
  }

  return {
    employeeId,
    workplaceId: input.workplaceId,
    departmentId: input.departmentId,
    workAreaId,
    jobCategoryId,
    shiftMasterId: null,
    startAt: input.startAt,
    endAt: input.endAt,
    status,
    notes,
  };
}

async function resolveShiftUpdateData(
  existingShift: Awaited<ReturnType<typeof shiftRepository.findById>>,
  input: UpdateShiftInput
) {
  if (!existingShift) {
    throw new Error("El turno no existe.");
  }

  const nextEmployeeId = input.employeeId ?? existingShift.employeeId;
  const nextJobCategoryId =
    input.jobCategoryId === undefined
      ? existingShift.jobCategoryId
      : input.jobCategoryId;

  const nextStatus = input.status ?? existingShift.status;
  const nextNotes =
    input.notes === undefined ? existingShift.notes : input.notes;

  const requestedShiftMasterId =
    input.shiftMasterId === undefined
      ? existingShift.shiftMasterId
      : input.shiftMasterId;

  if (requestedShiftMasterId) {
    const shiftMaster = await validateShiftMasterExists(requestedShiftMasterId);

    const baseDate = input.date ?? input.startAt ?? existingShift.startAt;

    const shiftDate = extractDate(baseDate);

    const nextStartAt = buildDateTime(shiftDate, shiftMaster.startMinute);
    const nextEndAt = buildShiftEndDateTime(
      shiftDate,
      shiftMaster.endMinute,
      shiftMaster.crossesMidnight
    );

    return {
      employeeId: nextEmployeeId,
      workplaceId: shiftMaster.workplaceId,
      departmentId: shiftMaster.departmentId,
      workAreaId: shiftMaster.workAreaId ?? null,
      jobCategoryId: nextJobCategoryId ?? null,
      shiftMasterId: shiftMaster.id,
      startAt: nextStartAt,
      endAt: nextEndAt,
      status: nextStatus,
      notes: nextNotes,
    };
  }

  const nextWorkplaceId = input.workplaceId ?? existingShift.workplaceId;
  const nextDepartmentId = input.departmentId ?? existingShift.departmentId;
  const nextWorkAreaId =
    input.workAreaId === undefined
      ? existingShift.workAreaId
      : input.workAreaId;
  const nextStartAt = input.startAt ?? existingShift.startAt;
  const nextEndAt = input.endAt ?? existingShift.endAt;

  return {
    employeeId: nextEmployeeId,
    workplaceId: nextWorkplaceId,
    departmentId: nextDepartmentId,
    workAreaId: nextWorkAreaId ?? null,
    jobCategoryId: nextJobCategoryId ?? null,
    shiftMasterId: null,
    startAt: nextStartAt,
    endAt: nextEndAt,
    status: nextStatus,
    notes: nextNotes,
  };
}

function validateRequiredCreateFields(input: CreateShiftInput) {
  if (!input.employeeId) {
    throw new Error("El empleado es obligatorio.");
  }

  if (!input.shiftMasterId) {
    if (!input.workplaceId) {
      throw new Error("El centro es obligatorio.");
    }

    if (!input.departmentId) {
      throw new Error("El departamento es obligatorio.");
    }

    if (!input.startAt) {
      throw new Error("La fecha/hora de inicio es obligatoria.");
    }

    if (!input.endAt) {
      throw new Error("La fecha/hora de fin es obligatoria.");
    }
  }
}

function validateDateRange(startAt: Date, endAt: Date) {
  if (!(startAt instanceof Date) || Number.isNaN(startAt.getTime())) {
    throw new Error("La fecha inicial no es válida.");
  }

  if (!(endAt instanceof Date) || Number.isNaN(endAt.getTime())) {
    throw new Error("La fecha final no es válida.");
  }

  if (endAt <= startAt) {
    throw new Error("La fecha final debe ser posterior a la fecha inicial.");
  }
}

function validateShiftTimes(startAt: Date, endAt: Date) {
  validateDateRange(startAt, endAt);

  const durationMs = endAt.getTime() - startAt.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  if (durationHours > MAX_SHIFT_DURATION_HOURS) {
    throw new Error(
      `La duración del turno no puede superar ${MAX_SHIFT_DURATION_HOURS} horas.`
    );
  }
}

function normalizeNotes(notes?: string | null) {
  if (notes == null) {
    return null;
  }

  const trimmed = notes.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function extractDate(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildDateTime(baseDate: Date, minutes: number) {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  date.setHours(hours, remainingMinutes, 0, 0);

  return date;
}

function buildShiftEndDateTime(
  baseDate: Date,
  endMinute: number,
  crossesMidnight: boolean
) {
  const endAt = buildDateTime(baseDate, endMinute);

  if (crossesMidnight) {
    endAt.setDate(endAt.getDate() + 1);
  }

  return endAt;
}

async function validateEmployeeExists(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, isActive: true },
  });

  if (!employee) {
    throw new Error("El empleado no existe.");
  }

  if (!employee.isActive) {
    throw new Error("No se puede asignar un turno a un empleado inactivo.");
  }
}

async function validateWorkplaceExists(workplaceId: string) {
  const workplace = await prisma.workplace.findUnique({
    where: { id: workplaceId },
    select: { id: true, isActive: true },
  });

  if (!workplace) {
    throw new Error("El centro no existe.");
  }

  if (!workplace.isActive) {
    throw new Error("No se puede asignar un turno en un centro inactivo.");
  }
}

async function validateDepartmentExists(departmentId: string) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true, isActive: true, workplaceId: true },
  });

  if (!department) {
    throw new Error("El departamento no existe.");
  }

  if (!department.isActive) {
    throw new Error("No se puede asignar un turno en un departamento inactivo.");
  }
}

async function validateWorkAreaExists(workAreaId: string) {
  const workArea = await prisma.workArea.findUnique({
    where: { id: workAreaId },
    select: { id: true, isActive: true, departmentId: true },
  });

  if (!workArea) {
    throw new Error("La zona no existe.");
  }

  if (!workArea.isActive) {
    throw new Error("No se puede asignar un turno en una zona inactiva.");
  }
}

async function validateJobCategoryExists(jobCategoryId: string) {
  const jobCategory = await prisma.jobCategory.findUnique({
    where: { id: jobCategoryId },
    select: { id: true, isActive: true },
  });

  if (!jobCategory) {
    throw new Error("La categoría profesional no existe.");
  }

  if (!jobCategory.isActive) {
    throw new Error(
      "No se puede asignar un turno con una categoría profesional inactiva."
    );
  }
}

async function validateShiftMasterExists(shiftMasterId: string) {
  const shiftMaster = await prisma.shiftMaster.findUnique({
    where: { id: shiftMasterId },
    select: {
      id: true,
      workplaceId: true,
      departmentId: true,
      workAreaId: true,
      startMinute: true,
      endMinute: true,
      crossesMidnight: true,
      isActive: true,
    },
  });

  if (!shiftMaster) {
    throw new Error("El maestro de turno no existe.");
  }

  if (!shiftMaster.isActive) {
    throw new Error("No se puede usar un maestro de turno inactivo.");
  }

  return shiftMaster;
}

async function validateDepartmentBelongsToWorkplace(
  departmentId: string,
  workplaceId: string
) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true, workplaceId: true },
  });

  if (!department) {
    throw new Error("El departamento no existe.");
  }

  if (department.workplaceId !== workplaceId) {
    throw new Error("El departamento no pertenece al centro indicado.");
  }
}

async function validateWorkAreaBelongsToDepartment(
  workAreaId: string,
  departmentId: string
) {
  const workArea = await prisma.workArea.findUnique({
    where: { id: workAreaId },
    select: { id: true, departmentId: true },
  });

  if (!workArea) {
    throw new Error("La zona no existe.");
  }

  if (workArea.departmentId !== departmentId) {
    throw new Error("La zona no pertenece al departamento indicado.");
  }
}

async function validateEmployeeOrganization(
  employeeId: string,
  workplaceId: string,
  departmentId: string
) {
  const [employeeWorkplace, employeeDepartment] = await Promise.all([
    prisma.employeeWorkplace.findFirst({
      where: {
        employeeId,
        workplaceId,
      },
      select: { id: true },
    }),
    prisma.employeeDepartment.findFirst({
      where: {
        employeeId,
        departmentId,
      },
      select: { id: true },
    }),
  ]);

  if (!employeeWorkplace) {
    throw new Error("El empleado no está asignado al centro indicado.");
  }

  if (!employeeDepartment) {
    throw new Error("El empleado no está asignado al departamento indicado.");
  }
}

async function validateActiveContractAtDate(employeeId: string, date: Date) {
  const contract = await prisma.employeeContract.findFirst({
    where: {
      employeeId,
      startDate: {
        lte: date,
      },
      OR: [
        {
          endDate: null,
        },
        {
          endDate: {
            gte: date,
          },
        },
      ],
    },
    orderBy: {
      startDate: "desc",
    },
    select: {
      id: true,
      jobCategoryId: true,
    },
  });

  if (!contract) {
    throw new Error("El empleado no tiene un contrato activo en la fecha del turno.");
  }

  return contract;
}

async function validateJobCategoryMatchesActiveContract(
  employeeId: string,
  jobCategoryId: string,
  date: Date
) {
  const contract = await validateActiveContractAtDate(employeeId, date);

  if (contract.jobCategoryId !== jobCategoryId) {
    throw new Error(
      "La categoría profesional del turno no coincide con la categoría del contrato activo."
    );
  }
}

async function validateEmployeeOverlap(
  employeeId: string,
  startAt: Date,
  endAt: Date,
  excludeShiftId?: string
) {
  const overlappingShifts = await shiftRepository.findEmployeeOverlappingShifts(
    employeeId,
    startAt,
    endAt,
    excludeShiftId
  );

  if (overlappingShifts.length > 0) {
    throw new Error("El empleado ya tiene otro turno solapado en ese rango horario.");
  }
}

async function validateApprovedFullDayAbsenceConflict(
  employeeId: string,
  startAt: Date,
  endAt: Date
) {
  const shiftStartDate = dateOnlyToUtcNoonDate(formatLocalDateOnly(startAt));
  const shiftEndDate = dateOnlyToUtcNoonDate(formatLocalDateOnly(endAt));

  const conflict = await prisma.absence.findFirst({
    where: {
      employeeId,
      status: "APPROVED",
      unit: "FULL_DAY",
      startDate: {
        lte: shiftEndDate,
      },
      endDate: {
        gte: shiftStartDate,
      },
    },
    select: {
      id: true,
    },
  });

  if (conflict) {
    throw new Error(
      "No se puede asignar el turno porque el empleado tiene una ausencia aprobada de día completo en ese rango."
    );
  }
}
