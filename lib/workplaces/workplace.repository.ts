import { prisma } from '@/lib/prisma'

type ListWorkplacesParams = {
  search?: string
  isActive?: boolean
}

type CreateWorkplaceInput = {
  code: string
  name: string
  description?: string | null
  isActive?: boolean
}

type UpdateWorkplaceInput = {
  code?: string
  name?: string
  description?: string | null
  isActive?: boolean
}

export async function findManyWorkplaces(params: ListWorkplacesParams = {}) {
  const { search, isActive } = params

  return prisma.workplace.findMany({
    where: {
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              {
                code: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ name: 'asc' }],
  })
}

export async function findWorkplaceById(id: string) {
  return prisma.workplace.findUnique({
    where: { id },
  })
}

export async function findWorkplaceByCode(code: string) {
  return prisma.workplace.findUnique({
    where: { code },
  })
}

export async function createWorkplace(data: CreateWorkplaceInput) {
  return prisma.workplace.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      isActive: data.isActive ?? true,
    },
  })
}

export async function updateWorkplace(
  id: string,
  data: UpdateWorkplaceInput,
) {
  return prisma.workplace.update({
    where: { id },
    data: {
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  })
}

export async function deleteWorkplace(id: string) {
  return prisma.workplace.delete({
    where: { id },
  })
}