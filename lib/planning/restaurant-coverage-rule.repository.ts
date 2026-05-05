import type { Prisma, RestaurantServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FindManyInput = {
  workplaceId?: string;
  serviceType?: RestaurantServiceType;
  isActive?: boolean;
};

type FindOverlappingRuleInput = {
  workplaceId: string;
  serviceType: RestaurantServiceType;
  validFrom: Date;
  validTo: Date | null;
  excludeId?: string;
};

type CreateRestaurantCoverageRuleInput = {
  workplaceId: string;
  serviceType: RestaurantServiceType;
  ratioCoversPerEmployee: number;
  validFrom: Date;
  validTo: Date | null;
  isActive?: boolean;
};

type UpdateRestaurantCoverageRuleInput = {
  workplaceId?: string;
  serviceType?: RestaurantServiceType;
  ratioCoversPerEmployee?: number;
  validFrom?: Date;
  validTo?: Date | null;
  isActive?: boolean;
};

export const restaurantCoverageRuleRepository = {
  async findById(id: string) {
    return prisma.restaurantCoverageRule.findUnique({
      where: { id },
    });
  },

  async findMany(input?: FindManyInput) {
    const where: Prisma.RestaurantCoverageRuleWhereInput = {};

    if (input?.workplaceId) {
      where.workplaceId = input.workplaceId;
    }

    if (input?.serviceType) {
      where.serviceType = input.serviceType;
    }

    if (typeof input?.isActive === "boolean") {
      where.isActive = input.isActive;
    }

    return prisma.restaurantCoverageRule.findMany({
      where,
      orderBy: [
        { serviceType: "asc" },
        { validFrom: "desc" },
      ],
    });
  },

  async findActiveByDate(
    workplaceId: string,
    serviceType: RestaurantServiceType,
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
        OR: [
          { validTo: null },
          {
            validTo: {
              gte: date,
            },
          },
        ],
      },
      orderBy: {
        validFrom: "desc",
      },
    });
  },

  async findOverlappingRule(input: FindOverlappingRuleInput) {
    const farFuture = new Date("2100-01-01T00:00:00.000Z");

    return prisma.restaurantCoverageRule.findFirst({
      where: {
        workplaceId: input.workplaceId,
        serviceType: input.serviceType,
        isActive: true,
        ...(input.excludeId
          ? {
              id: {
                not: input.excludeId,
              },
            }
          : {}),
        AND: [
          {
            validFrom: {
              lte: input.validTo ?? farFuture,
            },
          },
          {
            OR: [
              { validTo: null },
              {
                validTo: {
                  gte: input.validFrom,
                },
              },
            ],
          },
        ],
      },
      orderBy: {
        validFrom: "desc",
      },
    });
  },

  async create(input: CreateRestaurantCoverageRuleInput) {
    return prisma.restaurantCoverageRule.create({
      data: {
        workplaceId: input.workplaceId,
        serviceType: input.serviceType,
        ratioCoversPerEmployee: input.ratioCoversPerEmployee,
        validFrom: input.validFrom,
        validTo: input.validTo,
        isActive: input.isActive ?? true,
      },
    });
  },

  async update(id: string, input: UpdateRestaurantCoverageRuleInput) {
    return prisma.restaurantCoverageRule.update({
      where: { id },
      data: {
        ...(input.workplaceId !== undefined
          ? { workplaceId: input.workplaceId }
          : {}),
        ...(input.serviceType !== undefined
          ? { serviceType: input.serviceType }
          : {}),
        ...(input.ratioCoversPerEmployee !== undefined
          ? { ratioCoversPerEmployee: input.ratioCoversPerEmployee }
          : {}),
        ...(input.validFrom !== undefined
          ? { validFrom: input.validFrom }
          : {}),
        ...(input.validTo !== undefined ? { validTo: input.validTo } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  },

  async delete(id: string) {
    return prisma.restaurantCoverageRule.delete({
      where: { id },
    });
  },
};