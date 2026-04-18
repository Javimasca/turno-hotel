import type { RestaurantServiceType } from "@prisma/client";
import { restaurantDemandService } from "./restaurant-demand.service";

type GenerateRestaurantShiftProposalInput = {
  workplaceId: string;
  departmentId: string;
  date: Date;
  breakfastCovers: number;
  lunchCovers: number;
  dinnerCovers: number;
};

type ShiftProposal = {
  serviceType: RestaurantServiceType;
  startAt: Date;
  endAt: Date;
  employeesNeeded: number;
};

export const restaurantShiftGeneratorService = {
  async generateDailyProposal(
    input: GenerateRestaurantShiftProposalInput
  ): Promise<ShiftProposal[]> {
    const demand = await restaurantDemandService.calculateDailyDemand({
      workplaceId: input.workplaceId,
      date: input.date,
      breakfastCovers: input.breakfastCovers,
      lunchCovers: input.lunchCovers,
      dinnerCovers: input.dinnerCovers,
    });

    return demand.map((line) => ({
      serviceType: line.serviceType,
      startAt: getServiceStartAt(input.date, line.serviceType),
      endAt: getServiceEndAt(input.date, line.serviceType),
      employeesNeeded: line.employeesNeeded,
    }));
  },
};

function getServiceStartAt(
  date: Date,
  serviceType: RestaurantServiceType
): Date {
  const result = new Date(date);

  if (serviceType === "BREAKFAST") {
    result.setHours(7, 0, 0, 0);
    return result;
  }

  if (serviceType === "LUNCH") {
    result.setHours(12, 0, 0, 0);
    return result;
  }

  result.setHours(19, 0, 0, 0);
  return result;
}

function getServiceEndAt(
  date: Date,
  serviceType: RestaurantServiceType
): Date {
  const result = new Date(date);

  if (serviceType === "BREAKFAST") {
    result.setHours(11, 0, 0, 0);
    return result;
  }

  if (serviceType === "LUNCH") {
    result.setHours(16, 0, 0, 0);
    return result;
  }

  result.setHours(23, 0, 0, 0);
  return result;
}