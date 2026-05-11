import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const source = await prisma.workplace.findFirst({
    where: { name: "Puerto Antilla Grand Hotel" },
  });
  const target = await prisma.workplace.findFirst({
    where: { name: "Puerto Antilla" },
  });

  if (!source || !target) {
    throw new Error("No encuentro los centros origen/destino.");
  }

  const sourceRules = await prisma.restaurantCoverageRule.findMany({
    where: {
      workplaceId: source.id,
      isActive: true,
    },
    orderBy: [{ serviceType: "asc" }, { validFrom: "desc" }],
  });

  for (const sourceRule of sourceRules) {
    const existing = await prisma.restaurantCoverageRule.findFirst({
      where: {
        workplaceId: target.id,
        serviceType: sourceRule.serviceType,
        isActive: true,
      },
    });

    if (existing) {
      await prisma.restaurantCoverageRule.update({
        where: { id: existing.id },
        data: {
          ratioCoversPerEmployee: sourceRule.ratioCoversPerEmployee,
          validFrom: sourceRule.validFrom,
          validTo: sourceRule.validTo,
        },
      });
      console.log(`Actualizada ${sourceRule.serviceType}`);
    } else {
      await prisma.restaurantCoverageRule.create({
        data: {
          workplaceId: target.id,
          serviceType: sourceRule.serviceType,
          ratioCoversPerEmployee: sourceRule.ratioCoversPerEmployee,
          validFrom: sourceRule.validFrom,
          validTo: sourceRule.validTo,
          isActive: true,
        },
      });
      console.log(`Creada ${sourceRule.serviceType}`);
    }
  }
} finally {
  await prisma.$disconnect();
}
