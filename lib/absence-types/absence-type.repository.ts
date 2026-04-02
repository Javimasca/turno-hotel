import { Prisma, AbsenceType, AbsenceDurationMode, AbsenceLegalCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AbsenceTypeListFilters = {
  isActive?: boolean;
  search?: string;
};

export type CreateAbsenceTypeInput = {
  code: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  durationMode: AbsenceDurationMode;
  requiresApproval?: boolean;
  isPaid?: boolean;
  blocksShifts?: boolean;
  countsAsWorkedTime?: boolean;
  requiresDocument?: boolean;
  allowsNotes?: boolean;
  affectsPayroll?: boolean;
  color?: string | null;
  icon?: string | null;
  legalCategory?: AbsenceLegalCategory | null;
};

export type UpdateAbsenceTypeInput = Partial<CreateAbsenceTypeInput>;

function buildWhere(filters?: AbsenceTypeListFilters): Prisma.AbsenceTypeWhereInput {
  const where: Prisma.AbsenceTypeWhereInput = {};

  if (typeof filters?.isActive === "boolean") {
    where.isActive = filters.isActive;
  }

  if (filters?.search?.trim()) {
    const search = filters.search.trim();

    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export const absenceTypeRepository = {
  async findAll(filters?: AbsenceTypeListFilters): Promise<AbsenceType[]> {
    return prisma.absenceType.findMany({
      where: buildWhere(filters),
      orderBy: [
        { displayOrder: "asc" },
        { name: "asc" },
      ],
    });
  },

  async findById(id: string): Promise<AbsenceType | null> {
    return prisma.absenceType.findUnique({
      where: { id },
    });
  },

  async findByCode(code: string): Promise<AbsenceType | null> {
    return prisma.absenceType.findUnique({
      where: { code },
    });
  },

  async create(data: CreateAbsenceTypeInput): Promise<AbsenceType> {
    return prisma.absenceType.create({
      data,
    });
  },

  async update(id: string, data: UpdateAbsenceTypeInput): Promise<AbsenceType> {
    return prisma.absenceType.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<AbsenceType> {
    return prisma.absenceType.delete({
      where: { id },
    });
  },
};