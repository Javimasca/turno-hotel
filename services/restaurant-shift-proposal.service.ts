import { prisma } from "@/lib/prisma";

type ServiceType = "BREAKFAST" | "LUNCH" | "DINNER";

type ProposalShift = {
  serviceType: ServiceType;
  workAreaId: string;
  shiftMasterId: string;
  startAt: string;
  endAt: string;
  employeesNeeded: number;
};

export async function saveRestaurantShiftProposal(params: {
  workplaceId: string;
  departmentId: string;
  weekStart: string;
  shifts: ProposalShift[];
}) {
  const { workplaceId, departmentId, weekStart, shifts } = params;

  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7);

  await prisma.restaurantShiftProposal.deleteMany({
    where: {
      workplaceId,
      departmentId,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  if (!shifts.length) return;

  const validShifts = shifts.filter(
    (shift) =>
      shift.workAreaId &&
      shift.shiftMasterId &&
      shift.startAt &&
      shift.endAt &&
      typeof shift.employeesNeeded === "number" &&
      !Number.isNaN(shift.employeesNeeded) &&
      shift.employeesNeeded > 0
  );

  if (!validShifts.length) return;

  const rows = validShifts.flatMap((shift) =>
    Array.from({ length: shift.employeesNeeded }).map(() => ({
      workplaceId,
      departmentId,
      workAreaId: shift.workAreaId,
      shiftMasterId: shift.shiftMasterId,
      date: new Date(shift.startAt),
      service: shift.serviceType,
      requiredStaff: 1,
      startAt: new Date(shift.startAt),
      endAt: new Date(shift.endAt),
    }))
  );

  await prisma.restaurantShiftProposal.createMany({
    data: rows,
  });
}

export async function getRestaurantShiftProposalsByWeek(params: {
  workplaceId: string;
  departmentId: string;
  weekStart: string;
}) {
  const { workplaceId, departmentId, weekStart } = params;

  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 7);

  const rows = await prisma.restaurantShiftProposal.findMany({
    where: {
      workplaceId,
      departmentId,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: [{ date: "asc" }, { startAt: "asc" }],
  });

  const grouped = new Map<
    string,
    {
      serviceType: ServiceType;
      workAreaId: string;
      shiftMasterId: string;
      startAt: string;
      endAt: string;
      employeesNeeded: number;
    }
  >();

  for (const row of rows) {
    if (!row.workAreaId || !row.shiftMasterId || !row.startAt || !row.endAt) {
      continue;
    }

    const key = [
      row.date.toISOString(),
      row.service,
      row.workAreaId,
      row.shiftMasterId,
      row.startAt.toISOString(),
      row.endAt.toISOString(),
    ].join("|");

    const existing = grouped.get(key);

    if (existing) {
      existing.employeesNeeded += 1;
      continue;
    }

    grouped.set(key, {
      serviceType: row.service as ServiceType,
      workAreaId: row.workAreaId,
      shiftMasterId: row.shiftMasterId,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      employeesNeeded: 1,
    });
  }

  return Array.from(grouped.values());
}