import { NextRequest, NextResponse } from 'next/server'

import {
  DepartmentJobCategoryAlreadyExistsError,
  DepartmentNotFoundForAssignmentError,
  JobCategoryNotFoundForAssignmentError,
  createDepartmentJobCategoryRecord,
  listDepartmentJobCategoryRecords,
} from '@/lib/department-job-categories/department-job-category.service'

function parseBoolean(value: string | null) {
  if (value === null) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function parseInteger(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) return value

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isInteger(parsed)) return parsed
  }

  return undefined
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const departmentId = searchParams.get('departmentId') || undefined
    const jobCategoryId = searchParams.get('jobCategoryId') || undefined
    const isActive = parseBoolean(searchParams.get('isActive'))

    const records = await listDepartmentJobCategoryRecords({
      ...(departmentId ? { departmentId } : {}),
      ...(jobCategoryId ? { jobCategoryId } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    })

    return NextResponse.json(records)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error al obtener las asignaciones.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let departmentId = ''
    let jobCategoryId = ''
    let displayOrder: number | undefined = undefined
    let isActive: boolean | undefined = undefined

    if (contentType.includes('application/json')) {
      const body = await request.json()

      departmentId =
        typeof body.departmentId === 'string' ? body.departmentId : ''
      jobCategoryId =
        typeof body.jobCategoryId === 'string' ? body.jobCategoryId : ''

      displayOrder = parseInteger(body.displayOrder)
      isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined
    } else {
      const formData = await request.formData()

      departmentId = formData.get('departmentId')?.toString() ?? ''
      jobCategoryId = formData.get('jobCategoryId')?.toString() ?? ''

      displayOrder = parseInteger(
        formData.get('displayOrder')?.toString() ?? undefined,
      )

      const isActiveValue = formData.get('isActive')?.toString() ?? null
      isActive = parseBoolean(isActiveValue)
    }

    const created = await createDepartmentJobCategoryRecord({
      departmentId,
      jobCategoryId,
      displayOrder,
      isActive,
    })

    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(
        new URL('/maestros/asignaciones-categorias', request.url),
      )
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
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
        : 'Error al crear la asignación.'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}