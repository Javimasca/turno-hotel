import { employeeRepository } from "@/lib/employees/employee.repository";
import { getJobCategoryById } from "@/lib/job-categories/job-category.repository";
import { employeeContractRepository } from "@/lib/employee-contracts/employee-contract.repository";

export class EmployeeContractNotFoundError extends Error {
  constructor() {
    super("El contrato del empleado no existe.");
    this.name = "EmployeeContractNotFoundError";
  }
}

export class EmployeeNotFoundForContractError extends Error {
  constructor() {
    super("El empleado seleccionado no existe.");
    this.name = "EmployeeNotFoundForContractError";
  }
}

export class JobCategoryNotFoundForContractError extends Error {
  constructor() {
    super("La categoría profesional seleccionada no existe.");
    this.name = "JobCategoryNotFoundForContractError";
  }
}

export class EmployeeContractDateRangeInvalidError extends Error {
  constructor() {
    super("La fecha fin del contrato no puede ser anterior a la fecha de inicio.");
    this.name = "EmployeeContractDateRangeInvalidError";
  }
}

export class EmployeeContractSeniorityDateInvalidError extends Error {
  constructor() {
    super(
      "La fecha de antigüedad no puede ser posterior a la fecha de inicio del contrato.",
    );
    this.name = "EmployeeContractSeniorityDateInvalidError";
  }
}

export class EmployeeContractOverlapError extends Error {
  constructor() {
    super("Ya existe un contrato que se solapa con ese rango de fechas.");
    this.name = "EmployeeContractOverlapError";
  }
}

type ContractType =
  | "INDEFINIDO"
  | "TEMPORAL"
  | "FIJO_DISCONTINUO"
  | "FORMACION"
  | "PRACTICAS"
  | "INTERINIDAD"
  | "EVENTUAL"
  | "OTRO";

type ListEmployeeContractsFilters = {
  employeeId?: string;
};

type CreateEmployeeContractInput = {
  employeeId: string;
  jobCategoryId: string;
  contractType: ContractType;
  startDate: string | Date;
  endDate?: string | Date | null;
  seniorityDate?: string | Date | null;
  weeklyHours?: number | null;
  dailyHours?: number | null;
  employmentRate?: number | null;
  notes?: string | null;
};

type UpdateEmployeeContractInput = {
  jobCategoryId?: string;
  contractType?: ContractType;
  startDate?: string | Date;
  endDate?: string | Date | null;
  seniorityDate?: string | Date | null;
  weeklyHours?: number | null;
  dailyHours?: number | null;
  employmentRate?: number | null;
  notes?: string | null;
};

function normalizeString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeNullableString(value: string | null | undefined) {
  if (value === null) {
    return null;
  }

  const normalized = normalizeString(value);

  return normalized ?? null;
}

