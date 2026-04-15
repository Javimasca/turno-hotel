import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/auth-session";

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ha ocurrido un error inesperado.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}