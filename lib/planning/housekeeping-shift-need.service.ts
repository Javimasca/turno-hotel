import { prisma } from "@/lib/prisma";

export const housekeepingShiftNeedService = {
  async getWeek(input: {
    workplaceId: string;
    departmentId: string;
    weekStart: string;
  }) {
    const weekStart = parseDate(input.weekStart);
    const weekEnd = addDays(weekStart, 7);

    return prisma.housekeepingShiftNeed.findMany({
      where: {
        workplaceId: input.workplaceId,
        departmentId: input.departmentId,
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      include: {
        shiftMaster: true,
      },
      orderBy: [{ date: "asc" }, { shiftMaster: { name: "asc" } }],
    });
  },

  async createFromProposal(input: {
    workplaceId: string;
    departmentId: string;
    weekStart: string;
  }) {
    const weekStart = parseDate(input.weekStart);
    const weekEnd = addDays(weekStart, 7);

    const proposals = await prisma.housekeepingStaffingProposal.findMany({
      where: {
        workplaceId: input.workplaceId,
        departmentId: input.departmentId,
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    });

    if (proposals.length === 0) {
      throw new Error("Primero genera una propuesta de Pisos.");
    }

    return prisma.$transaction(async (tx) => {
      await tx.housekeepingShiftNeed.deleteMany({
        where: {
          workplaceId: input.workplaceId,
          departmentId: input.departmentId,
          date: {
            gte: weekStart,
            lt: weekEnd,
          },
          status: "DRAFT",
        },
      });

      await tx.housekeepingShiftNeed.createMany({
        data: proposals.map((proposal) => ({
          workplaceId: proposal.workplaceId,
          departmentId: proposal.departmentId,
          shiftMasterId: proposal.shiftMasterId,
          date: proposal.date,
          requiredStaff: proposal.requiredStaff,
          assignedStaff: 0,
          requiredMinutes: proposal.requiredMinutes,
          coveredMinutes: proposal.coveredMinutes,
          status: "DRAFT",
        })),
        skipDuplicates: true,
      });

      return tx.housekeepingShiftNeed.findMany({
        where: {
          workplaceId: input.workplaceId,
          departmentId: input.departmentId,
          date: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        include: {
          shiftMaster: true,
        },
        orderBy: [{ date: "asc" }, { shiftMaster: { name: "asc" } }],
      });
    });
  },
};

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("La fecha no es valida.");
  }
  return date;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
