import { prisma } from "@/lib/prisma";

export const employeeAvailabilityBlockRepository = {
  async create(data: {
    employeeId: string;
    date: Date;
    startAt?: Date | null;
    endAt?: Date | null;
    type?: "DAY_OFF" | "UNAVAILABLE";
    reason?: string | null;
  }) {
    return prisma.employeeAvailabilityBlock.create({
      data,
    });
  },

  async findByEmployeesAndDateRange(params: {
    employeeIds: string[];
    startDate: Date;
    endDate: Date;
  }) {
    const { employeeIds, startDate, endDate } = params;

    if (employeeIds.length === 0) {
      return [];
    }

    return prisma.employeeAvailabilityBlock.findMany({
      where: {
        employeeId: {
          in: employeeIds,
        },
        date: {
          gte: startOfDay(startDate),
          lt: startOfDay(addDays(endDate, 1)),
        },
      },
    });
  },
};

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}