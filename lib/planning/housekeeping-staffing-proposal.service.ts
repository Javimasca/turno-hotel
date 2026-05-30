import { prisma } from "@/lib/prisma";

export const housekeepingStaffingProposalService = {
  async getWeek(input: {
    workplaceId: string;
    departmentId: string;
    weekStart: string;
  }) {
    const weekStart = parseDate(input.weekStart);
    const weekEnd = addDays(weekStart, 7);

    return prisma.housekeepingStaffingProposal.findMany({
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

  async generateWeek(input: {
    workplaceId: string;
    departmentId: string;
    weekStart: string;
  }) {
    const weekStart = parseDate(input.weekStart);
    const weekEnd = addDays(weekStart, 7);
    const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

    const [roomTypes, forecasts, shiftMasters] = await Promise.all([
      prisma.roomType.findMany({
        where: {
          workplaceId: input.workplaceId,
          isActive: true,
        },
      }),
      prisma.housekeepingForecast.findMany({
        where: {
          workplaceId: input.workplaceId,
          date: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      }),
      prisma.shiftMaster.findMany({
        where: {
          workplaceId: input.workplaceId,
          departmentId: input.departmentId,
          type: "PISOS",
          isActive: true,
          countsForRoomAssignment: true,
        },
        orderBy: [{ effectiveCleaningMinutes: "desc" }, { name: "asc" }],
      }),
    ]);

    const shiftMaster = pickEightHourShift(shiftMasters) ?? shiftMasters[0];

    if (!shiftMaster) {
      throw new Error("No hay turnos PISOS activos que cuenten para habitaciones.");
    }

    const shiftEffectiveMinutes = getShiftEffectiveMinutes(shiftMaster);

    if (shiftEffectiveMinutes <= 0) {
      throw new Error("El turno PISOS no tiene minutos efectivos validos.");
    }

    const requiredByDate = calculateRequiredMinutesByDate({
      dates,
      roomTypes,
      forecasts,
    });

    return prisma.$transaction(async (tx) => {
      await tx.housekeepingStaffingProposal.deleteMany({
        where: {
          workplaceId: input.workplaceId,
          departmentId: input.departmentId,
          date: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      });

      const rows = dates.map((date) => {
        const requiredMinutes = requiredByDate[toDateKey(date)] ?? 0;
        const requiredStaff =
          requiredMinutes > 0 ? Math.ceil(requiredMinutes / shiftEffectiveMinutes) : 0;

        return {
          workplaceId: input.workplaceId,
          departmentId: input.departmentId,
          shiftMasterId: shiftMaster.id,
          date,
          requiredMinutes,
          shiftEffectiveMinutes,
          requiredStaff,
          coveredMinutes: requiredStaff * shiftEffectiveMinutes,
        };
      });

      await tx.housekeepingStaffingProposal.createMany({ data: rows });

      return tx.housekeepingStaffingProposal.findMany({
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

function calculateRequiredMinutesByDate(input: {
  dates: Date[];
  roomTypes: Array<{
    id: string;
    stayoverCleaningMinutes: number;
    departureCleaningMinutes: number;
  }>;
  forecasts: Array<{
    roomTypeId: string;
    date: Date;
    stayovers: number;
    departures: number;
  }>;
}) {
  const roomTypeMap = new Map(input.roomTypes.map((roomType) => [roomType.id, roomType]));
  const result: Record<string, number> = {};

  for (const date of input.dates) {
    result[toDateKey(date)] = 0;
  }

  for (const forecast of input.forecasts) {
    const roomType = roomTypeMap.get(forecast.roomTypeId);
    if (!roomType) continue;

    const dateKey = toDateKey(forecast.date);
    result[dateKey] =
      (result[dateKey] ?? 0) +
      forecast.stayovers * roomType.stayoverCleaningMinutes +
      forecast.departures * roomType.departureCleaningMinutes;
  }

  return result;
}

function pickEightHourShift<T extends { effectiveCleaningMinutes: number | null; startMinute: number; endMinute: number; crossesMidnight: boolean }>(shiftMasters: T[]) {
  return shiftMasters.find((shiftMaster) => getShiftEffectiveMinutes(shiftMaster) === 480);
}

function getShiftEffectiveMinutes(shiftMaster: {
  effectiveCleaningMinutes: number | null;
  startMinute: number;
  endMinute: number;
  crossesMidnight: boolean;
}) {
  if (shiftMaster.effectiveCleaningMinutes && shiftMaster.effectiveCleaningMinutes > 0) {
    return shiftMaster.effectiveCleaningMinutes;
  }

  if (shiftMaster.crossesMidnight) {
    return 1440 - shiftMaster.startMinute + shiftMaster.endMinute;
  }

  return Math.max(shiftMaster.endMinute - shiftMaster.startMinute, 0);
}

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

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
