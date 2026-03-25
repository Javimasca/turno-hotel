export type ShiftStatus = "BORRADOR" | "PUBLICADO" | "CANCELADO";

export type CreateShiftInput = {
  employeeId: string;
  workplaceId?: string;
  departmentId?: string;
  jobCategoryId?: string | null;
  shiftMasterId?: string | null;
  date?: Date;
  startAt?: Date;
  endAt?: Date;
  status?: ShiftStatus;
  notes?: string | null;
};

export type UpdateShiftInput = {
  employeeId?: string;
  workplaceId?: string;
  departmentId?: string;
  jobCategoryId?: string | null;
  shiftMasterId?: string | null;
  date?: Date;
  startAt?: Date;
  endAt?: Date;
  status?: ShiftStatus;
  notes?: string | null;
};

export type ShiftFilters = {
  startAt: Date;
  endAt: Date;
  workplaceId?: string;
  departmentId?: string;
  employeeId?: string;
  status?: ShiftStatus;
  shiftMasterId?: string;
};