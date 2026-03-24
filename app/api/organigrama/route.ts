import { NextResponse } from "next/server";

import { employeeOrgService } from "@/lib/employees/employee.org.service";

export async function GET() {
  try {
    const tree = await employeeOrgService.getTree();

    return NextResponse.json(tree);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al obtener el organigrama.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}