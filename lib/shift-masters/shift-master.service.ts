import type { ShiftMasterType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { shiftMasterRepository } from "@/lib/shift-masters/shift-master.repository";

type CreateShiftMasterInput = {
  code: string;
  name: string;
  description?: string | null;
  workplaceId: string;
  departmentId: string;
  type?: ShiftMasterType;
  startMinute: number;
  endMinute: number;
  crossesMidnight?: boolean;
  isPartial?: boolean;
  coversBreakfast?: boolean;
  coversLunch?: boolean;
  coversDinner?: boolean;
  countsForRoomAssignment?: boolean;
  isActive?: boolean;
};

type UpdateShiftMasterInput = {
  code?: string;
  name?: string;
  description?: string | null;
  workplaceId?: string;
  departmentId?: string;
  type?: ShiftMasterType;
  startMinute?: number;
  endMinute?: number;
  crossesMidnight?: boolean;
  isPartial?: boolean;
  coversBreakfast?: boolean;
  coversLunch?: boolean;
  coversDinner?: boolean;
  countsForRoomAssignment?: boolean;
  isActive?: boolean;
};

const MINUTES_PER_DAY = 1440;

const MORNING_SHIFT_COLOR = "#FEF3C7";
const AFTERNOON_SHIFT_COLOR = "#B7791F";
const NIGHT_SHIFT_COLOR = "#0F172A";

export const shiftMasterService = {
  async getById(id: string) {
    return shiftMasterRepository.findById(id);
  },

  async getAll() {
    return shiftMasterRepository.findAll();
  },

  async getByWorkplace(workplaceId: string) {
    if (!workplaceId) {
      throw new Error("El centro es obligatorio.");
    }

    return shiftMasterRepository.findByWorkplace(workplaceId);
  },

  async getByDepartment(departmentId: string) {
    if (!departmentId) {
      throw new Error("El departamento es obligatorio.");
    }

    return shiftMasterRepository.findByDepartment(departmentId);
  },

  async create(input: CreateShiftMasterInput) {
    validateRequiredCreateFields(input);

    const normalizedCode = normalizeCode(input.code);
    const normalizedName = normalizeName(input.name);
    const normalizedDescription = normalizeDescription(input.description);

    const type = input.type ?? "GENERAL";
    const crossesMidnight = input.crossesMidnight ?? false;
    const isPartial = input.isPartial ?? false;
    const coversBreakfast = input.coversBreakfast ?? false;
    const coversLunch = input.coversLunch ?? false;
    const coversDinner = input.coversDinner ?? false;
    const countsForRoomAssignment = input.countsForRoomAssignment ?? false;
    const isActive = input.isActive ?? true;

    validateMinuteRange(input.startMinute, "La hora de entrada no es válida.");
    validateMinuteRange(input.endMinute, "La hora de salida no es válida.");
    validateTimeConsistency(
      input.startMinute,
      input.endMinute,
      crossesMidnight
    );
    validateTypeFlags(type, {
      coversBreakfast,
      coversLunch,
      coversDinner,
      countsForRoomAssignment,
    });

    await validateWorkplaceExists(input.workplaceId);
await validateDepartmentExists(input.departmentId);
await validateDepartmentBelongsToWorkplace(
  input.departmentId,
  input.workplaceId
);

await validateUniqueShiftMasterCode({
  departmentId: input.departmentId,
  code: normalizedCode,
});

const resolvedBackgroundColor = resolveShiftMasterBackgroundColor(
  input.endMinute
);

    return shiftMasterRepository.create({
      code: normalizedCode,
      name: normalizedName,
      description: normalizedDescription,
      workplaceId: input.workplaceId,
      departmentId: input.departmentId,
      type,
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      crossesMidnight,
      isPartial,
      backgroundColor: resolvedBackgroundColor,
      coversBreakfast,
      coversLunch,
      coversDinner,
      countsForRoomAssignment,
      isActive,
    });
  },

  async update(id: string, input: UpdateShiftMasterInput) {
    const existingShiftMaster = await shiftMasterRepository.findById(id);

    if (!existingShiftMaster) {
      throw new Error("El maestro de turno no existe.");
    }

    const nextCode =
      input.code === undefined
        ? existingShiftMaster.code
        : normalizeCode(input.code);

    const nextName =
      input.name === undefined
        ? existingShiftMaster.name
        : normalizeName(input.name);

    const nextDescription =
      input.description === undefined
        ? existingShiftMaster.description
        : normalizeDescription(input.description);

    const nextWorkplaceId = input.workplaceId ?? existingShiftMaster.workplaceId;
    const nextDepartmentId =
      input.departmentId ?? existingShiftMaster.departmentId;
    const nextType = input.type ?? existingShiftMaster.type;
    const nextStartMinute = input.startMinute ?? existingShiftMaster.startMinute;
    const nextEndMinute = input.endMinute ?? existingShiftMaster.endMinute;
    const nextCrossesMidnight =
      input.crossesMidnight ?? existingShiftMaster.crossesMidnight;
    const nextIsPartial = input.isPartial ?? existingShiftMaster.isPartial;
    const nextCoversBreakfast =
      input.coversBreakfast ?? existingShiftMaster.coversBreakfast;
    const nextCoversLunch =
      input.coversLunch ?? existingShiftMaster.coversLunch;
    const nextCoversDinner =
      input.coversDinner ?? existingShiftMaster.coversDinner;
    const nextCountsForRoomAssignment =
      input.countsForRoomAssignment ??
      existingShiftMaster.countsForRoomAssignment;
    const nextIsActive = input.isActive ?? existingShiftMaster.isActive;

    validateMinuteRange(nextStartMinute, "La hora de entrada no es válida.");
    validateMinuteRange(nextEndMinute, "La hora de salida no es válida.");
    validateTimeConsistency(
      nextStartMinute,
      nextEndMinute,
      nextCrossesMidnight
    );
    validateTypeFlags(nextType, {
      coversBreakfast: nextCoversBreakfast,
      coversLunch: nextCoversLunch,
      coversDinner: nextCoversDinner,
      countsForRoomAssignment: nextCountsForRoomAssignment,
    });

    await validateWorkplaceExists(nextWorkplaceId);
    await validateDepartmentExists(nextDepartmentId);
    await validateDepartmentBelongsToWorkplace(
      nextDepartmentId,
      nextWorkplaceId
    );

    const nextBackgroundColor =
      input.endMinute === undefined
        ? existingShiftMaster.backgroundColor
        : resolveShiftMasterBackgroundColor(nextEndMinute);

    return shiftMasterRepository.update(id, {
      code: nextCode,
      name: nextName,
      description: nextDescription,
      workplaceId: nextWorkplaceId,
      departmentId: nextDepartmentId,
      type: nextType,
      startMinute: nextStartMinute,
      endMinute: nextEndMinute,
      crossesMidnight: nextCrossesMidnight,
      isPartial: nextIsPartial,
      backgroundColor: nextBackgroundColor,
      coversBreakfast: nextCoversBreakfast,
      coversLunch: nextCoversLunch,
      coversDinner: nextCoversDinner,
      countsForRoomAssignment: nextCountsForRoomAssignment,
      isActive: nextIsActive,
    });
  },

  async remove(id: string) {
    const existingShiftMaster = await shiftMasterRepository.findById(id);

    if (!existingShiftMaster) {
      throw new Error("El maestro de turno no existe.");
    }

    return shiftMasterRepository.delete(id);
  },
};

function validateRequiredCreateFields(input: CreateShiftMasterInput) {
  if (!input.code?.trim()) {
    throw new Error("El código es obligatorio.");
  }

  if (!input.name?.trim()) {
    throw new Error("El nombre es obligatorio.");
  }

  if (!input.workplaceId) {
    throw new Error("El centro es obligatorio.");
  }

  if (!input.departmentId) {
    throw new Error("El departamento es obligatorio.");
  }

  if (input.startMinute === undefined || input.startMinute === null) {
    throw new Error("La hora de entrada es obligatoria.");
  }

  if (input.endMinute === undefined || input.endMinute === null) {
    throw new Error("La hora de salida es obligatoria.");
  }
}

function normalizeCode(code: string) {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    throw new Error("El código es obligatorio.");
  }

  return normalized;
}

