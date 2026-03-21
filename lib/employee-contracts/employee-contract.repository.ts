import { prisma } from "@/lib/prisma";

type EmployeeContractListFilters = {
  employeeId?: string;
};

type CreateEmployeeContractInput = {
  employeeId: string;
  jobCategoryId: string;
  contractType:
    | "INDEFINIDO"
    | "TEMPORAL"
    | "FIJO_DISCONTINUO"
    | "FORMACION"
    | "PRACTICAS"
    | "INTERINIDAD"
    | "EVENTUAL"
    | "OTRO";
  startDate: Date;
  endDate?: Date | null;
  seniorityDate?: Date | null;
  weeklyHours?: number | null;
  dailyHours?: number | null;
  employmentRate?: number | null;
  notes?: string | null;
};

type UpdateEmployeeContractInput = {
  jobCategoryId?: string;
  contractType?:
    | "INDEFINIDO"
    | "TEMPORAL"
    | "FIJO_DISCONTINUO"
    | "FORMACION"
    | "PRACTICAS"
    | "INTERINIDAD"
    | "EVENTUAL"
    | "OTRO";
  startDate?: Date;
  endDate?: Date | null;
  seniorityDate?: Date | null;
  weeklyHours?: number | null;
  dailyHours?: number | null;
  employmentRate?: number | null;
  notes?: string | null;
};

export const employeeContractRepository = {
  findMany(filters: EmployeeContractListFilters = {}) {
    return prisma.employeeContract.findMany({
      where: {
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
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
    });
  },

  findById(id: string) {
    return prisma.employeeContract.findUnique({
      where: { id },
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
    });
  },

  findActiveByEmployeeId(employeeId: string, onDate: Date) {
    return prisma.employeeContract.findMany({
      where: {
        employeeId,
        startDate: {
          lte: onDate,
        },
        OR: [{ endDate: null }, { endDate: { gte: onDate } }],
      },
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
    });
  },

  create(data: CreateEmployeeContractInput) {
    return prisma.employeeContract.create({
      data: {
        employeeId: data.employeeId,
        jobCategoryId: data.jobCategoryId,
        contractType: data.contractType,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        seniorityDate: data.seniorityDate ?? null,
        weeklyHours: data.weeklyHours ?? null,
        dailyHours: data.dailyHours ?? null,
        employmentRate: data.employmentRate ?? null,
        notes: data.notes ?? null,
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
    });
  },

  update(id: string, data: UpdateEmployeeContractInput) {
    return prisma.employeeContract.update({
      where: { id },
      data: {
        ...(data.jobCategoryId !== undefined
          ? { jobCategoryId: data.jobCategoryId }
          : {}),
        ...(data.contractType !== undefined
          ? { contractType: data.contractType }
          : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.seniorityDate !== undefined
          ? { seniorityDate: data.seniorityDate }
          : {}),
        ...(data.weeklyHours !== undefined
          ? { weeklyHours: data.weeklyHours }
          : {}),
        ...(data.dailyHours !== undefined
          ? { dailyHours: data.dailyHours }
          : {}),
        ...(data.employmentRate !== undefined
          ? { employmentRate: data.employmentRate }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
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
    });
  },

  delete(id: string) {
    return prisma.employeeContract.delete({
      where: { id },
    });
  },
};