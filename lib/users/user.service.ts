import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { userRepository } from "@/lib/users/user.repository";
import { employeeRepository } from "@/lib/employees/employee.repository";

export class UserServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserServiceError";
    this.status = status;
  }
}

type CreateUserInput = {
  email: string;
  password: string;
  name?: string | null;
  role: UserRole;
  isActive?: boolean;
  employeeId?: string | null;
};

export const userService = {
  async list() {
    return userRepository.findMany();
  },

  async create(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!email) {
      throw new UserServiceError("El email es obligatorio.");
    }

    if (!password) {
      throw new UserServiceError("La contraseña es obligatoria.");
    }

    if (password.length < 8) {
      throw new UserServiceError(
        "La contraseña debe tener al menos 8 caracteres."
      );
    }

    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new UserServiceError("Ya existe un usuario con ese email.", 409);
    }

    if (input.employeeId) {
      const employee = await employeeRepository.findById(input.employeeId);

      if (!employee) {
        throw new UserServiceError("El empleado seleccionado no existe.");
      }

      const existingUserForEmployee = await userRepository.findByEmployeeId(
        input.employeeId
      );

      if (existingUserForEmployee) {
        throw new UserServiceError(
          "Ese empleado ya tiene un usuario vinculado.",
          409
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return userRepository.create({
      email,
      passwordHash,
      name: input.name?.trim() || null,
      role: input.role,
      isActive: input.isActive ?? true,
      employeeId: input.employeeId ?? null,
    });
  },
};