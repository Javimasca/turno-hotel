import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

type CreateUserInput = {
  email: string;
  passwordHash: string;
  name?: string | null;
  role: UserRole;
  isActive?: boolean;
  employeeId?: string | null;
};

export const userRepository = {
  findMany() {
    return prisma.user.findMany({
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ email: "asc" }],
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });
  },

  findByEmployeeId(employeeId: string) {
    return prisma.user.findUnique({
      where: { employeeId },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });
  },

  create(data: CreateUserInput) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name ?? null,
        role: data.role,
        isActive: data.isActive ?? true,
        employeeId: data.employeeId ?? null,
      },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });
  },
};