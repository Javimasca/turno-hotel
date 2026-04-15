import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "TurnoHotel123!";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  if (users.length === 0) {
    console.log("No hay usuarios en la base de datos.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let updatedCount = 0;

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
      },
    });

    updatedCount += 1;

    console.log(
      `OK ${user.email} | role=${user.role} | active=${user.isActive}`
    );
  }

  console.log("");
  console.log(`Usuarios actualizados: ${updatedCount}`);
  console.log(`Password inicial asignada: ${DEFAULT_PASSWORD}`);
  console.log(
    "IMPORTANTE: cambia esta contraseña después del primer acceso o sustituye este script por uno con contraseñas individualizadas."
  );
}

main()
  .catch((error) => {
    console.error("Error asignando contraseñas iniciales:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });