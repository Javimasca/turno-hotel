import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = "TurnoHotel123!";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 10,
  });

  console.log("Empleados disponibles:");
  for (const employee of employees) {
    console.log(
      `${employee.id} | ${employee.firstName} ${employee.lastName} | ${employee.email ?? "sin email"}`
    );
  }

  // Ajusta estos valores antes de ejecutar
  const adminEmail = "admin@turnohotel.local";
  const managerEmail = "manager@turnohotel.local";
  const employeeEmail = "employee@turnohotel.local";

  const managerEmployee = employees[0] ?? null;
  const employeeUserEmployee = employees[1] ?? null;

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: "Administrador",
      role: UserRole.ADMIN,
      isActive: true,
      employeeId: null,
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Administrador",
      role: UserRole.ADMIN,
      isActive: true,
      employeeId: null,
    },
  });

  console.log(`ADMIN OK: ${admin.email}`);

  if (managerEmployee) {
    const manager = await prisma.user.upsert({
      where: { email: managerEmail },
      update: {
        passwordHash,
        name: `${managerEmployee.firstName} ${managerEmployee.lastName}`,
        role: UserRole.MANAGER,
        isActive: true,
        employeeId: managerEmployee.id,
      },
      create: {
        email: managerEmail,
        passwordHash,
        name: `${managerEmployee.firstName} ${managerEmployee.lastName}`,
        role: UserRole.MANAGER,
        isActive: true,
        employeeId: managerEmployee.id,
      },
    });

    console.log(`MANAGER OK: ${manager.email} -> employeeId=${managerEmployee.id}`);
  } else {
    console.log("No hay empleado disponible para crear MANAGER.");
  }

  if (employeeUserEmployee) {
    const employeeUser = await prisma.user.upsert({
      where: { email: employeeEmail },
      update: {
        passwordHash,
        name: `${employeeUserEmployee.firstName} ${employeeUserEmployee.lastName}`,
        role: UserRole.EMPLOYEE,
        isActive: true,
        employeeId: employeeUserEmployee.id,
      },
      create: {
        email: employeeEmail,
        passwordHash,
        name: `${employeeUserEmployee.firstName} ${employeeUserEmployee.lastName}`,
        role: UserRole.EMPLOYEE,
        isActive: true,
        employeeId: employeeUserEmployee.id,
      },
    });

    console.log(
      `EMPLOYEE OK: ${employeeUser.email} -> employeeId=${employeeUserEmployee.id}`
    );
  } else {
    console.log("No hay empleado disponible para crear EMPLOYEE.");
  }

  console.log("");
  console.log(`Password inicial: ${defaultPassword}`);
}

main()
  .catch((error) => {
    console.error("Error creando usuarios iniciales:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });