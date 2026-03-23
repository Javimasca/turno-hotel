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

function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;

  const parsed =
    typeof value === "number" ? value : Number(value);

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
    const contentType = req.headers.get("content-type") || "";

    let jobCategoryId = "";
    let contractType = "";
    let startDate = "";
    let endDate: string | null = null;
    let seniorityDate: string | null = null;
    let weeklyHours: number | undefined;
    let dailyHours: number | undefined;
    let employmentRate: number | undefined;
    let notes: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();

      jobCategoryId = String(body.jobCategoryId ?? "");
      contractType = String(body.contractType ?? "");
      startDate = String(body.startDate ?? "");
      endDate = body.endDate ?? null;
      seniorityDate = body.seniorityDate ?? null;
      weeklyHours = parseNumber(body.weeklyHours);
      dailyHours = parseNumber(body.dailyHours);
      employmentRate = parseNumber(body.employmentRate);
      notes = body.notes ?? null;
    } else {
      const formData = await req.formData();

      jobCategoryId = String(formData.get("jobCategoryId") ?? "");
      contractType = String(formData.get("contractType") ?? "");
      startDate = String(formData.get("startDate") ?? "");
      endDate = formData.get("endDate")?.toString() || null;
      seniorityDate = formData.get("seniorityDate")?.toString() || null;

      weeklyHours = parseNumber(
        formData.get("weeklyHours")?.toString() ?? null,
      );
      dailyHours = parseNumber(
        formData.get("dailyHours")?.toString() ?? null,
      );
      employmentRate = parseNumber(
        formData.get("employmentRate")?.toString() ?? null,
      );

      notes = formData.get("notes")?.toString() || null;
    }

    const contract = await employeeContractService.create({
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

    if (contentType.includes("application/json")) {
      return NextResponse.json(contract, { status: 201 });
    }

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