function parseDateValue(value: string | Date | null | undefined) {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

function normalizeNumber(value: number | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function rangesOverlap(
  startA: Date,
  endA: Date | null,
  startB: Date,
  endB: Date | null,
) {
  const aEnd = endA ?? new Date("9999-12-31T23:59:59.999Z");
  const bEnd = endB ?? new Date("9999-12-31T23:59:59.999Z");

  return startA <= bEnd && startB <= aEnd;
}

export const employeeContractService = {
  async list(filters: ListEmployeeContractsFilters = {}) {
    return employeeContractRepository.findMany(filters);
  },

  async getById(id: string) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new EmployeeContractNotFoundError();
    }

    const contract = await employeeContractRepository.findById(normalizedId);

    if (!contract) {
      throw new EmployeeContractNotFoundError();
    }

    return contract;
  },

  async create(input: CreateEmployeeContractInput) {
    const employeeId = normalizeString(input.employeeId);
    const jobCategoryId = normalizeString(input.jobCategoryId);
    const contractType = input.contractType;
    const startDate = parseDateValue(input.startDate);
    const endDate = parseDateValue(input.endDate);
    const seniorityDate = parseDateValue(input.seniorityDate);
    const weeklyHours = normalizeNumber(input.weeklyHours);
    const dailyHours = normalizeNumber(input.dailyHours);
    const employmentRate = normalizeNumber(input.employmentRate);
    const notes = normalizeNullableString(input.notes);

    if (!employeeId) {
      throw new EmployeeNotFoundForContractError();
    }

    if (!jobCategoryId) {
      throw new JobCategoryNotFoundForContractError();
    }

    if (!startDate) {
      throw new Error("La fecha de inicio del contrato es obligatoria.");
    }

    const employee = await employeeRepository.findById(employeeId);

    if (!employee) {
      throw new EmployeeNotFoundForContractError();
    }

    const jobCategory = await getJobCategoryById(jobCategoryId);

    if (!jobCategory) {
      throw new JobCategoryNotFoundForContractError();
    }

    if (endDate && endDate < startDate) {
      throw new EmployeeContractDateRangeInvalidError();
    }

    if (seniorityDate && seniorityDate > startDate) {
      throw new EmployeeContractSeniorityDateInvalidError();
    }

    const existingContracts = await employeeContractRepository.findMany({
      employeeId,
    });

    const hasOverlap = existingContracts.some((contract) =>
      rangesOverlap(
        startDate,
        endDate ?? null,
        contract.startDate,
        contract.endDate,
      ),
    );

    if (hasOverlap) {
      throw new EmployeeContractOverlapError();
    }

    return employeeContractRepository.create({
      employeeId,
      jobCategoryId,
      contractType,
      startDate,
      endDate: endDate ?? null,
      seniorityDate: seniorityDate ?? null,
      weeklyHours: weeklyHours ?? null,
      dailyHours: dailyHours ?? null,
      employmentRate: employmentRate ?? null,
      notes,
    });
  },

  async update(id: string, input: UpdateEmployeeContractInput) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new EmployeeContractNotFoundError();
    }

    const existingContract = await employeeContractRepository.findById(normalizedId);

    if (!existingContract) {
      throw new EmployeeContractNotFoundError();
    }

    const jobCategoryId =
      input.jobCategoryId !== undefined
        ? normalizeString(input.jobCategoryId)
        : undefined;

    let startDate: Date | undefined;

    if (input.startDate !== undefined) {
      const parsedStartDate = parseDateValue(input.startDate);

      if (!parsedStartDate) {
        throw new Error("La fecha de inicio del contrato es obligatoria.");
      }

      startDate = parsedStartDate;
    }

    const endDate =
      input.endDate !== undefined ? parseDateValue(input.endDate) : undefined;

    const seniorityDate =
      input.seniorityDate !== undefined
        ? parseDateValue(input.seniorityDate)
        : undefined;

    const weeklyHours = normalizeNumber(input.weeklyHours);
    const dailyHours = normalizeNumber(input.dailyHours);
    const employmentRate = normalizeNumber(input.employmentRate);
    const notes =
      input.notes !== undefined ? normalizeNullableString(input.notes) : undefined;

    if (input.jobCategoryId !== undefined && !jobCategoryId) {
      throw new JobCategoryNotFoundForContractError();
    }

    if (jobCategoryId) {
      const jobCategory = await getJobCategoryById(jobCategoryId);

      if (!jobCategory) {
        throw new JobCategoryNotFoundForContractError();
      }
    }

    const nextStartDate = startDate ?? existingContract.startDate;
    const nextEndDate =
      endDate !== undefined ? endDate : existingContract.endDate;
    const nextSeniorityDate =
      seniorityDate !== undefined ? seniorityDate : existingContract.seniorityDate;

    if (nextEndDate && nextEndDate < nextStartDate) {
      throw new EmployeeContractDateRangeInvalidError();
    }

    if (nextSeniorityDate && nextSeniorityDate > nextStartDate) {
      throw new EmployeeContractSeniorityDateInvalidError();
    }

    const existingContracts = await employeeContractRepository.findMany({
      employeeId: existingContract.employeeId,
    });

    const hasOverlap = existingContracts
      .filter((contract) => contract.id !== normalizedId)
      .some((contract) =>
        rangesOverlap(
          nextStartDate,
          nextEndDate ?? null,
          contract.startDate,
          contract.endDate,
        ),
      );

    if (hasOverlap) {
      throw new EmployeeContractOverlapError();
    }

    return employeeContractRepository.update(normalizedId, {
      ...(jobCategoryId !== undefined ? { jobCategoryId } : {}),
      ...(input.contractType !== undefined
        ? { contractType: input.contractType }
        : {}),
      ...(startDate !== undefined ? { startDate } : {}),
      ...(endDate !== undefined ? { endDate } : {}),
      ...(seniorityDate !== undefined ? { seniorityDate } : {}),
      ...(weeklyHours !== undefined ? { weeklyHours } : {}),
      ...(dailyHours !== undefined ? { dailyHours } : {}),
      ...(employmentRate !== undefined ? { employmentRate } : {}),
      ...(notes !== undefined ? { notes } : {}),
    });
  },

  async delete(id: string) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new EmployeeContractNotFoundError();
    }

    const existingContract = await employeeContractRepository.findById(normalizedId);

    if (!existingContract) {
      throw new EmployeeContractNotFoundError();
    }

    return employeeContractRepository.delete(normalizedId);
  },
};