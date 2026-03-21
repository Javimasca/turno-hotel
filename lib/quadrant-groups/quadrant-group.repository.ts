import {
  createQuadrantGroup,
  findQuadrantGroupByCodeInWorkArea,
  findQuadrantGroupById,
  findQuadrantGroupByNameInWorkArea,
  findQuadrantGroups,
  updateQuadrantGroup,
  deleteQuadrantGroup,
  type CreateQuadrantGroupInput,
  type QuadrantGroupListFilters,
  type UpdateQuadrantGroupInput,
} from "@/lib/quadrant-groups/quadrant-group.repository";
import { prisma } from "@/lib/prisma";

type ListQuadrantGroupsInput = QuadrantGroupListFilters;

type CreateQuadrantGroupServiceInput = CreateQuadrantGroupInput;

type UpdateQuadrantGroupServiceInput = UpdateQuadrantGroupInput;

export class QuadrantGroupNotFoundError extends Error {
  constructor(message = "El grupo de cuadrante no existe.") {
    super(message);
    this.name = "QuadrantGroupNotFoundError";
  }
}

export class QuadrantGroupCodeAlreadyExistsError extends Error {
  constructor(
    message = "Ya existe un grupo de cuadrante con ese código en la zona de trabajo.",
  ) {
    super(message);
    this.name = "QuadrantGroupCodeAlreadyExistsError";
  }
}

export class QuadrantGroupNameAlreadyExistsError extends Error {
  constructor(
    message = "Ya existe un grupo de cuadrante con ese nombre en la zona de trabajo.",
  ) {
    super(message);
    this.name = "QuadrantGroupNameAlreadyExistsError";
  }
}

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

export const quadrantGroupService = {
  async list(input: ListQuadrantGroupsInput = {}) {
    return findQuadrantGroups(input);
  },

  async getById(id: string) {
    const quadrantGroup = await findQuadrantGroupById(id);

    if (!quadrantGroup) {
      throw new QuadrantGroupNotFoundError();
    }

    return quadrantGroup;
  },

  async create(input: CreateQuadrantGroupServiceInput) {
    const workAreaId = input.workAreaId?.trim();
    const code = normalizeCode(input.code);
    const name = normalizeName(input.name);
    const description = normalizeDescription(input.description);
    const displayOrder = normalizeDisplayOrder(input.displayOrder);
    const isActive = input.isActive ?? true;

    if (!workAreaId) {
      throw new Error("La zona de trabajo es obligatoria.");
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

    const workArea = await prisma.workArea.findUnique({
      where: { id: workAreaId },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!workArea) {
      throw new Error("La zona de trabajo no existe.");
    }

    const existingByCode = await findQuadrantGroupByCodeInWorkArea(
      workAreaId,
      code,
    );

    if (existingByCode) {
      throw new QuadrantGroupCodeAlreadyExistsError();
    }

    const existingByName = await findQuadrantGroupByNameInWorkArea(
      workAreaId,
      name,
    );

    if (existingByName) {
      throw new QuadrantGroupNameAlreadyExistsError();
    }

    return createQuadrantGroup({
      workAreaId,
      code,
      name,
      description,
      displayOrder,
      isActive,
    });
  },

  async update(id: string, input: UpdateQuadrantGroupServiceInput) {
    const current = await findQuadrantGroupById(id);

    if (!current) {
      throw new QuadrantGroupNotFoundError();
    }

    const nextCode =
      input.code !== undefined ? normalizeCode(input.code) : undefined;
    const nextName =
      input.name !== undefined ? normalizeName(input.name) : undefined;
    const nextDescription = normalizeDescription(input.description);
    const nextDisplayOrder =
      input.displayOrder !== undefined
        ? normalizeDisplayOrder(input.displayOrder)
        : undefined;

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
      const existingByCode = await findQuadrantGroupByCodeInWorkArea(
        current.workAreaId,
        nextCode,
      );

      if (existingByCode && existingByCode.id !== id) {
        throw new QuadrantGroupCodeAlreadyExistsError();
      }
    }

    if (nextName !== undefined && nextName !== current.name) {
      const existingByName = await findQuadrantGroupByNameInWorkArea(
        current.workAreaId,
        nextName,
      );

      if (existingByName && existingByName.id !== id) {
        throw new QuadrantGroupNameAlreadyExistsError();
      }
    }

    return updateQuadrantGroup(id, {
      ...(nextCode !== undefined ? { code: nextCode } : {}),
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(input.description !== undefined ? { description: nextDescription } : {}),
      ...(nextDisplayOrder !== undefined
        ? { displayOrder: nextDisplayOrder }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  },

  async delete(id: string) {
    const current = await findQuadrantGroupById(id);

    if (!current) {
      throw new QuadrantGroupNotFoundError();
    }

    return deleteQuadrantGroup(id);
  },
};