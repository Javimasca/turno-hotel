import { prisma } from "@/lib/prisma";
import { AbsenceStatus } from "@prisma/client";

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

const absenceInclude = {
  employee: true,
  absenceType: true,
} as const;

export const absenceRepository = {
  async findAll() {
    return prisma.absence.findMany({
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

  async findOverlap(params: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
    excludeId?: string;
    statuses: AbsenceStatus[];
  }) {
    return prisma.absence.findFirst({
      where: {
        employeeId: params.employeeId,
        status: { in: params.statuses },
        ...(params.excludeId && {
          id: { not: params.excludeId },
        }),
        AND: [
          {
            startDate: { lte: params.endDate },
          },
          {
            endDate: { gte: params.startDate },
          },
        ],
      },
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
          lte: new Date(params.endDate),
        },
        endAt: {
          gte: new Date(params.startDate),
        },
      },
    });

    return !!shift;
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