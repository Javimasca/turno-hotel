import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const deleted = await prisma.employeeAvailabilityBlock.delete({
      where: { id },
    });

    return NextResponse.json(deleted);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar el día libre." },
      { status: 400 }
    );
  }
}