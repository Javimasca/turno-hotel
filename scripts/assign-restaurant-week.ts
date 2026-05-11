import { PrismaClient } from "@prisma/client";
import { restaurantShiftAssignmentService } from "../lib/planning/restaurant-shift-assignment.service";

const prisma = new PrismaClient();

async function main() {
  const workplace = await prisma.workplace.findFirst({
    where: { name: "Puerto Antilla" },
  });
  const department = await prisma.department.findFirst({
    where: {
      name: "Restaurante",
      workplace: { name: "Puerto Antilla" },
    },
  });
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!workplace || !department || !admin) {
    throw new Error("Falta centro, departamento o usuario admin activo.");
  }

  const result = await restaurantShiftAssignmentService.assignFromWeeklyProposal(
    {
      workplaceId: workplace.id,
      departmentId: department.id,
      weekStart: "2026-06-01T00:00:00.000Z",
    },
    {
      userId: admin.id,
      role: "ADMIN",
      employeeId: admin.employeeId,
      isActive: true,
    }
  );

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
  await prisma.$disconnect();
  });
