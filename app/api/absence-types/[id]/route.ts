import { NextRequest, NextResponse } from "next/server";
import { absenceTypeService } from "@/lib/absence-types/absence-type.service";
import { getRequestContext } from "@/lib/auth/getRequestContext";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await absenceTypeService.getById(id);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 404 }
    );
  }

  return NextResponse.json(result.data);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const ctx = await getRequestContext();

  const result = await absenceTypeService.update(id, body, ctx);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 }
    );
  }

  return NextResponse.json(result.data);
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const ctx = await getRequestContext();

  const result = await absenceTypeService.delete(id, ctx);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 404 }
    );
  }

  return NextResponse.json(result.data);
}