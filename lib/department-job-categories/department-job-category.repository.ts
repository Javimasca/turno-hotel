import { prisma } from '@/lib/prisma'

type ListDepartmentJobCategoriesParams = {
  departmentId?: string
  jobCategoryId?: string
  isActive?: boolean
}

type CreateDepartmentJobCategoryInput = {
  departmentId: string
  jobCategoryId: string
  displayOrder?: number
  isActive?: boolean
}

type UpdateDepartmentJobCategoryInput = {
  departmentId?: string
  jobCategoryId?: string
  displayOrder?: number
  isActive?: boolean
}

const departmentJobCategoryInclude = {
  department: {
    select: {
      id: true,
      code: true,
      name: true,
      workplace: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  },
  jobCategory: {
    select: {
      id: true,
      code: true,
      name: true,
      shortName: true,
      isActive: true,
    },
  },
} as const

export async function listDepartmentJobCategories(
  params: ListDepartmentJobCategoriesParams = {},
) {
  return prisma.departmentJobCategory.findMany({
    where: {
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.jobCategoryId ? { jobCategoryId: params.jobCategoryId } : {}),
      ...(typeof params.isActive === 'boolean'
        ? { isActive: params.isActive }
        : {}),
    },
    include: departmentJobCategoryInclude,
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function getDepartmentJobCategoryById(id: string) {
  return prisma.departmentJobCategory.findUnique({
    where: { id },
    include: departmentJobCategoryInclude,
  })
}

export async function getDepartmentJobCategoryByUniqueContext(params: {
  departmentId: string
  jobCategoryId: string
}) {
  return prisma.departmentJobCategory.findFirst({
    where: {
      departmentId: params.departmentId,
      jobCategoryId: params.jobCategoryId,
    },
    include: departmentJobCategoryInclude,
  })
}

export async function createDepartmentJobCategory(
  data: CreateDepartmentJobCategoryInput,
) {
  return prisma.departmentJobCategory.create({
    data: {
      departmentId: data.departmentId,
      jobCategoryId: data.jobCategoryId,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    },
    include: departmentJobCategoryInclude,
  })
}

export async function updateDepartmentJobCategory(
  id: string,
  data: UpdateDepartmentJobCategoryInput,
) {
  return prisma.departmentJobCategory.update({
    where: { id },
    data: {
      ...(data.departmentId !== undefined
        ? { departmentId: data.departmentId }
        : {}),
      ...(data.jobCategoryId !== undefined
        ? { jobCategoryId: data.jobCategoryId }
        : {}),
      ...(data.displayOrder !== undefined
        ? { displayOrder: data.displayOrder }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: departmentJobCategoryInclude,
  })
}

export async function deleteDepartmentJobCategory(id: string) {
  return prisma.departmentJobCategory.delete({
    where: { id },
    include: departmentJobCategoryInclude,
  })
}