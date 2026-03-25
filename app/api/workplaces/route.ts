import { NextResponse } from "next/server";
import { listWorkplaces } from "@/lib/workplaces/workplace.service";

export async function GET() {
  try {
    const workplaces = await listWorkplaces({
      isActive: true,
    });

    return NextResponse.json(workplaces);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ha ocurrido un error inesperado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}