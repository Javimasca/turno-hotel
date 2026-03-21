import { prisma } from "@/lib/prisma";

type EmployeeListFilters = {
  isActive?: boolean;
  search?: string;
};

type CreateEmployeeInput = {
  code: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  directManagerEmployeeId?: string | null;
  isActive?: boolean;
};

type UpdateEmployeeInput = {
  code?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  directManagerEmployeeId?: string | null;
  isActive?: boolean;
};

export const employeeRepository = {
  findMany(filters: EmployeeListFilters = {}) {
    const search = filters.search?.trim();

    return prisma.employee.findMany({
      where: {
        ...(typeof filters.isActive === "boolean"
          ? { isActive: filters.isActive }
          : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        directManager: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
          },
        },
        employeeWorkplaces: {
          include: {
            workplace: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            workplace: {
              name: "asc",
            },
          },
        },
        employeeDepartments: {
          include: {
            department: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                workplace: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            department: {
              name: "asc",
            },
          },
        },
        employeeContracts: {
          include: {
            jobCategory: {
              select: {
                id: true,
                code: true,
                name: true,
                shortName: true,
                isActive: true,
              },
            },
          },
          orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  },

  findById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        directManager: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
        employeeWorkplaces: {
          include: {
            workplace: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            workplace: {
              name: "asc",
            },
          },
        },
        employeeDepartments: {
          include: {
            department: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                workplace: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            department: {
              name: "asc",
            },
          },
        },
        employeeContracts: {
          include: {
            jobCategory: {
              select: {
                id: true,
                code: true,
                name: true,
                shortName: true,
                isActive: true,
              },
            },
          },
          orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        },
      },
    });
  },

  findByCode(code: string) {
    return prisma.employee.findUnique({
      where: { code },
    });
  },

  findByEmail(email: string) {
    return prisma.employee.findUnique({
      where: { email },
    });
  },

  create(data: CreateEmployeeInput) {
    return prisma.employee.create({
      data: {
        code: data.code,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        directManagerEmployeeId: data.directManagerEmployeeId ?? null,
        isActive: data.isActive ?? true,
      },
      include: {
        directManager: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  update(id: string, data: UpdateEmployeeInput) {
    return prisma.employee.update({
      where: { id },
      data: {
        ...(typeof data.code === "string" ? { code: data.code } : {}),
        ...(typeof data.firstName === "string"
          ? { firstName: data.firstName }
          : {}),
        ...(typeof data.lastName === "string" ? { lastName: data.lastName } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.directManagerEmployeeId !== undefined
          ? { directManagerEmployeeId: data.directManagerEmployeeId }
          : {}),
        ...(typeof data.isActive === "boolean"
          ? { isActive: data.isActive }
          : {}),
      },
      include: {
        directManager: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  delete(id: string) {
    return prisma.employee.delete({
      where: { id },
    });
  },
};