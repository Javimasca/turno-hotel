import { getDepartmentById } from '@/lib/departments/department.repository'
import {
  createDepartmentJobCategory,
  deleteDepartmentJobCategory,
  getDepartmentJobCategoryById,
  getDepartmentJobCategoryByUniqueContext,
  listDepartmentJobCategories,
  updateDepartmentJobCategory,
} from '@/lib/department-job-categories/department-job-category.repository'
import { getJobCategoryById } from '@/lib/job-categories/job-category.repository'
import { getQuadrantGroupById } from '@/lib/quadrant-groups/quadrant-group.repository'
import { workAreaRepository } from '@/lib/work-areas/work-area.repository'

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

export class DepartmentJobCategoryNotFoundError extends Error {
  constructor() {
    super('La asignación de categoría profesional no existe.')
    this.name = 'DepartmentJobCategoryNotFoundError'
  }
}

export class DepartmentJobCategoryAlreadyExistsError extends Error {
  constructor() {
    super(
      'Ya existe una asignación para ese departamento, zona, grupo y categoría profesional.',
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

export class WorkAreaNotFoundForAssignmentError extends Error {
  constructor() {
    super('La zona de trabajo indicada no existe.')
    this.name = 'WorkAreaNotFoundForAssignmentError'
  }
}

export class QuadrantGroupNotFoundForAssignmentError extends Error {
  constructor() {
    super('El grupo de cuadrante indicado no existe.')
    this.name = 'QuadrantGroupNotFoundForAssignmentError'
  }
}

export class WorkAreaDoesNotBelongToDepartmentError extends Error {
  constructor() {
    super('La zona de trabajo indicada no pertenece al departamento seleccionado.')
    this.name = 'WorkAreaDoesNotBelongToDepartmentError'
  }
}

export class QuadrantGroupDoesNotBelongToWorkAreaError extends Error {
  constructor() {
    super('El grupo de cuadrante indicado no pertenece a la zona de trabajo seleccionada.')
    this.name = 'QuadrantGroupDoesNotBelongToWorkAreaError'
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
  workAreaId: string
  quadrantGroupId: string
}) {
  const [department, jobCategory, workArea, quadrantGroup] = await Promise.all([
    getDepartmentById(params.departmentId),
    getJobCategoryById(params.jobCategoryId),
    workAreaRepository.findById(params.workAreaId),
    getQuadrantGroupById(params.quadrantGroupId),
  ])

  if (!department) {
    throw new DepartmentNotFoundForAssignmentError()
  }

  if (!jobCategory) {
    throw new JobCategoryNotFoundForAssignmentError()
  }

  if (!workArea) {
    throw new WorkAreaNotFoundForAssignmentError()
  }

  if (!quadrantGroup) {
    throw new QuadrantGroupNotFoundForAssignmentError()
  }

  if (workArea.departmentId !== department.id) {
    throw new WorkAreaDoesNotBelongToDepartmentError()
  }

  if (quadrantGroup.workAreaId !== workArea.id) {
    throw new QuadrantGroupDoesNotBelongToWorkAreaError()
  }

  return {
    department,
    jobCategory,
    workArea,
    quadrantGroup,
  }
}

async function ensureUniqueContext(
  params: {
    departmentId: string
    jobCategoryId: string
    workAreaId: string
    quadrantGroupId: string
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
  const workAreaId = normalizeRequiredString(input.workAreaId, 'zona de trabajo')
  const quadrantGroupId = normalizeRequiredString(
    input.quadrantGroupId,
    'grupo de cuadrante',
  )
  const displayOrder = normalizeDisplayOrder(input.displayOrder)

  await validateContext({
    departmentId,
    jobCategoryId,
    workAreaId,
    quadrantGroupId,
  })

  await ensureUniqueContext({
    departmentId,
    jobCategoryId,
    workAreaId,
    quadrantGroupId,
  })

  return createDepartmentJobCategory({
    departmentId,
    jobCategoryId,
    workAreaId,
    quadrantGroupId,
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

  const workAreaId =
    input.workAreaId !== undefined
      ? normalizeRequiredString(input.workAreaId, 'zona de trabajo')
      : existing.workAreaId

  const quadrantGroupId =
    input.quadrantGroupId !== undefined
      ? normalizeRequiredString(input.quadrantGroupId, 'grupo de cuadrante')
      : existing.quadrantGroupId

  const displayOrder =
    input.displayOrder !== undefined
      ? normalizeDisplayOrder(input.displayOrder)
      : undefined

  await validateContext({
    departmentId,
    jobCategoryId,
    workAreaId,
    quadrantGroupId,
  })

  await ensureUniqueContext(
    {
      departmentId,
      jobCategoryId,
      workAreaId,
      quadrantGroupId,
    },
    id,
  )

  return updateDepartmentJobCategory(id, {
    ...(input.departmentId !== undefined ? { departmentId } : {}),
    ...(input.jobCategoryId !== undefined ? { jobCategoryId } : {}),
    ...(input.workAreaId !== undefined ? { workAreaId } : {}),
    ...(input.quadrantGroupId !== undefined ? { quadrantGroupId } : {}),
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