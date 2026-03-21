import { employeeRepository } from "@/lib/employees/employee.repository";

export class EmployeeNotFoundError extends Error {
  constructor() {
    super("El empleado no existe.");
    this.name = "EmployeeNotFoundError";
  }
}

export class EmployeeCodeAlreadyExistsError extends Error {
  constructor() {
    super("Ya existe un empleado con ese código.");
    this.name = "EmployeeCodeAlreadyExistsError";
  }
}

export class EmployeeEmailAlreadyExistsError extends Error {
  constructor() {
    super("Ya existe un empleado con ese email.");
    this.name = "EmployeeEmailAlreadyExistsError";
  }
}

export class EmployeeDirectManagerNotFoundError extends Error {
  constructor() {
    super("El jefe inmediato seleccionado no existe.");
    this.name = "EmployeeDirectManagerNotFoundError";
  }
}

export class EmployeeCannotManageThemselfError extends Error {
  constructor() {
    super("Un empleado no puede tenerse a sí mismo como jefe inmediato.");
    this.name = "EmployeeCannotManageThemselfError";
  }
}

type ListEmployeesFilters = {
  isActive?: boolean;
  search?: string;
};

type CreateEmployeeInput = {
  code: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  directManagerEmployeeId?: string | null;
  isActive?: boolean;
};

type UpdateEmployeeInput = {
  code?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  directManagerEmployeeId?: string | null;
  isActive?: boolean;
};

function normalizeString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

export const employeeService = {
  async list(filters: ListEmployeesFilters = {}) {
    return employeeRepository.findMany(filters);
  },

  async getById(id: string) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new EmployeeNotFoundError();
    }

    const employee = await employeeRepository.findById(normalizedId);

    if (!employee) {
      throw new EmployeeNotFoundError();
    }

    return employee;
  },

  async create(input: CreateEmployeeInput) {
    const code = normalizeString(input.code);
    const firstName = normalizeString(input.firstName);
    const lastName = normalizeString(input.lastName);
    const email = normalizeString(input.email ?? undefined);
    const phone = normalizeString(input.phone ?? undefined);
    const directManagerEmployeeId = normalizeString(
      input.directManagerEmployeeId ?? undefined,
    );
    const isActive = typeof input.isActive === "boolean" ? input.isActive : true;

    if (!code) {
      throw new Error("El código es obligatorio.");
    }

    if (!firstName) {
      throw new Error("El nombre es obligatorio.");
    }

    if (!lastName) {
      throw new Error("Los apellidos son obligatorios.");
    }

    const existingByCode = await employeeRepository.findByCode(code);

    if (existingByCode) {
      throw new EmployeeCodeAlreadyExistsError();
    }

    if (email) {
      const existingByEmail = await employeeRepository.findByEmail(email);

      if (existingByEmail) {
        throw new EmployeeEmailAlreadyExistsError();
      }
    }

    if (directManagerEmployeeId) {
      const directManager = await employeeRepository.findById(
        directManagerEmployeeId,
      );

      if (!directManager) {
        throw new EmployeeDirectManagerNotFoundError();
      }
    }

    return employeeRepository.create({
      code,
      firstName,
      lastName,
      email: email ?? null,
      phone: phone ?? null,
      directManagerEmployeeId: directManagerEmployeeId ?? null,
      isActive,
    });
  },

  async update(id: string, input: UpdateEmployeeInput) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new EmployeeNotFoundError();
    }

    const existingEmployee = await employeeRepository.findById(normalizedId);

    if (!existingEmployee) {
      throw new EmployeeNotFoundError();
    }

    const code =
      input.code !== undefined ? normalizeString(input.code) : undefined;

    const firstName =
      input.firstName !== undefined
        ? normalizeString(input.firstName)
        : undefined;

    const lastName =
      input.lastName !== undefined ? normalizeString(input.lastName) : undefined;

    const email =
      input.email !== undefined
        ? normalizeString(input.email ?? undefined) ?? null
        : undefined;

    const phone =
      input.phone !== undefined
        ? normalizeString(input.phone ?? undefined) ?? null
        : undefined;

    const directManagerEmployeeId =
      input.directManagerEmployeeId !== undefined
        ? normalizeString(input.directManagerEmployeeId ?? undefined) ?? null
        : undefined;

    if (input.code !== undefined && !code) {
      throw new Error("El código es obligatorio.");
    }

    if (input.firstName !== undefined && !firstName) {
      throw new Error("El nombre es obligatorio.");
    }

    if (input.lastName !== undefined && !lastName) {
      throw new Error("Los apellidos son obligatorios.");
    }

    if (code && code !== existingEmployee.code) {
      const employeeWithSameCode = await employeeRepository.findByCode(code);

      if (employeeWithSameCode && employeeWithSameCode.id !== normalizedId) {
        throw new EmployeeCodeAlreadyExistsError();
      }
    }

    if (email && email !== existingEmployee.email) {
      const employeeWithSameEmail = await employeeRepository.findByEmail(email);

      if (employeeWithSameEmail && employeeWithSameEmail.id !== normalizedId) {
        throw new EmployeeEmailAlreadyExistsError();
      }
    }

    if (directManagerEmployeeId !== undefined) {
      if (directManagerEmployeeId === normalizedId) {
        throw new EmployeeCannotManageThemselfError();
      }

      if (directManagerEmployeeId) {
        const directManager = await employeeRepository.findById(
          directManagerEmployeeId,
        );

        if (!directManager) {
          throw new EmployeeDirectManagerNotFoundError();
        }
      }
    }

    return employeeRepository.update(normalizedId, {
      ...(code !== undefined ? { code } : {}),
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(directManagerEmployeeId !== undefined
        ? { directManagerEmployeeId }
        : {}),
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
    });
  },

  async delete(id: string) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new EmployeeNotFoundError();
    }

    const existingEmployee = await employeeRepository.findById(normalizedId);

    if (!existingEmployee) {
      throw new EmployeeNotFoundError();
    }

    return employeeRepository.delete(normalizedId);
  },
};