import { NextRequest, NextResponse } from 'next/server'

import {
  DepartmentJobCategoryAlreadyExistsError,
  DepartmentJobCategoryNotFoundError,
  DepartmentNotFoundForAssignmentError,
  JobCategoryNotFoundForAssignmentError,
  deleteDepartmentJobCategoryRecord,
  getDepartmentJobCategoryRecordById,
  updateDepartmentJobCategoryRecord,
} from '@/lib/department-job-categories/department-job-category.service'

function parseInteger(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) return value

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isInteger(parsed)) return parsed
  }

  return undefined
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    const record = await getDepartmentJobCategoryRecordById(id)
    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof DepartmentJobCategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Error al obtener la asignación.' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const contentType = request.headers.get('content-type') || ''

    let departmentId: string | undefined
    let jobCategoryId: string | undefined
    let displayOrder: number | undefined
    let isActive: boolean | undefined

    if (contentType.includes('application/json')) {
      const body = await request.json()

      departmentId =
        typeof body.departmentId === 'string' ? body.departmentId : undefined

      jobCategoryId =
        typeof body.jobCategoryId === 'string'
          ? body.jobCategoryId
          : undefined

      displayOrder = parseInteger(body.displayOrder)
      isActive =
        typeof body.isActive === 'boolean' ? body.isActive : undefined
    } else {
      const formData = await request.formData()

      departmentId = formData.get('departmentId')?.toString() ?? undefined
      jobCategoryId = formData.get('jobCategoryId')?.toString() ?? undefined

      displayOrder = parseInteger(
        formData.get('displayOrder')?.toString() ?? undefined,
      )

      const isActiveValue = formData.get('isActive')?.toString() ?? null
      if (isActiveValue === 'true') isActive = true
      if (isActiveValue === 'false') isActive = false
    }

    const updated = await updateDepartmentJobCategoryRecord(id, {
      ...(departmentId !== undefined ? { departmentId } : {}),
      ...(jobCategoryId !== undefined ? { jobCategoryId } : {}),
      ...(displayOrder !== undefined ? { displayOrder } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    })

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

    const message =
      error instanceof Error
        ? error.message
        : 'Error al actualizar la asignación.'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    await deleteDepartmentJobCategoryRecord(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof DepartmentJobCategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Error al eliminar la asignación.' },
      { status: 400 },
    )
  }
}