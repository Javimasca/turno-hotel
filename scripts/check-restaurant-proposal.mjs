import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function buildDateFromMinute(date, minuteOfDay, crossesMidnight = false) {
  const result = new Date(date);
  result.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
  if (crossesMidnight) result.setDate(result.getDate() + 1);
  return result;
}

function employeesNeeded(covers, ratio) {
  if (covers <= 0 || ratio <= 0) return 0;
  return Math.max(1, Math.floor(covers / ratio));
}

try {
  const workplace = await prisma.workplace.findFirst({
    where: { name: "Puerto Antilla" },
  });
  const department = await prisma.department.findFirst({
    where: { name: "Restaurante", workplaceId: workplace.id },
  });
  const workArea = await prisma.workArea.findFirst({
    where: { departmentId: department.id, code: "BUFFET" },
  });
  const rules = await prisma.restaurantCoverageRule.findMany({
    where: { workplaceId: workplace.id, isActive: true },
  });
  const masters = await prisma.shiftMaster.findMany({
    where: {
      workplaceId: workplace.id,
      departmentId: department.id,
      type: "RESTAURANTE",
      isActive: true,
    },
    orderBy: [{ startMinute: "asc" }],
  });

  const date = new Date("2026-05-25T12:00:00.000Z");
  const covers = { BREAKFAST: 60, LUNCH: 20, DINNER: 50 };
  const proposal = [];

  for (const rule of rules) {
    const master = masters.find((item) => {
      if (rule.serviceType === "BREAKFAST") return item.coversBreakfast;
      if (rule.serviceType === "LUNCH") return item.coversLunch;
      return item.coversDinner;
    });

    if (!master) continue;

    proposal.push({
      serviceType: rule.serviceType,
      workArea: workArea.code,
      shiftMaster: master.code,
      employeesNeeded: employeesNeeded(covers[rule.serviceType], rule.ratioCoversPerEmployee),
      startAt: buildDateFromMinute(date, master.startMinute).toISOString(),
      endAt: buildDateFromMinute(date, master.endMinute, master.crossesMidnight).toISOString(),
    });
  }

  console.log(JSON.stringify({ masters: masters.length, proposal }, null, 2));
} finally {
  await prisma.$disconnect();
}
