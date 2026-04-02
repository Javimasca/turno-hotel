import { Prisma } from '@prisma/client'

import {
  createJobCategory,
  deleteJobCategory,
  getJobCategoryByCode,
  getJobCategoryById,
  getJobCategoryByName,
  listJobCategories,
  updateJobCategory,
} from '@/lib/job-categories/job-category.repository'

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

export class JobCategoryNotFoundError extends Error {
  constructor() {
    super('La categoría profesional no existe.')
    this.name = 'JobCategoryNotFoundError'
  }
}

export class JobCategoryCodeAlreadyExistsError extends Error {
  constructor() {
    super('Ya existe una categoría profesional con ese código.')
    this.name = 'JobCategoryCodeAlreadyExistsError'
  }
}

export class JobCategoryNameAlreadyExistsError extends Error {
  constructor() {
    super('Ya existe una categoría profesional con ese nombre.')
    this.name = 'JobCategoryNameAlreadyExistsError'
  }
}

export class JobCategoryInUseError extends Error {
  constructor() {
    super(
      'No se puede eliminar la categoría profesional porque está asignada a uno o más trabajadores.',
    )
    this.name = 'JobCategoryInUseError'
  }
}

function normalizeRequiredString(value: string, fieldName: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`El campo ${fieldName} es obligatorio.`)
  }

  return normalized
}

function normalizeOptionalString(value?: string | null) {
  if (typeof value !== 'string') {
    return value ?? null
  }

  const normalized = value.trim()

  return normalized === '' ? null : normalized
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

async function ensureCodeIsUnique(code: string, currentId?: string) {
  const existing = await getJobCategoryByCode(code)

  if (existing && existing.id !== currentId) {
    throw new JobCategoryCodeAlreadyExistsError()
  }
}

async function ensureNameIsUnique(name: string, currentId?: string) {
  const existing = await getJobCategoryByName(name)

  if (existing && existing.id !== currentId) {
    throw new JobCategoryNameAlreadyExistsError()
  }
}

export async function listJobCategoryRecords(
  params: ListJobCategoriesParams = {},
) {
  return listJobCategories(params)
}

export async function getJobCategoryRecordById(id: string) {
  const record = await getJobCategoryById(id)

  if (!record) {
    throw new JobCategoryNotFoundError()
  }

  return record
}

export async function createJobCategoryRecord(
  input: CreateJobCategoryInput,
) {
  const code = normalizeRequiredString(input.code, 'código')
  const name = normalizeRequiredString(input.name, 'nombre')
  const shortName = normalizeOptionalString(input.shortName)
  const description = normalizeOptionalString(input.description)
  const textColor = normalizeOptionalString(input.textColor)
  const displayOrder = normalizeDisplayOrder(input.displayOrder)

  await ensureCodeIsUnique(code)
  await ensureNameIsUnique(name)

  return createJobCategory({
    code,
    name,
    shortName,
    description,
    displayOrder,
    textColor,
    isActive: input.isActive ?? true,
  })
}

export async function updateJobCategoryRecord(
  id: string,
  input: UpdateJobCategoryInput,
) {
  const existing = await getJobCategoryById(id)

  if (!existing) {
    throw new JobCategoryNotFoundError()
  }

  const normalizedCode =
    input.code !== undefined
      ? normalizeRequiredString(input.code, 'código')
      : undefined

  const normalizedName =
    input.name !== undefined
      ? normalizeRequiredString(input.name, 'nombre')
      : undefined

  const normalizedShortName =
    input.shortName !== undefined
      ? normalizeOptionalString(input.shortName)
      : undefined

  const normalizedDescription =
    input.description !== undefined
      ? normalizeOptionalString(input.description)
      : undefined

  const normalizedTextColor =
    input.textColor !== undefined
      ? normalizeOptionalString(input.textColor)
      : undefined

  const normalizedDisplayOrder =
    input.displayOrder !== undefined
      ? normalizeDisplayOrder(input.displayOrder)
      : undefined

  if (normalizedCode !== undefined) {
    await ensureCodeIsUnique(normalizedCode, id)
  }

  if (normalizedName !== undefined) {
    await ensureNameIsUnique(normalizedName, id)
  }

  return updateJobCategory(id, {
    ...(normalizedCode !== undefined ? { code: normalizedCode } : {}),
    ...(normalizedName !== undefined ? { name: normalizedName } : {}),
    ...(normalizedShortName !== undefined
      ? { shortName: normalizedShortName }
      : {}),
    ...(normalizedDescription !== undefined
      ? { description: normalizedDescription }
      : {}),
    ...(normalizedDisplayOrder !== undefined
      ? { displayOrder: normalizedDisplayOrder }
      : {}),
    ...(normalizedTextColor !== undefined
      ? { textColor: normalizedTextColor }
      : {}),
    ...(typeof input.isActive === 'boolean'
      ? { isActive: input.isActive }
      : {}),
  })
}

export async function deleteJobCategoryRecord(id: string) {
  const existing = await getJobCategoryById(id)

  if (!existing) {
    throw new JobCategoryNotFoundError()
  }

  try {
    return await deleteJobCategory(id)
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new JobCategoryInUseError()
    }

    throw error
  }
}