import { NextResponse } from "next/server";
import { userService, UserServiceError } from "@/lib/users/user.service";
import { getSessionUser } from "@/lib/auth/auth-session";

type CreateUserBody = {
  email: string;
  password: string;
  name?: string | null;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive?: boolean;
  employeeId?: string | null;
};

export async function GET() {
  try {
    const currentUser = await getSessionUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    if (!currentUser.isActive) {
      return NextResponse.json(
        { error: "Tu usuario está inactivo." },
        { status: 403 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para consultar usuarios." },
        { status: 403 }
      );
    }

    const users = await userService.list();

    return NextResponse.json(users);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ha ocurrido un error inesperado.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getSessionUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    if (!currentUser.isActive) {
      return NextResponse.json(
        { error: "Tu usuario está inactivo." },
        { status: 403 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para crear usuarios." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as CreateUserBody;

    const user = await userService.create({
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role,
      isActive: body.isActive,
      employeeId: body.employeeId,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Ha ocurrido un error inesperado.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}