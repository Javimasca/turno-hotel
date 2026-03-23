import { NextResponse } from "next/server";
import { employeeContractService } from "@/lib/employee-contracts/employee-contract.service";

type Params = {
  params: Promise<{
    id: string;
    contractId: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const { contractId } = await params;

  const contrato = await employeeContractService.getById(contractId);

  if (!contrato) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(contrato);
}

export async function PUT(req: Request, { params }: Params) {
  const { contractId } = await params;
  const body = await req.json();

  const updated = await employeeContractService.update(contractId, body);

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Params) {
  const { contractId } = await params;

  await employeeContractService.delete(contractId);

  return NextResponse.json({ ok: true });
}