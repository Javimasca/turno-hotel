import type { RestaurantServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { restaurantCoverageRuleService } from "./restaurant-coverage-rule.service";

type CalculateRestaurantDemandInput = {
  workplaceId: string;
  departmentId: string;
  date: Date;
  breakfastCovers: number;
  lunchCovers: number;
  dinnerCovers: number;
};

type DemandLineStatus = "OK" | "MISSING_RULE";

type DemandLine = {
  serviceType: RestaurantServiceType;
  workAreaId: string | null;
  covers: number;
  ratioCoversPerEmployee: number | null;
  employeesNeeded: number | null;
  status: DemandLineStatus;
};

const WORKAREA_DISTRIBUTION: Record<string, number> = {
  BUFFET: 0.7,
  CARTA: 0.2,
  BAR: 0.1,
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

    const workAreas = await prisma.workArea.findMany({
      where: {
        departmentId: input.departmentId,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    const result: DemandLine[] = [];

    for (const service of services) {
      const rule = await restaurantCoverageRuleService.getActiveByDate(
        input.workplaceId,
        service.serviceType,
        input.date
      );

      if (!rule) {
        result.push({
          serviceType: service.serviceType,
          workAreaId: null,
          covers: service.covers,
          ratioCoversPerEmployee: null,
          employeesNeeded: null,
          status: "MISSING_RULE",
        });
        continue;
      }

      const totalEmployees = calculateEmployeesNeeded(
        service.covers,
        rule.ratioCoversPerEmployee
      );

      const split = splitDemandByWorkArea(totalEmployees, workAreas);

      for (const item of split) {
        result.push({
          serviceType: service.serviceType,
          workAreaId: item.workAreaId,
          covers: service.covers,
          ratioCoversPerEmployee: rule.ratioCoversPerEmployee,
          employeesNeeded: item.employeesNeeded,
          status: "OK",
        });
      }
    }

    return result;
  },
};

function calculateEmployeesNeeded(covers: number, ratioCoversPerEmployee: number) {
  if (covers <= 0 || ratioCoversPerEmployee <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(covers / ratioCoversPerEmployee));
}

function splitDemandByWorkArea(
  totalEmployees: number,
  workAreas: Array<{ id: string; code: string }>
): Array<{ workAreaId: string; employeesNeeded: number }> {
  if (totalEmployees <= 0) {
    return [];
  }

  const weighted = workAreas
    .map((workArea) => ({
      workAreaId: workArea.id,
      ratio: WORKAREA_DISTRIBUTION[workArea.code] ?? 0,
    }))
    .filter((item) => item.ratio > 0);

  if (weighted.length === 0) {
    return [];
  }

  const base = weighted.map((item) => {
    const exact = totalEmployees * item.ratio;
    const floorValue = Math.floor(exact);

    return {
      workAreaId: item.workAreaId,
      exact,
      employeesNeeded: floorValue,
      remainder: exact - floorValue,
    };
  });

  let assigned = base.reduce((sum, item) => sum + item.employeesNeeded, 0);
  let remaining = totalEmployees - assigned;

  base.sort((a, b) => b.remainder - a.remainder);

  let index = 0;
  while (remaining > 0) {
    base[index % base.length].employeesNeeded += 1;
    remaining -= 1;
    index += 1;
  }

  return base
    .filter((item) => item.employeesNeeded > 0)
    .map((item) => ({
      workAreaId: item.workAreaId,
      employeesNeeded: item.employeesNeeded,
    }));
}
