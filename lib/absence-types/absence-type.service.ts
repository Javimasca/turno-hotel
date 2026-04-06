import {
  AbsenceDurationMode,
  AbsenceLegalCategory,
  AbsenceType,
  UserRole,
} from "@prisma/client";
import {
  absenceTypeRepository,
  AbsenceTypeListFilters,
  CreateAbsenceTypeInput,
  UpdateAbsenceTypeInput,
} from "./absence-type.repository";

type ServiceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      status?: number;
    };

type RequestContext = {
  userId: string;
  role: UserRole;
  employeeId: string | null;
  isActive: boolean;
};

type CreateAbsenceTypeDto = {
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

type UpdateAbsenceTypeDto = Partial<CreateAbsenceTypeDto>;

function isManagerOrAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

function canManageAbsenceTypes(role: UserRole): boolean {
  return isManagerOrAdmin(role);
}

function normalizeCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/\s+/g, "_");

  if (!normalized.length) {
    throw new Error("El código es obligatorio.");
  }

  return normalized;
}

function normalizeName(name: string): string {
  const normalized = name.trim();

  if (!normalized.length) {
    throw new Error("El nombre es obligatorio.");
  }

  return normalized;
}

function normalizeText(value?: string | null): string | null {
  if (value == null) return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeColor(value?: string | null): string | null {
  const color = normalizeText(value);
  if (!color) return null;

  const hexColorRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

  if (!hexColorRegex.test(color)) {
    throw new Error(
      "El color debe estar en formato hexadecimal válido (#RGB o #RRGGBB)."
    );
  }

  return color;
}

function validateRequiredFields(data: CreateAbsenceTypeDto) {
  if (!data.code?.trim()) {
    throw new Error("El código es obligatorio.");
  }

  if (!data.name?.trim()) {
    throw new Error("El nombre es obligatorio.");
  }

  if (!data.durationMode) {
    throw new Error("El modo de duración es obligatorio.");
  }
}

function validateDisplayOrder(displayOrder?: number) {
  if (displayOrder == null) return;

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    throw new Error(
      "El orden de visualización debe ser un número entero mayor o igual a 0."
    );
  }
}

function validateBusinessRules(data: {
  durationMode?: AbsenceDurationMode;
  countsAsWorkedTime?: boolean;
  blocksShifts?: boolean;
}) {
  if (
    data.durationMode === AbsenceDurationMode.HOURLY &&
    data.blocksShifts === true
  ) {
    // Regla opcional de negocio:
    // throw new Error("Una ausencia solo por horas no debería bloquear turnos completos.");
  }

  if (data.countsAsWorkedTime === true && data.blocksShifts === true) {
    // Regla opcional de negocio:
    // throw new Error("No parece coherente que compute como tiempo trabajado y a la vez bloquee turnos.");
  }
}

function toCreateInput(dto: CreateAbsenceTypeDto): CreateAbsenceTypeInput {
  validateRequiredFields(dto);
  validateDisplayOrder(dto.displayOrder);

  const data: CreateAbsenceTypeInput = {
    code: normalizeCode(dto.code),
    name: normalizeName(dto.name),
    description: normalizeText(dto.description),
    displayOrder: dto.displayOrder ?? 0,
    isActive: dto.isActive ?? true,
    durationMode: dto.durationMode,
    requiresApproval: dto.requiresApproval ?? false,
    isPaid: dto.isPaid ?? true,
    blocksShifts: dto.blocksShifts ?? true,
    countsAsWorkedTime: dto.countsAsWorkedTime ?? false,
    requiresDocument: dto.requiresDocument ?? false,
    allowsNotes: dto.allowsNotes ?? true,
    affectsPayroll: dto.affectsPayroll ?? true,
    color: normalizeColor(dto.color),
    icon: normalizeText(dto.icon),
    legalCategory: dto.legalCategory ?? null,
  };

  validateBusinessRules(data);

  return data;
}

