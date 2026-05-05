import type { RestaurantServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
  workAreaId: string;
  shiftMasterId: string;
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
      departmentId: input.departmentId,
      date: input.date,
      breakfastCovers: input.breakfastCovers,
      lunchCovers: input.lunchCovers,
      dinnerCovers: input.dinnerCovers,
    });

    const shiftMasters = await prisma.shiftMaster.findMany({
      where: {
        workplaceId: input.workplaceId,
        departmentId: input.departmentId,
        type: "RESTAURANTE",
        isActive: true,
      },
      orderBy: [{ startMinute: "asc" }, { name: "asc" }],
    });

    return demand
      .filter(
        (line) =>
          line.status === "OK" &&
          line.workAreaId !== null &&
          line.employeesNeeded !== null
      )
      .map((line) => {
        const shiftMaster = findShiftMasterForService(
          shiftMasters,
          line.serviceType
        );

        if (!shiftMaster) {
          return null;
        }

        return {
          serviceType: line.serviceType,
          workAreaId: line.workAreaId as string,
          shiftMasterId: shiftMaster.id,
          startAt: buildDateFromMinute(input.date, shiftMaster.startMinute),
          endAt: buildDateFromMinute(
            input.date,
            shiftMaster.endMinute,
            shiftMaster.crossesMidnight
          ),
          employeesNeeded: line.employeesNeeded as number,
        };
      })
      .filter((line): line is ShiftProposal => line !== null);
  },
};

function findShiftMasterForService(
  shiftMasters: Array<{
    id: string;
    startMinute: number;
    endMinute: number;
    crossesMidnight: boolean;
    coversBreakfast: boolean;
    coversLunch: boolean;
    coversDinner: boolean;
  }>,
  serviceType: RestaurantServiceType
) {
  const candidates = shiftMasters.filter((item) =>
    shiftMasterCoversService(item, serviceType)
  );

  const exclusive = candidates.find((item) =>
    shiftMasterCoversOnlyService(item, serviceType)
  );

  return exclusive ?? candidates[0];
}

function shiftMasterCoversService(
  shiftMaster: {
    coversBreakfast: boolean;
    coversLunch: boolean;
    coversDinner: boolean;
  },
  serviceType: RestaurantServiceType
) {
  if (serviceType === "BREAKFAST") return shiftMaster.coversBreakfast;
  if (serviceType === "LUNCH") return shiftMaster.coversLunch;
  return shiftMaster.coversDinner;
}

function shiftMasterCoversOnlyService(
  shiftMaster: {
    coversBreakfast: boolean;
    coversLunch: boolean;
    coversDinner: boolean;
  },
  serviceType: RestaurantServiceType
) {
  if (serviceType === "BREAKFAST") {
    return (
      shiftMaster.coversBreakfast &&
      !shiftMaster.coversLunch &&
      !shiftMaster.coversDinner
    );
  }

  if (serviceType === "LUNCH") {
    return (
      shiftMaster.coversLunch &&
      !shiftMaster.coversBreakfast &&
      !shiftMaster.coversDinner
    );
  }

  return (
    shiftMaster.coversDinner &&
    !shiftMaster.coversBreakfast &&
    !shiftMaster.coversLunch
  );
}

function buildDateFromMinute(
  date: Date,
  minuteOfDay: number,
  crossesMidnight = false
): Date {
  const result = new Date(date);
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;

  result.setHours(hours, minutes, 0, 0);

  if (crossesMidnight) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}
