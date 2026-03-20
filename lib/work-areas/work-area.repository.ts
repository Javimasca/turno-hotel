import { Prisma, WorkArea } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type WorkAreaListFilters = {
  departmentId?: string;
  isActive?: boolean;
};

export type CreateWorkAreaInput = {
  departmentId: string;
  code: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

export type UpdateWorkAreaInput = {
  code?: string;
  name?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

const workAreaBaseSelect = {
  id: true,
  departmentId: true,
  code: true,
  name: true,
  description: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkAreaSelect;

const workAreaWithDepartmentSelect = {
  ...workAreaBaseSelect,
  department: {
    select: {
      id: true,
      workplaceId: true,
      code: true,
      name: true,
      isActive: true,
      workplace: {
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
        },
      },
    },
  },
} satisfies Prisma.WorkAreaSelect;

export const workAreaRepository = {
  async findMany(filters: WorkAreaListFilters = {}) {
    return prisma.workArea.findMany({
      where: {
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
        ...(typeof filters.isActive === "boolean" ? { isActive: filters.isActive } : {}),
      },
      select: workAreaWithDepartmentSelect,
      orderBy: [
        { displayOrder: "asc" },
        { name: "asc" },
      ],
    });
  },

  async findById(id: string) {
    return prisma.workArea.findUnique({
      where: { id },
      select: workAreaWithDepartmentSelect,
    });
  },

  async findByDepartment(departmentId: string) {
    return prisma.workArea.findMany({
      where: { departmentId },
      select: workAreaWithDepartmentSelect,
      orderBy: [
        { displayOrder: "asc" },
        { name: "asc" },
      ],
    });
  },

  async findByCodeInDepartment(departmentId: string, code: string) {
    return prisma.workArea.findFirst({
      where: {
        departmentId,
        code,
      },
      select: workAreaBaseSelect,
    });
  },

  async findByNameInDepartment(departmentId: string, name: string) {
    return prisma.workArea.findFirst({
      where: {
        departmentId,
        name,
      },
      select: workAreaBaseSelect,
    });
  },

  async create(data: CreateWorkAreaInput) {
    return prisma.workArea.create({
      data: {
        departmentId: data.departmentId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
      select: workAreaWithDepartmentSelect,
    });
  },

  async update(id: string, data: UpdateWorkAreaInput) {
    return prisma.workArea.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: workAreaWithDepartmentSelect,
    });
  },

  async delete(id: string): Promise<WorkArea> {
    return prisma.workArea.delete({
      where: { id },
    });
  },

  async countByDepartment(departmentId: string) {
    return prisma.workArea.count({
      where: { departmentId },
    });
  },
};