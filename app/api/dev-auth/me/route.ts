import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/getRequestContext";

export async function GET() {
  const ctx = await getRequestContext();
  return NextResponse.json(ctx);
}