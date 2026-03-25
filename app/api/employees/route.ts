import { NextResponse } from "next/server";
import { employeeRepository } from "@/lib/employees/employee.repository";

export async function GET() {
  try {
    const employees = await employeeRepository.findMany({});

    return NextResponse.json(employees);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ha ocurrido un error inesperado.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}