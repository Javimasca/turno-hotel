import { NextRequest, NextResponse } from "next/server";
import { absenceService } from "../../absence.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await absenceService.approve(id);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 }
    );
  }

  return NextResponse.json(result.data);
}