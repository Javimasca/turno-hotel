import { prisma } from "@/lib/prisma";
import {
  dateOnlyToLocalEndOfDay,
  dateOnlyToLocalStartOfDay,
  formatDateOnly,
} from "@/lib/date-only";
import { AbsenceStatus, AvailabilityBlockType } from "@prisma/client";

export type CreateAbsenceInput = {
  employeeId: string;
  absenceTypeId: string;
  unit: "FULL_DAY" | "HOURLY";
  startDate: Date;
  endDate: Date;
  startMinutes: number | null;
  endMinutes: number | null;
  status: AbsenceStatus;
  notes: string | null;
  documentUrl: string | null;
};

export type UpdateAbsenceInput = Partial<CreateAbsenceInput>;

type FindAllFilters = {
  employeeIds?: string[];
};

const absenceInclude = {
  employee: true,
  absenceType: true,
} as const;

export const absenceRepository = {
  async findAll(filters: FindAllFilters = {}) {
    const employeeIds =
      filters.employeeIds?.filter((id) => id.trim().length > 0) ?? [];

    return prisma.absence.findMany({
      where:
        employeeIds.length > 0
          ? {
              employeeId: {
                in: employeeIds,
              },
            }
          : undefined,
      include: absenceInclude,
      orderBy: [{ startDate: "desc" }],
    });
  },

  async findById(id: string) {
    return prisma.absence.findUnique({
      where: { id },
      include: absenceInclude,
    });
  },

  async create(data: CreateAbsenceInput) {
    return prisma.absence.create({
      data,
      include: absenceInclude,
    });
  },

  async update(id: string, data: UpdateAbsenceInput) {
    return prisma.absence.update({
      where: { id },
      data,
      include: absenceInclude,
    });
  },

  async delete(id: string) {
    return prisma.absence.delete({
      where: { id },
      include: absenceInclude,
    });
  },

  async findEmployeesByDirectManagerId(managerEmployeeId: string) {
    return prisma.employee.findMany({
      where: {
        directManagerEmployeeId: managerEmployeeId,
      },
      select: {
        id: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  },

  /**
   * Devuelve ausencias candidatas a solape para validación en service.
   * La lógica fina de conflicto FULL_DAY / HOURLY se resuelve en el service.
   */
  async findForOverlapValidation(params: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
    excludeId?: string;
    statuses?: AbsenceStatus[];
  }) {
    return prisma.absence.findMany({
      where: {
        employeeId: params.employeeId,
        status: {
          in: params.statuses ?? [AbsenceStatus.PENDING, AbsenceStatus.APPROVED],
        },
        ...(params.excludeId
          ? {
              id: { not: params.excludeId },
            }
          : {}),
        AND: [
          {
            startDate: { lte: params.endDate },
          },
          {
            endDate: { gte: params.startDate },
          },
        ],
      },
      orderBy: [{ startDate: "asc" }],
    });
  },

  async existsShiftConflict(params: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const shift = await prisma.shift.findFirst({
      where: {
        employeeId: params.employeeId,
        startAt: {
          lte: endOfDay(params.endDate),
        },
        endAt: {
          gte: startOfDay(params.startDate),
        },
      },
      select: {
        id: true,
      },
    });

    return !!shift;
  },


async findShiftsInRange(params: {
  employeeId: string;
  startDate: Date;
  endDate: Date;
}) {
  return prisma.shift.findMany({
    where: {
      employeeId: params.employeeId,
      startAt: {
        lte: endOfDay(params.endDate),
      },
      endAt: {
        gte: startOfDay(params.startDate),
      },
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });
},

async existsDayOffConflict(params: {
  employeeId: string;
  startDate: Date;
  endDate: Date;
}) {
  const dayOff = await prisma.employeeAvailabilityBlock.findFirst({
    where: {
      employeeId: params.employeeId,
      date: {
        gte: startOfDay(params.startDate),
        lte: endOfDay(params.endDate),
      },
      type: {
        in: [AvailabilityBlockType.DAY_OFF, AvailabilityBlockType.UNAVAILABLE],
      },
    },
    select: {
      id: true,
    },
  });

  return !!dayOff;
},

  async findAbsenceTypeById(id: string) {
    return prisma.absenceType.findUnique({
      where: { id },
    });
  },

  async findEmployeeById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
    });
  },
};

function startOfDay(date: Date): Date {
  return dateOnlyToLocalStartOfDay(formatDateOnly(date));
}

function endOfDay(date: Date): Date {
  return dateOnlyToLocalEndOfDay(formatDateOnly(date));
}
