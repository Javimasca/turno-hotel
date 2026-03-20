import { workAreaRepository, type CreateWorkAreaInput, type UpdateWorkAreaInput, type WorkAreaListFilters } from "@/lib/work-areas/work-area.repository";
import { prisma } from "@/lib/prisma";

type ListWorkAreasInput = WorkAreaListFilters;

type CreateWorkAreaServiceInput = CreateWorkAreaInput;

type UpdateWorkAreaServiceInput = UpdateWorkAreaInput;

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

function normalizeDisplayOrder(value?: number) {
  return value ?? 0;
}

export const workAreaService = {
  async list(input: ListWorkAreasInput = {}) {
    return workAreaRepository.findMany(input);
  },

  async getById(id: string) {
    const workArea = await workAreaRepository.findById(id);

    if (!workArea) {
      throw new Error("La zona de trabajo no existe.");
    }

    return workArea;
  },

  async create(input: CreateWorkAreaServiceInput) {
    const departmentId = input.departmentId?.trim();
    const code = normalizeCode(input.code);
    const name = normalizeName(input.name);
    const description = normalizeDescription(input.description);
    const displayOrder = normalizeDisplayOrder(input.displayOrder);
    const isActive = input.isActive ?? true;

    if (!departmentId) {
      throw new Error("El departamento es obligatorio.");
    }

    if (!code) {
      throw new Error("El código es obligatorio.");
    }

    if (!name) {
      throw new Error("El nombre es obligatorio.");
    }

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      throw new Error("El orden debe ser un número entero mayor o igual que 0.");
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!department) {
      throw new Error("El departamento no existe.");
    }

    const existingByCode = await workAreaRepository.findByCodeInDepartment(departmentId, code);

    if (existingByCode) {
      throw new Error("Ya existe una zona de trabajo con ese código en el departamento.");
    }

    const existingByName = await workAreaRepository.findByNameInDepartment(departmentId, name);

    if (existingByName) {
      throw new Error("Ya existe una zona de trabajo con ese nombre en el departamento.");
    }

    return workAreaRepository.create({
      departmentId,
      code,
      name,
      description,
      displayOrder,
      isActive,
    });
  },

  async update(id: string, input: UpdateWorkAreaServiceInput) {
    const current = await workAreaRepository.findById(id);

    if (!current) {
      throw new Error("La zona de trabajo no existe.");
    }

    const nextCode = input.code !== undefined ? normalizeCode(input.code) : undefined;
    const nextName = input.name !== undefined ? normalizeName(input.name) : undefined;
    const nextDescription = normalizeDescription(input.description);
    const nextDisplayOrder =
      input.displayOrder !== undefined ? normalizeDisplayOrder(input.displayOrder) : undefined;

    if (nextCode !== undefined && !nextCode) {
      throw new Error("El código es obligatorio.");
    }

    if (nextName !== undefined && !nextName) {
      throw new Error("El nombre es obligatorio.");
    }

    if (
      nextDisplayOrder !== undefined &&
      (!Number.isInteger(nextDisplayOrder) || nextDisplayOrder < 0)
    ) {
      throw new Error("El orden debe ser un número entero mayor o igual que 0.");
    }

    if (nextCode !== undefined && nextCode !== current.code) {
      const existingByCode = await workAreaRepository.findByCodeInDepartment(
        current.departmentId,
        nextCode,
      );

      if (existingByCode && existingByCode.id !== id) {
        throw new Error("Ya existe una zona de trabajo con ese código en el departamento.");
      }
    }

    if (nextName !== undefined && nextName !== current.name) {
      const existingByName = await workAreaRepository.findByNameInDepartment(
        current.departmentId,
        nextName,
      );

      if (existingByName && existingByName.id !== id) {
        throw new Error("Ya existe una zona de trabajo con ese nombre en el departamento.");
      }
    }

    return workAreaRepository.update(id, {
      ...(nextCode !== undefined ? { code: nextCode } : {}),
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(input.description !== undefined ? { description: nextDescription } : {}),
      ...(nextDisplayOrder !== undefined ? { displayOrder: nextDisplayOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  },

  async delete(id: string) {
    const current = await workAreaRepository.findById(id);

    if (!current) {
      throw new Error("La zona de trabajo no existe.");
    }

    return workAreaRepository.delete(id);
  },
};