import { NextResponse } from 'next/server'

import {
  WorkplaceCodeAlreadyExistsError,
  createWorkplaceRecord,
  listWorkplaces,
} from '@/lib/workplaces/workplace.service'

type CreateWorkplaceBody = {
  code?: unknown
  name?: unknown
  description?: unknown
  isActive?: unknown
}

function normalizeString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : null
}

function parseIsActive(value: string | null) {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return undefined
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const search = searchParams.get('search') ?? undefined
  const isActive = parseIsActive(searchParams.get('isActive'))

  const workplaces = await listWorkplaces({
    search,
    isActive,
  })

  return NextResponse.json(workplaces)
}

export async function POST(request: Request) {
  let body: CreateWorkplaceBody

  try {
    body = (await request.json()) as CreateWorkplaceBody
  } catch {
    return NextResponse.json(
      {
        error: 'El cuerpo de la petición no es un JSON válido.',
      },
      { status: 400 },
    )
  }

  const code = normalizeString(body.code)
  const name = normalizeString(body.name)

  if (!code) {
    return NextResponse.json(
      {
        error: 'El código es obligatorio.',
      },
      { status: 400 },
    )
  }

  if (!name) {
    return NextResponse.json(
      {
        error: 'El nombre es obligatorio.',
      },
      { status: 400 },
    )
  }

  try {
    const workplace = await createWorkplaceRecord({
      code,
      name,
      description:
        body.description === undefined
          ? undefined
          : normalizeString(body.description),
      isActive:
        typeof body.isActive === 'boolean' ? body.isActive : undefined,
    })

    return NextResponse.json(workplace, { status: 201 })
  } catch (error) {
    if (error instanceof WorkplaceCodeAlreadyExistsError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      )
    }

    console.error('Error creando lugar de trabajo:', error)

    return NextResponse.json(
      {
        error: 'No se pudo crear el lugar de trabajo.',
      },
      { status: 500 },
    )
  }
}