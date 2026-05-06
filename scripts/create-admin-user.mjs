import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prisma = new PrismaClient();
const rl = readline.createInterface({ input, output });

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

try {
  if (!process.env.DATABASE_URL?.startsWith("postgres")) {
    throw new Error("DATABASE_URL no parece una URL PostgreSQL valida.");
  }

  const email = normalizeEmail(await rl.question("Email admin: "));
  const password = await rl.question("Password admin: ");
  const name = (await rl.question("Nombre visible (opcional): ")).trim();

  if (!email || !password) {
    throw new Error("Email y password son obligatorios.");
  }

  if (password.length < 6) {
    throw new Error("Usa una password de al menos 6 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: name || null,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      name: name || null,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Admin creado/actualizado correctamente.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
  await prisma.$disconnect();
}
