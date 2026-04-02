import { prisma } from "@/lib/prisma";
import { shiftRepository } from "@/lib/shifts/shift.repository";
import type {
  CreateShiftInput,
  UpdateShiftInput,
} from "@/lib/shifts/shift.types";

const MAX_SHIFT_DURATION_HOURS = 16;

type GetShiftsByRangeInput = {
  startAt: Date;
  endAt: Date;
  workplaceId?: string;
  departmentId?: string;
  workAreaId?: string;
};

export const shiftService = {
  async getById(id: string) {
    return shiftRepository.findById(id);
  },

  async getByRange(input: GetShiftsByRangeInput) {
    validateDateRange(input.startAt, input.endAt);

    return shiftRepository.findByRange(input);
  },

  async create(input: CreateShiftInput) {
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

  async update(id: string, input: UpdateShiftInput) {
    const existingShift = await shiftRepository.findById(id);

    if (!existingShift) {
      throw new Error("El turno no existe.");
    }

    const resolvedData = await resolveShiftUpdateData(existingShift, input);

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

  async remove(id: string) {
    const existingShift = await shiftRepository.findById(id);

    if (!existingShift) {
      throw new Error("El turno no existe.");
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