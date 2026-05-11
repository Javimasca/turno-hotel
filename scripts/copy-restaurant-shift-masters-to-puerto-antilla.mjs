import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const sourceWorkplace = await prisma.workplace.findFirst({
    where: { name: "Puerto Antilla Grand Hotel" },
  });
  const sourceDepartment = await prisma.department.findFirst({
    where: {
      name: "Bares y restaurantes",
      workplace: { name: "Puerto Antilla Grand Hotel" },
    },
  });
  const targetWorkplace = await prisma.workplace.findFirst({
    where: { name: "Puerto Antilla" },
  });
  const targetDepartment = await prisma.department.findFirst({
    where: {
      name: "Restaurante",
      workplace: { name: "Puerto Antilla" },
    },
  });
  const targetWorkArea = await prisma.workArea.findFirst({
    where: {
      departmentId: targetDepartment?.id,
      code: "BUFFET",
      isActive: true,
    },
  });

  if (!sourceWorkplace || !sourceDepartment || !targetWorkplace || !targetDepartment) {
    throw new Error("No encuentro centro/departamento origen o destino.");
  }

  const sourceMasters = await prisma.shiftMaster.findMany({
    where: {
      workplaceId: sourceWorkplace.id,
      departmentId: sourceDepartment.id,
      type: "RESTAURANTE",
      isActive: true,
    },
    orderBy: [{ code: "asc" }],
  });

  for (const source of sourceMasters) {
    const data = {
      code: source.code,
      name: source.name,
      description: source.description,
      workplaceId: targetWorkplace.id,
      departmentId: targetDepartment.id,
      workAreaId: targetWorkArea?.id ?? null,
      jobCategoryId: source.jobCategoryId,
      type: source.type,
      startMinute: source.startMinute,
      endMinute: source.endMinute,
      crossesMidnight: source.crossesMidnight,
      isPartial: source.isPartial,
      backgroundColor: source.backgroundColor,
      coversBreakfast: source.coversBreakfast,
      coversLunch: source.coversLunch,
      coversDinner: source.coversDinner,
      countsForRoomAssignment: source.countsForRoomAssignment,
      isActive: true,
    };

    const existing = await prisma.shiftMaster.findFirst({
      where: {
        departmentId: targetDepartment.id,
        code: source.code,
      },
    });

    if (existing) {
      await prisma.shiftMaster.update({
        where: { id: existing.id },
        data,
      });
      console.log(`Actualizado ${source.code}`);
    } else {
      await prisma.shiftMaster.create({ data });
      console.log(`Creado ${source.code}`);
    }
  }
} finally {
  await prisma.$disconnect();
}
