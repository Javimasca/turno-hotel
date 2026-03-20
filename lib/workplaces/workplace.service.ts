import {
  createWorkplace,
  deleteWorkplace,
  findManyWorkplaces,
  findWorkplaceByCode,
  findWorkplaceById,
  updateWorkplace,
} from '@/lib/workplaces/workplace.repository'

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

export class WorkplaceNotFoundError extends Error {
  constructor() {
    super('Lugar de trabajo no encontrado.')
    this.name = 'WorkplaceNotFoundError'
  }
}

export class WorkplaceCodeAlreadyExistsError extends Error {
  constructor() {
    super('Ya existe un lugar de trabajo con ese código.')
    this.name = 'WorkplaceCodeAlreadyExistsError'
  }
}

function normalizeRequiredString(value: string) {
  return value.trim()
}

function normalizeOptionalString(value?: string | null) {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

export async function listWorkplaces(params: ListWorkplacesParams = {}) {
  const search = params.search?.trim()

  return findManyWorkplaces({
    search: search && search.length > 0 ? search : undefined,
    isActive: params.isActive,
  })
}

export async function getWorkplaceById(id: string) {
  const workplace = await findWorkplaceById(id)

  if (!workplace) {
    throw new WorkplaceNotFoundError()
  }

  return workplace
}

export async function createWorkplaceRecord(input: CreateWorkplaceInput) {
  const code = normalizeRequiredString(input.code)
  const name = normalizeRequiredString(input.name)
  const description = normalizeOptionalString(input.description)
  const isActive = input.isActive ?? true

  const existingWorkplace = await findWorkplaceByCode(code)

  if (existingWorkplace) {
    throw new WorkplaceCodeAlreadyExistsError()
  }

  return createWorkplace({
    code,
    name,
    description,
    isActive,
  })
}

export async function updateWorkplaceRecord(
  id: string,
  input: UpdateWorkplaceInput,
) {
  const currentWorkplace = await findWorkplaceById(id)

  if (!currentWorkplace) {
    throw new WorkplaceNotFoundError()
  }

  const nextCode =
    input.code !== undefined
      ? normalizeRequiredString(input.code)
      : undefined

  const nextName =
    input.name !== undefined
      ? normalizeRequiredString(input.name)
      : undefined

  const nextDescription = normalizeOptionalString(input.description)

  if (nextCode && nextCode !== currentWorkplace.code) {
    const existingWorkplace = await findWorkplaceByCode(nextCode)

    if (existingWorkplace && existingWorkplace.id !== id) {
      throw new WorkplaceCodeAlreadyExistsError()
    }
  }

  return updateWorkplace(id, {
    ...(nextCode !== undefined ? { code: nextCode } : {}),
    ...(nextName !== undefined ? { name: nextName } : {}),
    ...(input.description !== undefined
      ? { description: nextDescription }
      : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  })
}

export async function deleteWorkplaceRecord(id: string) {
  const currentWorkplace = await findWorkplaceById(id)

  if (!currentWorkplace) {
    throw new WorkplaceNotFoundError()
  }

  return deleteWorkplace(id)
}