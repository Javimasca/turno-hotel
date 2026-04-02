import { departmentRepository } from '@/lib/departments/department.repository'
import {
  createDepartmentJobCategory,
  deleteDepartmentJobCategory,
  getDepartmentJobCategoryById,
  getDepartmentJobCategoryByUniqueContext,
  listDepartmentJobCategories,
  updateDepartmentJobCategory,
} from '@/lib/department-job-categories/department-job-category.repository'
import { getJobCategoryById } from '@/lib/job-categories/job-category.repository'

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

export class DepartmentJobCategoryNotFoundError extends Error {
  constructor() {
    super('La asignación de categoría profesional no existe.')
    this.name = 'DepartmentJobCategoryNotFoundError'
  }
}

export class DepartmentJobCategoryAlreadyExistsError extends Error {
  constructor() {
    super(
      'Ya existe una asignación para ese departamento y categoría profesional.',
    )
    this.name = 'DepartmentJobCategoryAlreadyExistsError'
  }
}

export class DepartmentNotFoundForAssignmentError extends Error {
  constructor() {
    super('El departamento indicado no existe.')
    this.name = 'DepartmentNotFoundForAssignmentError'
  }
}

export class JobCategoryNotFoundForAssignmentError extends Error {
  constructor() {
    super('La categoría profesional indicada no existe.')
    this.name = 'JobCategoryNotFoundForAssignmentError'
  }
}

function normalizeRequiredString(value: string, fieldName: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`El campo ${fieldName} es obligatorio.`)
  }

  return normalized
}

function normalizeDisplayOrder(value?: number) {
  if (value === undefined) {
    return 0
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error('El orden debe ser un número entero igual o mayor que 0.')
  }

  return value
}

async function validateContext(params: {
  departmentId: string
  jobCategoryId: string
}) {
  const [department, jobCategory] = await Promise.all([
    departmentRepository.findById(params.departmentId),
    getJobCategoryById(params.jobCategoryId),
  ])

  if (!department) {
    throw new DepartmentNotFoundForAssignmentError()
  }

  if (!jobCategory) {
    throw new JobCategoryNotFoundForAssignmentError()
  }

  return {
    department,
    jobCategory,
  }
}

async function ensureUniqueContext(
  params: {
    departmentId: string
    jobCategoryId: string
  },
  currentId?: string,
) {
  const existing = await getDepartmentJobCategoryByUniqueContext(params)

  if (existing && existing.id !== currentId) {
    throw new DepartmentJobCategoryAlreadyExistsError()
  }
}

export async function listDepartmentJobCategoryRecords(
  params: ListDepartmentJobCategoriesParams = {},
) {
  return listDepartmentJobCategories(params)
}

export async function getDepartmentJobCategoryRecordById(id: string) {
  const record = await getDepartmentJobCategoryById(id)

  if (!record) {
    throw new DepartmentJobCategoryNotFoundError()
  }

  return record
}

export async function createDepartmentJobCategoryRecord(
  input: CreateDepartmentJobCategoryInput,
) {
  const departmentId = normalizeRequiredString(input.departmentId, 'departamento')
  const jobCategoryId = normalizeRequiredString(
    input.jobCategoryId,
    'categoría profesional',
  )
  const displayOrder = normalizeDisplayOrder(input.displayOrder)

  await validateContext({
    departmentId,
    jobCategoryId,
  })

  await ensureUniqueContext({
    departmentId,
    jobCategoryId,
  })

  return createDepartmentJobCategory({
    departmentId,
    jobCategoryId,
    displayOrder,
    isActive: input.isActive ?? true,
  })
}

export async function updateDepartmentJobCategoryRecord(
  id: string,
  input: UpdateDepartmentJobCategoryInput,
) {
  const existing = await getDepartmentJobCategoryById(id)

  if (!existing) {
    throw new DepartmentJobCategoryNotFoundError()
  }

  const departmentId =
    input.departmentId !== undefined
      ? normalizeRequiredString(input.departmentId, 'departamento')
      : existing.departmentId

  const jobCategoryId =
    input.jobCategoryId !== undefined
      ? normalizeRequiredString(input.jobCategoryId, 'categoría profesional')
      : existing.jobCategoryId

  const displayOrder =
    input.displayOrder !== undefined
      ? normalizeDisplayOrder(input.displayOrder)
      : undefined

  await validateContext({
    departmentId,
    jobCategoryId,
  })

  await ensureUniqueContext(
    {
      departmentId,
      jobCategoryId,
    },
    id,
  )

  return updateDepartmentJobCategory(id, {
    ...(input.departmentId !== undefined ? { departmentId } : {}),
    ...(input.jobCategoryId !== undefined ? { jobCategoryId } : {}),
    ...(displayOrder !== undefined ? { displayOrder } : {}),
    ...(typeof input.isActive === 'boolean'
      ? { isActive: input.isActive }
      : {}),
  })
}

export async function deleteDepartmentJobCategoryRecord(id: string) {
  const existing = await getDepartmentJobCategoryById(id)

  if (!existing) {
    throw new DepartmentJobCategoryNotFoundError()
  }

  return deleteDepartmentJobCategory(id)
}