import { Prisma, QuadrantGroup } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type QuadrantGroupListFilters = {
  workAreaId?: string;
  departmentId?: string;
  isActive?: boolean;
};

export type CreateQuadrantGroupInput = {
  workAreaId: string;
  code: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

export type UpdateQuadrantGroupInput = {
  code?: string;
  name?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

const quadrantGroupBaseSelect = {
  id: true,
  workAreaId: true,
  code: true,
  name: true,
  description: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.QuadrantGroupSelect;

const quadrantGroupWithContextSelect = {
  ...quadrantGroupBaseSelect,
  workArea: {
    select: {
      id: true,
      departmentId: true,
      code: true,
      name: true,
      isActive: true,
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
    },
  },
} satisfies Prisma.QuadrantGroupSelect;

export const quadrantGroupRepository = {
  async findMany(filters: QuadrantGroupListFilters = {}) {
    return prisma.quadrantGroup.findMany({
      where: {
        ...(filters.workAreaId ? { workAreaId: filters.workAreaId } : {}),
        ...(filters.departmentId
          ? {
              workArea: {
                departmentId: filters.departmentId,
              },
            }
          : {}),
        ...(typeof filters.isActive === "boolean" ? { isActive: filters.isActive } : {}),
      },
      select: quadrantGroupWithContextSelect,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  },

  async findById(id: string) {
    return prisma.quadrantGroup.findUnique({
      where: { id },
      select: quadrantGroupWithContextSelect,
    });
  },

  async findByWorkArea(workAreaId: string) {
    return prisma.quadrantGroup.findMany({
      where: { workAreaId },
      select: quadrantGroupWithContextSelect,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  },

  async findByCodeInWorkArea(workAreaId: string, code: string) {
    return prisma.quadrantGroup.findFirst({
      where: {
        workAreaId,
        code,
      },
      select: quadrantGroupBaseSelect,
    });
  },

  async findByNameInWorkArea(workAreaId: string, name: string) {
    return prisma.quadrantGroup.findFirst({
      where: {
        workAreaId,
        name,
      },
      select: quadrantGroupBaseSelect,
    });
  },

  async create(data: CreateQuadrantGroupInput) {
    return prisma.quadrantGroup.create({
      data: {
        workAreaId: data.workAreaId,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
      select: quadrantGroupWithContextSelect,
    });
  },

  async update(id: string, data: UpdateQuadrantGroupInput) {
    return prisma.quadrantGroup.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: quadrantGroupWithContextSelect,
    });
  },

  async delete(id: string): Promise<QuadrantGroup> {
    return prisma.quadrantGroup.delete({
      where: { id },
    });
  },

  async countByWorkArea(workAreaId: string) {
    return prisma.quadrantGroup.count({
      where: { workAreaId },
    });
  },
};