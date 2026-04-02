import type { ShiftMasterType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const shiftMasterRepository = {
  async findById(id: string) {
    return prisma.shiftMaster.findUnique({
      where: { id },
      include: {
        workplace: true,
        department: true,
        jobCategory: true,
      },
    });
  },

  async findAll() {
    return prisma.shiftMaster.findMany({
      include: {
        workplace: true,
        department: true,
        jobCategory: true,
      },
      orderBy: [
        { workplace: { name: "asc" } },
        { department: { name: "asc" } },
        { name: "asc" },
      ],
    });
  },

  async findByWorkplace(workplaceId: string) {
    return prisma.shiftMaster.findMany({
      where: { workplaceId },
      include: {
        workplace: true,
        department: true,
        jobCategory: true,
      },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    });
  },

  async findByDepartment(departmentId: string) {
    return prisma.shiftMaster.findMany({
      where: { departmentId },
      include: {
        workplace: true,
        department: true,
        jobCategory: true,
      },
      orderBy: [{ name: "asc" }],
    });
  },

  async create(data: {
    code: string;
    name: string;
    description?: string | null;
    workplaceId: string;
    departmentId: string;
    jobCategoryId?: string | null;
    type?: ShiftMasterType;
    startMinute: number;
    endMinute: number;
    crossesMidnight?: boolean;
    isPartial?: boolean;
    backgroundColor?: string | null;
    coversBreakfast?: boolean;
    coversLunch?: boolean;
    coversDinner?: boolean;
    countsForRoomAssignment?: boolean;
    isActive?: boolean;
  }) {
    return prisma.shiftMaster.create({
      data,
    });
  },

  async update(
    id: string,
    data: {
      code?: string;
      name?: string;
      description?: string | null;
      workplaceId?: string;
      departmentId?: string;
      jobCategoryId?: string | null;
      type?: ShiftMasterType;
      startMinute?: number;
      endMinute?: number;
      crossesMidnight?: boolean;
      isPartial?: boolean;
      backgroundColor?: string | null;
      coversBreakfast?: boolean;
      coversLunch?: boolean;
      coversDinner?: boolean;
      countsForRoomAssignment?: boolean;
      isActive?: boolean;
    }
  ) {
    return prisma.shiftMaster.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.shiftMaster.delete({
      where: { id },
    });
  },
};