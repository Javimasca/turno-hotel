import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const workplace = await prisma.workplace.findFirst({
    where: { name: "Puerto Antilla" },
  });
  const department = await prisma.department.findFirst({
    where: {
      name: "Restaurante",
      workplace: { name: "Puerto Antilla" },
    },
  });
  const workArea = await prisma.workArea.findFirst({
    where: {
      departmentId: department?.id,
      code: "BUFFET",
    },
  });

  if (!workplace || !department || !workArea) {
    throw new Error("No encuentro Puerto Antilla / Restaurante / BUFFET.");
  }

  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      employeeContracts: {
        some: {},
      },
    },
    include: {
      employeeWorkAreas: {
        include: { workArea: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  for (const employee of employees) {
    const knowsRestaurantBuffet = employee.employeeWorkAreas.some(
      (item) => item.isActive && item.workArea.code === "BUFFET"
    );

    if (!knowsRestaurantBuffet) {
      console.log(`Saltado ${employee.firstName} ${employee.lastName}`);
      continue;
    }

    await prisma.employeeWorkplace.upsert({
      where: {
        employeeId_workplaceId: {
          employeeId: employee.id,
          workplaceId: workplace.id,
        },
      },
      create: {
        employeeId: employee.id,
        workplaceId: workplace.id,
      },
      update: {},
    });

    await prisma.employeeDepartment.upsert({
      where: {
        employeeId_departmentId: {
          employeeId: employee.id,
          departmentId: department.id,
        },
      },
      create: {
        employeeId: employee.id,
        departmentId: department.id,
      },
      update: {},
    });

    const existingWorkArea = await prisma.employeeWorkArea.findFirst({
      where: {
        employeeId: employee.id,
        workAreaId: workArea.id,
        isActive: true,
      },
    });

    if (!existingWorkArea) {
      await prisma.employeeWorkArea.create({
        data: {
          employeeId: employee.id,
          workAreaId: workArea.id,
          level: "STANDARD",
          isPrimary: false,
          canLead: false,
          isActive: true,
          validFrom: new Date("2026-01-01T12:00:00.000Z"),
          validTo: null,
        },
      });
    }

    console.log(`Vinculado ${employee.firstName} ${employee.lastName}`);
  }
} finally {
  await prisma.$disconnect();
}
