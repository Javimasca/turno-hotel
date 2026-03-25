import type { ShiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const shiftRepository = {
  async findById(id: string) {
    return prisma.shift.findUnique({
      where: { id },
      include: {
        employee: true,
        workplace: true,
        department: true,
        jobCategory: true,
        shiftMaster: true,
      },
    });
  },

  async findByRange(startAt: Date, endAt: Date) {
    return prisma.shift.findMany({
      where: {
        startAt: {
          lt: endAt,
        },
        endAt: {
          gt: startAt,
        },
      },
      include: {
        employee: true,
        workplace: true,
        department: true,
        jobCategory: true,
        shiftMaster: true,
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
        jobCategory: true,
        shiftMaster: true,
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
        jobCategory: true,
        shiftMaster: true,
      },
    });
  },

  async update(
    id: string,
    data: {
      employeeId?: string;
      workplaceId?: string;
      departmentId?: string;
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
        jobCategory: true,
        shiftMaster: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.shift.delete({
      where: { id },
    });
  },
};