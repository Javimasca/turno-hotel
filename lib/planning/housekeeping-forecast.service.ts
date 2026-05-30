import { prisma } from "@/lib/prisma";

type ForecastLineInput = {
  roomTypeId: string;
  date: string;
  stayovers: number;
  departures: number;
};

export const housekeepingForecastService = {
  async getWeek(input: { workplaceId: string; weekStart: string }) {
    const weekStart = parseDate(input.weekStart);
    const weekEnd = addDays(weekStart, 7);

    return prisma.housekeepingForecast.findMany({
      where: {
        workplaceId: input.workplaceId,
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      orderBy: [{ date: "asc" }],
    });
  },

  async saveWeek(input: {
    workplaceId: string;
    weekStart: string;
    lines: ForecastLineInput[];
  }) {
    const weekStart = parseDate(input.weekStart);
    const weekEnd = addDays(weekStart, 7);
    const lines = input.lines.map(normalizeLine).filter(hasDemand);

    await validateRoomTypes(input.workplaceId, lines.map((line) => line.roomTypeId));

    return prisma.$transaction(async (tx) => {
      await tx.housekeepingForecast.deleteMany({
        where: {
          workplaceId: input.workplaceId,
          date: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      });

      if (lines.length === 0) {
        return [];
      }

      await tx.housekeepingForecast.createMany({
        data: lines.map((line) => ({
          workplaceId: input.workplaceId,
          roomTypeId: line.roomTypeId,
          date: parseDate(line.date),
          stayovers: line.stayovers,
          departures: line.departures,
        })),
      });

      return tx.housekeepingForecast.findMany({
        where: {
          workplaceId: input.workplaceId,
          date: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        orderBy: [{ date: "asc" }],
      });
    });
  },
};

function normalizeLine(line: ForecastLineInput) {
  return {
    roomTypeId: line.roomTypeId,
    date: line.date,
    stayovers: normalizeCount(line.stayovers),
    departures: normalizeCount(line.departures),
  };
}

function normalizeCount(value: number) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, Math.floor(normalized));
}

function hasDemand(line: ForecastLineInput) {
  return line.stayovers > 0 || line.departures > 0;
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

async function validateRoomTypes(workplaceId: string, roomTypeIds: string[]) {
  const uniqueIds = [...new Set(roomTypeIds)];
  if (uniqueIds.length === 0) return;

  const count = await prisma.roomType.count({
    where: {
      workplaceId,
      id: {
        in: uniqueIds,
      },
    },
  });

  if (count !== uniqueIds.length) {
    throw new Error("Hay tipos de habitacion que no pertenecen al centro.");
  }
}
