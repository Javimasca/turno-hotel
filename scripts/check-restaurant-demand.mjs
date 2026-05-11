import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function employeesNeeded(covers, ratio) {
  if (covers <= 0 || ratio <= 0) return 0;
  return Math.max(1, Math.floor(covers / ratio));
}

try {
  const workplace = await prisma.workplace.findFirst({
    where: { name: "Puerto Antilla" },
  });
  const department = await prisma.department.findFirst({
    where: { name: "Restaurante", workplace: { name: "Puerto Antilla" } },
    include: { workAreas: true },
  });

  const rules = await prisma.restaurantCoverageRule.findMany({
    where: {
      workplaceId: workplace.id,
      isActive: true,
      validFrom: { lte: new Date("2026-05-25T12:00:00.000Z") },
      OR: [{ validTo: null }, { validTo: { gte: new Date("2026-05-25T12:00:00.000Z") } }],
    },
  });

  const covers = {
    BREAKFAST: 60,
    LUNCH: 20,
    DINNER: 50,
  };

  console.log(
    JSON.stringify(
      {
        workplace: workplace.name,
        department: department.name,
        workAreas: department.workAreas.map((workArea) => workArea.code),
        demand: rules.map((rule) => ({
          serviceType: rule.serviceType,
          covers: covers[rule.serviceType],
          ratio: rule.ratioCoversPerEmployee,
          employeesNeeded: employeesNeeded(
            covers[rule.serviceType],
            rule.ratioCoversPerEmployee
          ),
        })),
      },
      null,
      2
    )
  );
} finally {
  await prisma.$disconnect();
}
