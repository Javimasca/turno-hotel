import { NextRequest, NextResponse } from 'next/server'

import {
  DepartmentJobCategoryAlreadyExistsError,
  DepartmentJobCategoryNotFoundError,
  DepartmentNotFoundForAssignmentError,
  JobCategoryNotFoundForAssignmentError,
  QuadrantGroupDoesNotBelongToWorkAreaError,
  QuadrantGroupNotFoundForAssignmentError,
  WorkAreaDoesNotBelongToDepartmentError,
  WorkAreaNotFoundForAssignmentError,
  deleteDepartmentJobCategoryRecord,
  getDepartmentJobCategoryRecordById,
  updateDepartmentJobCategoryRecord,
} from '@/lib/department-job-categories/department-job-category.service'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

async function getRequestBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return request.json()
  }

  const formData = await request.formData()

  return {
    _method: formData.get('_method'),
    departmentId: formData.get('departmentId'),
    jobCategoryId: formData.get('jobCategoryId'),
    workAreaId: formData.get('workAreaId'),
    quadrantGroupId: formData.get('quadrantGroupId'),
    displayOrder: formData.get('displayOrder'),
    isActive:
      formData.get('isActive') === null
        ? false
        : formData.get('isActive') === 'true',
  }
}

function parseInteger(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    if (Number.isInteger(parsed)) {
      return parsed
    }
  }

  return undefined
}

function buildUpdateInput(body: {
  departmentId?: FormDataEntryValue | null
  jobCategoryId?: FormDataEntryValue | null
  workAreaId?: FormDataEntryValue | null
  quadrantGroupId?: FormDataEntryValue | null
  displayOrder?: FormDataEntryValue | null
  isActive?: boolean
}) {
  return {
    ...(typeof body.departmentId === 'string'
      ? { departmentId: body.departmentId.trim() }
      : {}),
    ...(typeof body.jobCategoryId === 'string'
      ? { jobCategoryId: body.jobCategoryId.trim() }
      : {}),
    ...(typeof body.workAreaId === 'string'
      ? { workAreaId: body.workAreaId.trim() }
      : {}),
    ...(typeof body.quadrantGroupId === 'string'
      ? { quadrantGroupId: body.quadrantGroupId.trim() }
      : {}),
    ...(body.displayOrder !== undefined
      ? { displayOrder: parseInteger(body.displayOrder) }
      : {}),
    ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const record = await getDepartmentJobCategoryRecordById(id)

    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof DepartmentJobCategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    const message =
      error instanceof Error ? error.message : 'Asignación no encontrada.'

    return NextResponse.json({ error: message }, { status: 404 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await getRequestBody(request)

    const updated = await updateDepartmentJobCategoryRecord(
      id,
      buildUpdateInput(body),
    )

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof DepartmentJobCategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof DepartmentJobCategoryAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    if (error instanceof DepartmentNotFoundForAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof JobCategoryNotFoundForAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof WorkAreaNotFoundForAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof QuadrantGroupNotFoundForAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof WorkAreaDoesNotBelongToDepartmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof QuadrantGroupDoesNotBelongToWorkAreaError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Error al actualizar la asignación.'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    await deleteDepartmentJobCategoryRecord(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof DepartmentJobCategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    const message =
      error instanceof Error ? error.message : 'Error al eliminar la asignación.'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await getRequestBody(request)
    const method =
      typeof body._method === 'string' ? body._method.toUpperCase() : 'POST'

    if (method === 'PATCH') {
      const updated = await updateDepartmentJobCategoryRecord(
        id,
        buildUpdateInput(body),
      )

      return NextResponse.json(updated)
    }

    if (method === 'DELETE') {
      await deleteDepartmentJobCategoryRecord(id)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Método no soportado.' },
      { status: 405 },
    )
  } catch (error) {
    if (error instanceof DepartmentJobCategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof DepartmentJobCategoryAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    if (error instanceof DepartmentNotFoundForAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof JobCategoryNotFoundForAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof WorkAreaNotFoundForAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof QuadrantGroupNotFoundForAssignmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof WorkAreaDoesNotBelongToDepartmentError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof QuadrantGroupDoesNotBelongToWorkAreaError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const message =
      error instanceof Error ? error.message : 'Error al procesar la solicitud.'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}