function toUpdateInput(dto: UpdateAbsenceTypeDto): UpdateAbsenceTypeInput {
  if (dto.displayOrder !== undefined) {
    validateDisplayOrder(dto.displayOrder);
  }

  const data: UpdateAbsenceTypeInput = {};

  if (dto.code !== undefined) data.code = normalizeCode(dto.code);
  if (dto.name !== undefined) data.name = normalizeName(dto.name);
  if (dto.description !== undefined) {
    data.description = normalizeText(dto.description);
  }
  if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
  if (dto.isActive !== undefined) data.isActive = dto.isActive;
  if (dto.durationMode !== undefined) data.durationMode = dto.durationMode;
  if (dto.requiresApproval !== undefined) {
    data.requiresApproval = dto.requiresApproval;
  }
  if (dto.isPaid !== undefined) data.isPaid = dto.isPaid;
  if (dto.blocksShifts !== undefined) data.blocksShifts = dto.blocksShifts;
  if (dto.countsAsWorkedTime !== undefined) {
    data.countsAsWorkedTime = dto.countsAsWorkedTime;
  }
  if (dto.requiresDocument !== undefined) {
    data.requiresDocument = dto.requiresDocument;
  }
  if (dto.allowsNotes !== undefined) data.allowsNotes = dto.allowsNotes;
  if (dto.affectsPayroll !== undefined) data.affectsPayroll = dto.affectsPayroll;
  if (dto.color !== undefined) data.color = normalizeColor(dto.color);
  if (dto.icon !== undefined) data.icon = normalizeText(dto.icon);
  if (dto.legalCategory !== undefined) data.legalCategory = dto.legalCategory;

  validateBusinessRules(data);

  return data;
}

function ensureActiveUser(ctx: RequestContext): ServiceResult<never> | null {
  if (!ctx.isActive) {
    return {
      ok: false,
      error: "Usuario inactivo.",
      status: 403,
    };
  }

  return null;
}

function ensureCanManageAbsenceTypes(
  ctx: RequestContext
): ServiceResult<never> | null {
  if (!canManageAbsenceTypes(ctx.role)) {
    return {
      ok: false,
      error: "No tienes permisos para gestionar tipos de ausencia.",
      status: 403,
    };
  }

  return null;
}

export const absenceTypeService = {
  async list(
    filters?: AbsenceTypeListFilters
  ): Promise<ServiceResult<AbsenceType[]>> {
    const data = await absenceTypeRepository.findAll(filters);
    return { ok: true, data };
  },

  async getById(id: string): Promise<ServiceResult<AbsenceType>> {
    const item = await absenceTypeRepository.findById(id);

    if (!item) {
      return {
        ok: false,
        error: "Tipo de ausencia no encontrado.",
        status: 404,
      };
    }

    return { ok: true, data: item };
  },

  async create(
    dto: CreateAbsenceTypeDto,
    ctx: RequestContext
  ): Promise<ServiceResult<AbsenceType>> {
    try {
      const inactiveError = ensureActiveUser(ctx);
      if (inactiveError) return inactiveError;

      const permissionError = ensureCanManageAbsenceTypes(ctx);
      if (permissionError) return permissionError;

      const data = toCreateInput(dto);

      const existing = await absenceTypeRepository.findByCode(data.code);
      if (existing) {
        return {
          ok: false,
          error: "Ya existe un tipo de ausencia con ese código.",
          status: 409,
        };
      }

      const created = await absenceTypeRepository.create(data);
      return { ok: true, data: created };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al crear el tipo de ausencia.",
        status: 400,
      };
    }
  },

  async update(
    id: string,
    dto: UpdateAbsenceTypeDto,
    ctx: RequestContext
  ): Promise<ServiceResult<AbsenceType>> {
    try {
      const inactiveError = ensureActiveUser(ctx);
      if (inactiveError) return inactiveError;

      const permissionError = ensureCanManageAbsenceTypes(ctx);
      if (permissionError) return permissionError;

      const existing = await absenceTypeRepository.findById(id);

      if (!existing) {
        return {
          ok: false,
          error: "Tipo de ausencia no encontrado.",
          status: 404,
        };
      }

      const data = toUpdateInput(dto);

      if (data.code && data.code !== existing.code) {
        const duplicate = await absenceTypeRepository.findByCode(data.code);

        if (duplicate) {
          return {
            ok: false,
            error: "Ya existe un tipo de ausencia con ese código.",
            status: 409,
          };
        }
      }

      const updated = await absenceTypeRepository.update(id, data);
      return { ok: true, data: updated };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar el tipo de ausencia.",
        status: 400,
      };
    }
  },

  async delete(
    id: string,
    ctx: RequestContext
  ): Promise<ServiceResult<AbsenceType>> {
    const inactiveError = ensureActiveUser(ctx);
    if (inactiveError) return inactiveError;

    const permissionError = ensureCanManageAbsenceTypes(ctx);
    if (permissionError) return permissionError;

    const existing = await absenceTypeRepository.findById(id);

    if (!existing) {
      return {
        ok: false,
        error: "Tipo de ausencia no encontrado.",
        status: 404,
      };
    }

    const deleted = await absenceTypeRepository.delete(id);
    return { ok: true, data: deleted };
  },
};