function normalizeName(name: string) {
  const normalized = name.trim();

  if (!normalized) {
    throw new Error("El nombre es obligatorio.");
  }

  return normalized;
}

function normalizeDescription(description?: string | null) {
  if (description == null) {
    return null;
  }

  const normalized = description.trim();

  return normalized.length > 0 ? normalized : null;
}

function validateMinuteRange(value: number, message: string) {
  if (!Number.isInteger(value) || value < 0 || value >= MINUTES_PER_DAY) {
    throw new Error(message);
  }
}

function validateTimeConsistency(
  startMinute: number,
  endMinute: number,
  crossesMidnight: boolean
) {
  if (crossesMidnight) {
    if (startMinute === endMinute) {
      throw new Error(
        "La hora de entrada y salida no pueden ser iguales en un turno que cruza medianoche."
      );
    }

    return;
  }

  if (endMinute <= startMinute) {
    throw new Error(
      "La hora de salida debe ser posterior a la hora de entrada."
    );
  }
}

function validateTypeFlags(
  type: ShiftMasterType,
  flags: {
    coversBreakfast: boolean;
    coversLunch: boolean;
    coversDinner: boolean;
    countsForRoomAssignment: boolean;
  }
) {
  const hasRestaurantFlags =
    flags.coversBreakfast || flags.coversLunch || flags.coversDinner;

  if (type !== "RESTAURANTE" && hasRestaurantFlags) {
    throw new Error(
      "Los flags de desayuno, almuerzo o cena solo se pueden usar en turnos de tipo RESTAURANTE."
    );
  }

  if (type !== "PISOS" && flags.countsForRoomAssignment) {
    throw new Error(
      "La opción de contar para asignación de habitaciones solo se puede usar en turnos de tipo PISOS."
    );
  }
}

function resolveShiftMasterBackgroundColor(endMinute: number) {
  if (endMinute < 720) {
    return MORNING_SHIFT_COLOR;
  }

  if (endMinute < 1080) {
    return AFTERNOON_SHIFT_COLOR;
  }

  return NIGHT_SHIFT_COLOR;
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
    throw new Error("No se puede usar un centro inactivo.");
  }
}

async function validateDepartmentExists(departmentId: string) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true, isActive: true },
  });

  if (!department) {
    throw new Error("El departamento no existe.");
  }

  if (!department.isActive) {
    throw new Error("No se puede usar un departamento inactivo.");
  }
}

async function validateDepartmentBelongsToWorkplace(
  departmentId: string,
  workplaceId: string
) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { workplaceId: true },
  });

  if (!department) {
    throw new Error("El departamento no existe.");
  }

  if (department.workplaceId !== workplaceId) {
    throw new Error("El departamento no pertenece al centro indicado.");
  }
}

async function validateUniqueShiftMasterCode(input: {
  departmentId: string;
  code: string;
  excludeId?: string;
}) {
  const existingShiftMaster = await prisma.shiftMaster.findFirst({
    where: {
      departmentId: input.departmentId,
      code: input.code,
      ...(input.excludeId
        ? {
            NOT: {
              id: input.excludeId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  if (existingShiftMaster) {
    throw new Error(
      "Ya existe un turno maestro con ese código en este departamento."
    );
  }
}