import { Prisma, Department } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type DepartmentListFilters = {
  workplaceId?: string;
  isActive?: boolean;
};

export type CreateDepartmentInput = {
  workplaceId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateDepartmentInput = {
  code?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

const departmentBaseSelect = {
  id: true,
  workplaceId: true,
  code: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DepartmentSelect;

const departmentWithWorkplaceSelect = {
  ...departmentBaseSelect,
  workplace: {
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
    },
  },
} satisfies Prisma.DepartmentSelect;

export const departmentRepository = {
  async findMany(filters: DepartmentListFilters = {}) {
    return prisma.department.findMany({
      where: {
        ...(filters.workplaceId ? { workplaceId: filters.workplaceId } : {}),
        ...(typeof filters.isActive === "boolean" ? { isActive: filters.isActive } : {}),
      },
      select: departmentWithWorkplaceSelect,
      orderBy: [{ name: "asc" }],
    });
  },

  async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      select: departmentWithWorkplaceSelect,
    });
  },

  async findByCodeInWorkplace(workplaceId: string, code: string) {
    return prisma.department.findFirst({
      where: {
        workplaceId,
        code,
      },
      select: departmentBaseSelect,
    });
  },

  async findByNameInWorkplace(workplaceId: string, name: string) {
    return prisma.department.findFirst({
      where: {
        workplaceId,
        name,
      },
      select: departmentBaseSelect,
    });
  },

  async create(data: CreateDepartmentInput) {
    return prisma.department.create({
      data: {
        workplaceId: data.workplaceId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
      select: departmentWithWorkplaceSelect,
    });
  },

  async update(id: string, data: UpdateDepartmentInput) {
    return prisma.department.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: departmentWithWorkplaceSelect,
    });
  },

  async delete(id: string): Promise<Department> {
    return prisma.department.delete({
      where: { id },
    });
  },

  async countByWorkplace(workplaceId: string) {
    return prisma.department.count({
      where: { workplaceId },
    });
  },
};