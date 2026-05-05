import type { RestaurantServiceType } from "@prisma/client";
import { restaurantCoverageRuleRepository } from "./restaurant-coverage-rule.repository";

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

export const restaurantCoverageRuleService = {
  async getById(id: string) {
    return restaurantCoverageRuleRepository.findById(id);
  },

  async list(input?: {
    workplaceId?: string;
    serviceType?: RestaurantServiceType;
    isActive?: boolean;
  }) {
    return restaurantCoverageRuleRepository.findMany(input);
  },

  async getActiveByDate(
    workplaceId: string,
    serviceType: RestaurantServiceType,
    date: Date
  ) {
    return restaurantCoverageRuleRepository.findActiveByDate(
      workplaceId,
      serviceType,
      date
    );
  },

  async create(input: CreateRestaurantCoverageRuleInput) {
    if (input.ratioCoversPerEmployee <= 0) {
      throw new Error("El ratio debe ser mayor que 0");
    }

   if (input.validTo && input.validFrom > input.validTo) {
  throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
}

    if (input.isActive !== false) {
      const overlappingRule =
        await restaurantCoverageRuleRepository.findOverlappingRule({
          workplaceId: input.workplaceId,
          serviceType: input.serviceType,
          validFrom: input.validFrom,
          validTo: input.validTo,
        });

      if (overlappingRule) {
        throw new Error("Ya existe una regla activa solapada para ese servicio");
      }
    }

    return restaurantCoverageRuleRepository.create({
      workplaceId: input.workplaceId,
      serviceType: input.serviceType,
      ratioCoversPerEmployee: input.ratioCoversPerEmployee,
      validFrom: input.validFrom,
      validTo: input.validTo,
      isActive: input.isActive,
    });
  },

  async update(id: string, input: UpdateRestaurantCoverageRuleInput) {
    const existing = await restaurantCoverageRuleRepository.findById(id);

    if (!existing) {
      throw new Error("Regla de cobertura no encontrada");
    }

    const nextWorkplaceId = input.workplaceId ?? existing.workplaceId;
    const nextServiceType = input.serviceType ?? existing.serviceType;
    const nextRatio =
      input.ratioCoversPerEmployee ?? existing.ratioCoversPerEmployee;
    const nextValidFrom = input.validFrom ?? existing.validFrom;
    const nextValidTo = input.validTo ?? existing.validTo;
    const nextIsActive = input.isActive ?? existing.isActive;

    if (nextRatio <= 0) {
      throw new Error("El ratio debe ser mayor que 0");
    }

    if (nextValidTo && nextValidFrom > nextValidTo) {
  throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
}

    if (nextIsActive) {
      const overlappingRule =
        await restaurantCoverageRuleRepository.findOverlappingRule({
          workplaceId: nextWorkplaceId,
          serviceType: nextServiceType,
          validFrom: nextValidFrom,
          validTo: nextValidTo,
          excludeId: id,
        });

      if (overlappingRule) {
        throw new Error("Ya existe una regla activa solapada para ese servicio");
      }
    }

    return restaurantCoverageRuleRepository.update(id, input);
  },

  async delete(id: string) {
    const existing = await restaurantCoverageRuleRepository.findById(id);

    if (!existing) {
      throw new Error("Regla de cobertura no encontrada");
    }

    return restaurantCoverageRuleRepository.delete(id);
  },
};