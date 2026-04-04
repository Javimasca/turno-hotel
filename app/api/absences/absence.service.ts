import {
  Absence,
  AbsenceDurationMode,
  AbsenceStatus,
  AbsenceUnit,
} from "@prisma/client";
import {
  absenceRepository,
  CreateAbsenceInput,
  UpdateAbsenceInput,
} from "./absence.repository";

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

type CreateAbsenceDto = {
  employeeId: string;
  absenceTypeId: string;
  unit: AbsenceUnit;
  startDate: Date | string;
  endDate: Date | string;
  startMinutes?: number | null;
  endMinutes?: number | null;
  status?: AbsenceStatus;
  notes?: string | null;
  documentUrl?: string | null;
};

type UpdateAbsenceDto = Partial<CreateAbsenceDto>;

function normalizeText(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toDateOnly(value: Date | string): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha inválida.");
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

function validateMinutes(value: number | null | undefined, fieldName: string) {
  if (value == null) return;
  if (!Number.isInteger(value) || value < 0 || value > 1440) {
    throw new Error(`${fieldName} debe ser un entero entre 0 y 1440.`);
  }
}

function validateUnitCompatibility(
  durationMode: AbsenceDurationMode,
  unit: AbsenceUnit
) {
  if (
    (durationMode === AbsenceDurationMode.FULL_DAY &&
      unit !== AbsenceUnit.FULL_DAY) ||
    (durationMode === AbsenceDurationMode.HOURLY &&
      unit !== AbsenceUnit.HOURLY)
  ) {
    throw new Error("La unidad no es válida para el tipo de ausencia.");
  }
}

function validateStructure(data: {
  unit: AbsenceUnit;
  startDate: Date;
  endDate: Date;
  startMinutes?: number | null;
  endMinutes?: number | null;
}) {
  validateMinutes(data.startMinutes, "startMinutes");
  validateMinutes(data.endMinutes, "endMinutes");

  if (data.unit === AbsenceUnit.FULL_DAY) {
    if (data.startDate.getTime() > data.endDate.getTime()) {
      throw new Error("La fecha de inicio no puede ser mayor que la fecha de fin.");
    }

    if (data.startMinutes != null || data.endMinutes != null) {
      throw new Error("Una ausencia de día completo no debe incluir horas.");
    }
  }

  if (data.unit === AbsenceUnit.HOURLY) {
    if (!isSameDay(data.startDate, data.endDate)) {
      throw new Error("Una ausencia por horas debe estar dentro del mismo día.");
    }

    if (data.startMinutes == null || data.endMinutes == null) {
      throw new Error("Una ausencia por horas requiere hora de inicio y fin.");
    }

    if (data.startMinutes >= data.endMinutes) {
      throw new Error("La hora de inicio debe ser menor que la hora de fin.");
    }
  }
}

function toCreateInput(dto: CreateAbsenceDto): CreateAbsenceInput {
  const startDate = toDateOnly(dto.startDate);
  const endDate = toDateOnly(dto.endDate);

  const data: CreateAbsenceInput = {
    employeeId: dto.employeeId,
    absenceTypeId: dto.absenceTypeId,
    unit: dto.unit,
    startDate,
    endDate,
    startMinutes:
      dto.unit === AbsenceUnit.HOURLY ? (dto.startMinutes ?? null) : null,
    endMinutes:
      dto.unit === AbsenceUnit.HOURLY ? (dto.endMinutes ?? null) : null,
    status: dto.status ?? AbsenceStatus.PENDING,
    notes: normalizeText(dto.notes),
    documentUrl: normalizeText(dto.documentUrl),
  };

  validateStructure(data);

  return data;
}

function toUpdateInput(dto: UpdateAbsenceDto): UpdateAbsenceInput {
  const data: UpdateAbsenceInput = {};

  if (dto.employeeId !== undefined) data.employeeId = dto.employeeId;
  if (dto.absenceTypeId !== undefined) data.absenceTypeId = dto.absenceTypeId;
  if (dto.unit !== undefined) data.unit = dto.unit;
  if (dto.startDate !== undefined) data.startDate = toDateOnly(dto.startDate);
  if (dto.endDate !== undefined) data.endDate = toDateOnly(dto.endDate);
  if (dto.startMinutes !== undefined) data.startMinutes = dto.startMinutes;
  if (dto.endMinutes !== undefined) data.endMinutes = dto.endMinutes;
  if (dto.status !== undefined) data.status = dto.status;
  if (dto.notes !== undefined) data.notes = normalizeText(dto.notes);
  if (dto.documentUrl !== undefined) {
    data.documentUrl = normalizeText(dto.documentUrl);
  }

  return data;
}

async function validateOverlap(params: {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  excludeId?: string;
}) {
  const conflict = await absenceRepository.findOverlap({
    employeeId: params.employeeId,
    startDate: params.startDate,
    endDate: params.endDate,
    excludeId: params.excludeId,
    statuses: [AbsenceStatus.PENDING, AbsenceStatus.APPROVED],
  });

  if (conflict) {
    throw new Error("Ya existe otra ausencia para ese empleado en ese rango o día.");
  }
}

async function validateFullDayApprovalConflicts(absence: {
  employeeId: string;
  unit: AbsenceUnit;
  startDate: Date;
  endDate: Date;
}) {
  if (absence.unit !== AbsenceUnit.FULL_DAY) return;

  const hasShiftConflict = await absenceRepository.existsShiftConflict({
    employeeId: absence.employeeId,
    startDate: absence.startDate,
    endDate: absence.endDate,
  });

  if (hasShiftConflict) {
    throw new Error(
      "No se puede aprobar la ausencia porque existen turnos en ese rango."
    );
  }
}

export const absenceService = {
  async list(): Promise<ServiceResult<Absence[]>> {
    const data = await absenceRepository.findAll();
    return { ok: true, data };
  },

  async getById(id: string): Promise<ServiceResult<Absence>> {
    const item = await absenceRepository.findById(id);

    if (!item) {
      return {
        ok: false,
        error: "Ausencia no encontrada.",
        status: 404,
      };
    }

    return { ok: true, data: item };
  },

  async create(dto: CreateAbsenceDto): Promise<ServiceResult<Absence>> {
    try {
      const absenceType = await absenceRepository.findAbsenceTypeById(
        dto.absenceTypeId
      );

      if (!absenceType) {
        return {
          ok: false,
          error: "Tipo de ausencia no encontrado.",
          status: 404,
        };
      }

      const employee = await absenceRepository.findEmployeeById(dto.employeeId);

      if (!employee) {
        return {
          ok: false,
          error: "Empleado no encontrado.",
          status: 404,
        };
      }

      const data = toCreateInput(dto);

      validateUnitCompatibility(absenceType.durationMode, data.unit);

      await validateOverlap({
        employeeId: data.employeeId,
        startDate: data.startDate,
        endDate: data.endDate,
      });

      if (data.status === AbsenceStatus.APPROVED) {
        await validateFullDayApprovalConflicts(data);
      }

      const created = await absenceRepository.create(data);
      return { ok: true, data: created };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error al crear la ausencia.",
        status: 400,
      };
    }
  },

  async update(
    id: string,
    dto: UpdateAbsenceDto
  ): Promise<ServiceResult<Absence>> {
    try {
      const existing = await absenceRepository.findById(id);

      if (!existing) {
        return {
          ok: false,
          error: "Ausencia no encontrada.",
          status: 404,
        };
      }

      const data = toUpdateInput(dto);

      const nextEmployeeId = data.employeeId ?? existing.employeeId;
      const nextAbsenceTypeId = data.absenceTypeId ?? existing.absenceTypeId;
      const nextUnit = data.unit ?? existing.unit;
      const nextStartDate = data.startDate ?? existing.startDate;
      const nextEndDate = data.endDate ?? existing.endDate;
      const nextStartMinutes =
        data.startMinutes !== undefined ? data.startMinutes : existing.startMinutes;
      const nextEndMinutes =
        data.endMinutes !== undefined ? data.endMinutes : existing.endMinutes;
      const nextStatus = data.status ?? existing.status;

      const absenceType = await absenceRepository.findAbsenceTypeById(
        nextAbsenceTypeId
      );

      if (!absenceType) {
        return {
          ok: false,
          error: "Tipo de ausencia no encontrado.",
          status: 404,
        };
      }

      const employee = await absenceRepository.findEmployeeById(nextEmployeeId);

      if (!employee) {
        return {
          ok: false,
          error: "Empleado no encontrado.",
          status: 404,
        };
      }

      validateUnitCompatibility(absenceType.durationMode, nextUnit);

      validateStructure({
        unit: nextUnit,
        startDate: nextStartDate,
        endDate: nextEndDate,
        startMinutes: nextUnit === AbsenceUnit.HOURLY ? nextStartMinutes : null,
        endMinutes: nextUnit === AbsenceUnit.HOURLY ? nextEndMinutes : null,
      });

      if (nextUnit === AbsenceUnit.FULL_DAY) {
        data.startMinutes = null;
        data.endMinutes = null;
      }

      await validateOverlap({
        employeeId: nextEmployeeId,
        startDate: nextStartDate,
        endDate: nextEndDate,
        excludeId: id,
      });

      if (nextStatus === AbsenceStatus.APPROVED) {
        await validateFullDayApprovalConflicts({
          employeeId: nextEmployeeId,
          unit: nextUnit,
          startDate: nextStartDate,
          endDate: nextEndDate,
        });
      }

      const updated = await absenceRepository.update(id, data);
      return { ok: true, data: updated };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar la ausencia.",
        status: 400,
      };
    }
  },

  async approve(id: string): Promise<ServiceResult<Absence>> {
    try {
      const existing = await absenceRepository.findById(id);

      if (!existing) {
        return {
          ok: false,
          error: "Ausencia no encontrada.",
          status: 404,
        };
      }

      await validateFullDayApprovalConflicts(existing);

      const updated = await absenceRepository.update(id, {
        status: AbsenceStatus.APPROVED,
      });

      return { ok: true, data: updated };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al aprobar la ausencia.",
        status: 400,
      };
    }
  },

  async delete(id: string): Promise<ServiceResult<Absence>> {
    const existing = await absenceRepository.findById(id);

    if (!existing) {
      return {
        ok: false,
        error: "Ausencia no encontrada.",
        status: 404,
      };
    }

    const deleted = await absenceRepository.delete(id);
    return { ok: true, data: deleted };
  },
};