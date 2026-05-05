import { prisma } from "@/lib/prisma";
import type { RestaurantServiceType } from "@prisma/client";

type Input = {
  workplaceId: string;
  departmentId: string;
  serviceType: RestaurantServiceType;
  employeesNeeded: number;
};

type OutputLine = {
  workAreaId: string;
  employeesNeeded: number;
};

export const restaurantWorkAreaDistributionService = {
  async distribute(input: Input): Promise<OutputLine[]> {
    const workAreas = await prisma.workArea.findMany({
      where: {
        departmentId: input.departmentId,
        isActive: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    if (!workAreas.length || input.employeesNeeded <= 0) {
      return [];
    }

    // 🔥 versión 1: reparto uniforme
    const base = Math.floor(input.employeesNeeded / workAreas.length);
    let remainder = input.employeesNeeded % workAreas.length;

    return workAreas.map((wa) => {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;

      return {
        workAreaId: wa.id,
        employeesNeeded: base + extra,
      };
    });
  },
};