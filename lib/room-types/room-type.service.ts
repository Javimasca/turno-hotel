import { prisma } from "@/lib/prisma";

type SaveRoomTypeInput = {
  workplaceId: string;
  code: string;
  name: string;
  stayoverCleaningMinutes: number;
  departureCleaningMinutes: number;
  displayOrder?: number;
  isActive?: boolean;
};

export const roomTypeService = {
  async getAll(workplaceId?: string | null) {
    return prisma.roomType.findMany({
      where: {
        ...(workplaceId ? { workplaceId } : {}),
      },
      include: {
        workplace: true,
      },
      orderBy: [
        { workplace: { name: "asc" } },
        { displayOrder: "asc" },
        { name: "asc" },
      ],
    });
  },

  async create(input: SaveRoomTypeInput) {
    const data = normalizeInput(input);
    await validateWorkplace(data.workplaceId);

    return prisma.roomType.create({ data });
  },

  async update(id: string, input: Partial<SaveRoomTypeInput>) {
    const existing = await prisma.roomType.findUnique({ where: { id } });

    if (!existing) {
      throw new Error("El tipo de habitacion no existe.");
    }

    const next = normalizeInput({
      workplaceId: input.workplaceId ?? existing.workplaceId,
      code: input.code ?? existing.code,
      name: input.name ?? existing.name,
      stayoverCleaningMinutes:
        input.stayoverCleaningMinutes ?? existing.stayoverCleaningMinutes,
      departureCleaningMinutes:
        input.departureCleaningMinutes ?? existing.departureCleaningMinutes,
      displayOrder: input.displayOrder ?? existing.displayOrder,
      isActive: input.isActive ?? existing.isActive,
    });

    await validateWorkplace(next.workplaceId);

    return prisma.roomType.update({
      where: { id },
      data: next,
    });
  },

  async remove(id: string) {
    return prisma.roomType.delete({ where: { id } });
  },
};

function normalizeInput(input: SaveRoomTypeInput) {
  const workplaceId = input.workplaceId?.trim();
  const code = input.code?.trim().toUpperCase();
  const name = input.name?.trim();
  const stayoverCleaningMinutes = Number(input.stayoverCleaningMinutes);
  const departureCleaningMinutes = Number(input.departureCleaningMinutes);
  const displayOrder = Number(input.displayOrder ?? 0);

  if (!workplaceId) throw new Error("El centro es obligatorio.");
  if (!code) throw new Error("El codigo es obligatorio.");
  if (!name) throw new Error("El nombre es obligatorio.");
  validateMinutes(stayoverCleaningMinutes, "cliente");
  validateMinutes(departureCleaningMinutes, "salida");

  return {
    workplaceId,
    code,
    name,
    stayoverCleaningMinutes,
    departureCleaningMinutes,
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
    isActive: input.isActive ?? true,
  };
}

function validateMinutes(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0 || value > 600) {
    throw new Error(`Los minutos de ${label} no son validos.`);
  }
}

async function validateWorkplace(workplaceId: string) {
  const workplace = await prisma.workplace.findUnique({
    where: { id: workplaceId },
    select: { id: true, isActive: true },
  });

  if (!workplace) throw new Error("El centro no existe.");
  if (!workplace.isActive) throw new Error("No se puede usar un centro inactivo.");
}
