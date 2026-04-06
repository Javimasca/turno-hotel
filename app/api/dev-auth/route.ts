import { NextRequest, NextResponse } from "next/server";
import { DEV_AUTH_COOKIE, isUserRole } from "@/lib/auth/dev-auth";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "No disponible fuera de desarrollo." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    if (!body.userId || typeof body.userId !== "string") {
      return NextResponse.json(
        { error: "userId es obligatorio." },
        { status: 400 }
      );
    }

    if (!body.role || typeof body.role !== "string" || !isUserRole(body.role)) {
      return NextResponse.json(
        { error: "role no es válido." },
        { status: 400 }
      );
    }

    const payload = {
      userId: body.userId.trim(),
      role: body.role,
      employeeId:
        typeof body.employeeId === "string" && body.employeeId.trim().length
          ? body.employeeId.trim()
          : null,
      isActive: body.isActive !== false,
    };

    const response = NextResponse.json({ ok: true });

    response.cookies.set(DEV_AUTH_COOKIE, JSON.stringify(payload), {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Error al guardar el usuario de desarrollo." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "No disponible fuera de desarrollo." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(DEV_AUTH_COOKIE, "", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}