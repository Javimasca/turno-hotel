import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado." },
        { status: 401 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ha ocurrido un error inesperado.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}