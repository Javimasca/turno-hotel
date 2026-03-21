import { prisma } from '@/lib/prisma'

type ListDepartmentJobCategoriesParams = {
  departmentId?: string
  workAreaId?: string
  quadrantGroupId?: string
  jobCategoryId?: string
  isActive?: boolean
}

type CreateDepartmentJobCategoryInput = {
  departmentId: string
  jobCategoryId: string
  workAreaId: string
  quadrantGroupId: string
  displayOrder?: number
  isActive?: boolean
}

type UpdateDepartmentJobCategoryInput = {
  departmentId?: string
  jobCategoryId?: string
  workAreaId?: string
  quadrantGroupId?: string
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
  workArea: {
    select: {
      id: true,
      departmentId: true,
      code: true,
      name: true,
      isActive: true,
    },
  },
  quadrantGroup: {
    select: {
      id: true,
      workAreaId: true,
      code: true,
      name: true,
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
      ...(params.workAreaId ? { workAreaId: params.workAreaId } : {}),
      ...(params.quadrantGroupId
        ? { quadrantGroupId: params.quadrantGroupId }
        : {}),
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
  workAreaId: string
  quadrantGroupId: string
}) {
  return prisma.departmentJobCategory.findFirst({
    where: {
      departmentId: params.departmentId,
      jobCategoryId: params.jobCategoryId,
      workAreaId: params.workAreaId,
      quadrantGroupId: params.quadrantGroupId,
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
      workAreaId: data.workAreaId,
      quadrantGroupId: data.quadrantGroupId,
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
      ...(data.workAreaId !== undefined ? { workAreaId: data.workAreaId } : {}),
      ...(data.quadrantGroupId !== undefined
        ? { quadrantGroupId: data.quadrantGroupId }
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