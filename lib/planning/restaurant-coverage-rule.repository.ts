import type { ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FindManyInput = {
  workplaceId?: string;
  serviceType?: ServiceType;
  isActive?: boolean;
};

export const restaurantCoverageRuleRepository = {
  async findById(id: string) {
    return prisma.restaurantCoverageRule.findUnique({
      where: { id },
      include: {
        workplace: true,
      },
    });
  },

  async findMany(input: FindManyInput = {}) {
    return prisma.restaurantCoverageRule.findMany({
      where: {
        ...(input.workplaceId ? { workplaceId: input.workplaceId } : {}),
        ...(input.serviceType ? { serviceType: input.serviceType } : {}),
        ...(typeof input.isActive === "boolean"
          ? { isActive: input.isActive }
          : {}),
      },
      include: {
        workplace: true,
      },
      orderBy: [{ validFrom: "desc" }, { serviceType: "asc" }],
    });
  },

  async findActiveByDate(
    workplaceId: string,
    serviceType: ServiceType,
    date: Date
  ) {
    return prisma.restaurantCoverageRule.findFirst({
      where: {
        workplaceId,
        serviceType,
        isActive: true,
        validFrom: {
          lte: date,
        },
        validTo: {
          gte: date,
        },
      },
      include: {
        workplace: true,
      },
      orderBy: {
        validFrom: "desc",
      },
    });
  },

  async findOverlappingRule(input: {
    workplaceId: string;
    serviceType: ServiceType;
    validFrom: Date;
    validTo: Date;
    excludeId?: string;
  }) {
    return prisma.restaurantCoverageRule.findFirst({
      where: {
        workplaceId: input.workplaceId,
        serviceType: input.serviceType,
        isActive: true,
        ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
        validFrom: {
          lte: input.validTo,
        },
        validTo: {
          gte: input.validFrom,
        },
      },
    });
  },

  async create(data: {
    workplaceId: string;
    serviceType: ServiceType;
    ratioCoversPerEmployee: number;
    validFrom: Date;
    validTo: Date;
    isActive?: boolean;
  }) {
    return prisma.restaurantCoverageRule.create({
      data: {
        workplaceId: data.workplaceId,
        serviceType: data.serviceType,
        ratioCoversPerEmployee: data.ratioCoversPerEmployee,
        validFrom: data.validFrom,
        validTo: data.validTo,
        isActive: data.isActive ?? true,
      },
      include: {
        workplace: true,
      },
    });
  },

  async update(
    id: string,
    data: {
      workplaceId?: string;
      serviceType?: ServiceType;
      ratioCoversPerEmployee?: number;
      validFrom?: Date;
      validTo?: Date;
      isActive?: boolean;
    }
  ) {
    return prisma.restaurantCoverageRule.update({
      where: { id },
      data,
      include: {
        workplace: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.restaurantCoverageRule.delete({
      where: { id },
    });
  },
};