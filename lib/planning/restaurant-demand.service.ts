import type { RestaurantServiceType } from "@prisma/client";
import { restaurantCoverageRuleService } from "./restaurant-coverage-rule.service";

type CalculateRestaurantDemandInput = {
  workplaceId: string;
  date: Date;
  breakfastCovers: number;
  lunchCovers: number;
  dinnerCovers: number;
};

type DemandLine = {
  serviceType: RestaurantServiceType;
  covers: number;
  ratioCoversPerEmployee: number;
  employeesNeeded: number;
};

export const restaurantDemandService = {
  async calculateDailyDemand(
    input: CalculateRestaurantDemandInput
  ): Promise<DemandLine[]> {
    const services: Array<{ serviceType: RestaurantServiceType; covers: number }> = [
      { serviceType: "BREAKFAST", covers: input.breakfastCovers },
      { serviceType: "LUNCH", covers: input.lunchCovers },
      { serviceType: "DINNER", covers: input.dinnerCovers },
    ];

    const result: DemandLine[] = [];

    for (const service of services) {
      const rule = await restaurantCoverageRuleService.getActiveByDate(
        input.workplaceId,
        service.serviceType,
        input.date
      );

      if (!rule) {
        throw new Error(
          `No existe una regla activa para ${service.serviceType} en la fecha indicada`
        );
      }

      result.push({
        serviceType: service.serviceType,
        covers: service.covers,
        ratioCoversPerEmployee: rule.ratioCoversPerEmployee,
        employeesNeeded: Math.ceil(service.covers / rule.ratioCoversPerEmployee),
      });
    }

    return result;
  },
};