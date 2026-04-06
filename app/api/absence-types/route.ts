import { NextRequest, NextResponse } from "next/server";
import { absenceTypeService } from "@/lib/absence-types/absence-type.service";
import { getRequestContext } from "@/lib/auth/getRequestContext";

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const isActive = parseBoolean(searchParams.get("isActive"));
  const search = searchParams.get("search") ?? undefined;

  const result = await absenceTypeService.list({
    isActive,
    search,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 }
    );
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ctx = await getRequestContext();

  const result = await absenceTypeService.create(body, ctx);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 }
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}