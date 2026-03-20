import {
  departmentRepository,
  type CreateDepartmentInput,
  type DepartmentListFilters,
  type UpdateDepartmentInput,
} from "@/lib/departments/department.repository";
import { prisma } from "@/lib/prisma";

type ListDepartmentsInput = DepartmentListFilters;

type CreateDepartmentServiceInput = CreateDepartmentInput;

type UpdateDepartmentServiceInput = UpdateDepartmentInput;

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function normalizeName(value: string) {
  return value.trim();
}

function normalizeDescription(value?: string | null) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export const departmentService = {
  async list(input: ListDepartmentsInput = {}) {
    return departmentRepository.findMany(input);
  },

  async getById(id: string) {
    const department = await departmentRepository.findById(id);

    if (!department) {
      throw new Error("El departamento no existe.");
    }

    return department;
  },

  async create(input: CreateDepartmentServiceInput) {
    const workplaceId = input.workplaceId?.trim();
    const code = normalizeCode(input.code);
    const name = normalizeName(input.name);
    const description = normalizeDescription(input.description);
    const isActive = input.isActive ?? true;

    if (!workplaceId) {
      throw new Error("El lugar de trabajo es obligatorio.");
    }

    if (!code) {
      throw new Error("El código es obligatorio.");
    }

    if (!name) {
      throw new Error("El nombre es obligatorio.");
    }

    const workplace = await prisma.workplace.findUnique({
      where: { id: workplaceId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!workplace) {
      throw new Error("El lugar de trabajo no existe.");
    }

    const existingByCode = await departmentRepository.findByCodeInWorkplace(workplaceId, code);

    if (existingByCode) {
      throw new Error("Ya existe un departamento con ese código en el lugar de trabajo.");
    }

    const existingByName = await departmentRepository.findByNameInWorkplace(workplaceId, name);

    if (existingByName) {
      throw new Error("Ya existe un departamento con ese nombre en el lugar de trabajo.");
    }

    return departmentRepository.create({
      workplaceId,
      code,
      name,
      description,
      isActive,
    });
  },

  async update(id: string, input: UpdateDepartmentServiceInput) {
    const current = await departmentRepository.findById(id);

    if (!current) {
      throw new Error("El departamento no existe.");
    }

    const nextCode = input.code !== undefined ? normalizeCode(input.code) : undefined;
    const nextName = input.name !== undefined ? normalizeName(input.name) : undefined;
    const nextDescription = normalizeDescription(input.description);

    if (nextCode !== undefined && !nextCode) {
      throw new Error("El código es obligatorio.");
    }

    if (nextName !== undefined && !nextName) {
      throw new Error("El nombre es obligatorio.");
    }

    if (nextCode !== undefined && nextCode !== current.code) {
      const existingByCode = await departmentRepository.findByCodeInWorkplace(
        current.workplaceId,
        nextCode,
      );

      if (existingByCode && existingByCode.id !== id) {
        throw new Error("Ya existe un departamento con ese código en el lugar de trabajo.");
      }
    }

    if (nextName !== undefined && nextName !== current.name) {
      const existingByName = await departmentRepository.findByNameInWorkplace(
        current.workplaceId,
        nextName,
      );

      if (existingByName && existingByName.id !== id) {
        throw new Error("Ya existe un departamento con ese nombre en el lugar de trabajo.");
      }
    }

    return departmentRepository.update(id, {
      ...(nextCode !== undefined ? { code: nextCode } : {}),
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(input.description !== undefined ? { description: nextDescription } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  },

  async delete(id: string) {
    const current = await departmentRepository.findById(id);

    if (!current) {
      throw new Error("El departamento no existe.");
    }

    return departmentRepository.delete(id);
  },
};