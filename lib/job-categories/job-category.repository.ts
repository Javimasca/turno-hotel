import { prisma } from '@/lib/prisma'

type ListJobCategoriesParams = {
  isActive?: boolean
}

type CreateJobCategoryInput = {
  code: string
  name: string
  shortName?: string | null
  description?: string | null
  displayOrder?: number
  textColor?: string | null
  isActive?: boolean
}

type UpdateJobCategoryInput = {
  code?: string
  name?: string
  shortName?: string | null
  description?: string | null
  displayOrder?: number
  textColor?: string | null
  isActive?: boolean
}

export async function listJobCategories(params: ListJobCategoriesParams = {}) {
  return prisma.jobCategory.findMany({
    where: {
      ...(typeof params.isActive === 'boolean'
        ? { isActive: params.isActive }
        : {}),
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  })
}

export async function getJobCategoryById(id: string) {
  return prisma.jobCategory.findUnique({
    where: { id },
  })
}

export async function getJobCategoryByCode(code: string) {
  return prisma.jobCategory.findUnique({
    where: { code },
  })
}

export async function getJobCategoryByName(name: string) {
  return prisma.jobCategory.findUnique({
    where: { name },
  })
}

export async function createJobCategory(data: CreateJobCategoryInput) {
  return prisma.jobCategory.create({
    data: {
      code: data.code,
      name: data.name,
      shortName: data.shortName ?? null,
      description: data.description ?? null,
      displayOrder: data.displayOrder ?? 0,
      textColor: data.textColor ?? null,
      isActive: data.isActive ?? true,
    },
  })
}

export async function updateJobCategory(
  id: string,
  data: UpdateJobCategoryInput,
) {
  return prisma.jobCategory.update({
    where: { id },
    data: {
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.shortName !== undefined ? { shortName: data.shortName } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.displayOrder !== undefined
        ? { displayOrder: data.displayOrder }
        : {}),
      ...(data.textColor !== undefined ? { textColor: data.textColor } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  })
}

export async function deleteJobCategory(id: string) {
  return prisma.jobCategory.delete({
    where: { id },
  })
}