import type { ShiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FindByRangeInput = {
  startAt: Date;
  endAt: Date;
  workplaceId?: string;
  departmentId?: string;
  workAreaId?: string;
};

export const shiftRepository = {
  async findById(id: string) {
    return prisma.shift.findUnique({
      where: { id },
      include: {
        employee: true,
        workplace: true,
        department: true,
        workArea: true,
        jobCategory: true,
        shiftMaster: {
          include: {
            workArea: true,
          },
        },
      },
    });
  },

  async findByRange(input: FindByRangeInput) {
    return prisma.shift.findMany({
      where: {
        startAt: {
          lt: input.endAt,
        },
        endAt: {
          gt: input.startAt,
        },
        ...(input.workplaceId ? { workplaceId: input.workplaceId } : {}),
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        ...(input.workAreaId ? { workAreaId: input.workAreaId } : {}),
      },
      include: {
        employee: true,
        workplace: true,
        department: true,
        workArea: true,
        jobCategory: true,
        shiftMaster: {
          include: {
            workArea: true,
          },
        },
      },
      orderBy: {
        startAt: "asc",
      },
    });
  },

  async findByEmployee(employeeId: string) {
    return prisma.shift.findMany({
      where: { employeeId },
      include: {
        workplace: true,
        department: true,
        workArea: true,
        jobCategory: true,
        shiftMaster: {
          include: {
            workArea: true,
          },
        },
      },
      orderBy: {
        startAt: "desc",
      },
    });
  },

  async findEmployeeOverlappingShifts(
    employeeId: string,
    startAt: Date,
    endAt: Date,
    excludeShiftId?: string
  ) {
    return prisma.shift.findMany({
      where: {
        employeeId,
        id: excludeShiftId ? { not: excludeShiftId } : undefined,
        startAt: {
          lt: endAt,
        },
        endAt: {
          gt: startAt,
        },
      },
    });
  },

  async create(data: {
    employeeId: string;
    workplaceId: string;
    departmentId: string;
    workAreaId?: string | null;
    jobCategoryId?: string | null;
    shiftMasterId?: string | null;
    startAt: Date;
    endAt: Date;
    status?: ShiftStatus;
    notes?: string | null;
  }) {
    return prisma.shift.create({
      data,
      include: {
        employee: true,
        workplace: true,
        department: true,
        workArea: true,
        jobCategory: true,
        shiftMaster: {
          include: {
            workArea: true,
          },
        },
      },
    });
  },

  async update(
    id: string,
    data: {
      employeeId?: string;
      workplaceId?: string;
      departmentId?: string;
      workAreaId?: string | null;
      jobCategoryId?: string | null;
      shiftMasterId?: string | null;
      startAt?: Date;
      endAt?: Date;
      status?: ShiftStatus;
      notes?: string | null;
    }
  ) {
    return prisma.shift.update({
      where: { id },
      data,
      include: {
        employee: true,
        workplace: true,
        department: true,
        workArea: true,
        jobCategory: true,
        shiftMaster: {
          include: {
            workArea: true,
          },
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.shift.delete({
      where: { id },
    });
  },
};