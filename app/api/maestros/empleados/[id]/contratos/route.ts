import { NextRequest, NextResponse } from "next/server";

import {
  employeeContractService,
  EmployeeContractOverlapError,
  EmployeeContractDateRangeInvalidError,
  EmployeeContractSeniorityDateInvalidError,
  EmployeeNotFoundForContractError,
  JobCategoryNotFoundForContractError,
} from "@/lib/employee-contracts/employee-contract.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const contracts = await employeeContractService.list({
      employeeId: id,
    });

    return NextResponse.json(contracts);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al obtener los contratos.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const formData = await req.formData();

    const jobCategoryId = String(formData.get("jobCategoryId") ?? "");
    const contractType = String(formData.get("contractType") ?? "");
    const startDate = String(formData.get("startDate") ?? "");
    const endDate = formData.get("endDate")?.toString() || null;
    const seniorityDate = formData.get("seniorityDate")?.toString() || null;

    const weeklyHours = parseNumber(
      formData.get("weeklyHours")?.toString() ?? null,
    );
    const dailyHours = parseNumber(
      formData.get("dailyHours")?.toString() ?? null,
    );
    const employmentRate = parseNumber(
      formData.get("employmentRate")?.toString() ?? null,
    );

    const notes = formData.get("notes")?.toString() || null;

    await employeeContractService.create({
      employeeId: id,
      jobCategoryId,
      contractType: contractType as any,
      startDate,
      endDate,
      seniorityDate,
      weeklyHours,
      dailyHours,
      employmentRate,
      notes,
    });

    return NextResponse.redirect(
      new URL(`/maestros/empleados/${id}/contratos`, req.url),
      { status: 303 },
    );
  } catch (error) {
    if (error instanceof EmployeeContractOverlapError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof EmployeeContractDateRangeInvalidError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof EmployeeContractSeniorityDateInvalidError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof EmployeeNotFoundForContractError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof JobCategoryNotFoundForContractError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Error al crear el contrato.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}