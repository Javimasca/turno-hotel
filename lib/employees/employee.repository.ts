import { prisma } from "@/lib/prisma";

type EmployeeListFilters = {
  isActive?: boolean;
  search?: string;
  employeeIds?: string[];
  directManagerEmployeeId?: string;
};

type CreateEmployeeInput = {
  code: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  directManagerEmployeeId?: string | null;
  workplaceId?: string | null;
  departmentId?: string | null;
  isActive?: boolean;
};

type UpdateEmployeeInput = {
  code?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  directManagerEmployeeId?: string | null;
  workplaceId?: string | null;
  departmentId?: string | null;
  isActive?: boolean;
};

export const employeeRepository = {
  findMany(filters: EmployeeListFilters = {}) {
    const search = filters.search?.trim();
    const employeeIds =
      filters.employeeIds?.filter((id) => id.trim().length > 0) ?? [];

    const scopeOr =
      employeeIds.length > 0 || filters.directManagerEmployeeId
        ? [
            ...(employeeIds.length > 0
              ? [{ id: { in: employeeIds } as const }]
              : []),
            ...(filters.directManagerEmployeeId
              ? [
                  {
                    directManagerEmployeeId: filters.directManagerEmployeeId,
                  } as const,
                ]
              : []),
          ]
        : [];

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
        ...(scopeOr.length > 0 ? { AND: [{ OR: scopeOr }] } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
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
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
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

  async isDirectManagerOf(
    managerEmployeeId: string,
    targetEmployeeId: string,
  ) {
    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: {
        directManagerEmployeeId: true,
      },
    });

    if (!employee) {
      return false;
    }

    return employee.directManagerEmployeeId === managerEmployeeId;
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

  findWorkplaceById(id: string) {
    return prisma.workplace.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
    });
  },

  findDepartmentById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        workplaceId: true,
      },
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
        photoUrl: data.photoUrl ?? null,
        directManagerEmployeeId: data.directManagerEmployeeId ?? null,
        isActive: data.isActive ?? true,
        ...(data.workplaceId
          ? {
              employeeWorkplaces: {
                create: [
                  {
                    workplaceId: data.workplaceId,
                  },
                ],
              },
            }
          : {}),
        ...(data.departmentId
          ? {
              employeeDepartments: {
                create: [
                  {
                    departmentId: data.departmentId,
                  },
                ],
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
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
        ...(typeof data.lastName === "string"
          ? { lastName: data.lastName }
          : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
        ...(data.directManagerEmployeeId !== undefined
          ? { directManagerEmployeeId: data.directManagerEmployeeId }
          : {}),
        ...(typeof data.isActive === "boolean"
          ? { isActive: data.isActive }
          : {}),
        ...(data.workplaceId !== undefined
          ? {
              employeeWorkplaces: {
                deleteMany: {},
                ...(data.workplaceId
                  ? {
                      create: [
                        {
                          workplaceId: data.workplaceId,
                        },
                      ],
                    }
                  : {}),
              },
            }
          : {}),
        ...(data.departmentId !== undefined
          ? {
              employeeDepartments: {
                deleteMany: {},
                ...(data.departmentId
                  ? {
                      create: [
                        {
                          departmentId: data.departmentId,
                        },
                      ],
                    }
                  : {}),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
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
      },
    });
  },

  delete(id: string) {
    return prisma.employee.delete({
      where: { id },
    });
  },
};