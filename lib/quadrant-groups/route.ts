import { NextResponse } from 'next/server'

import {
  QuadrantGroupCodeAlreadyExistsError,
  createQuadrantGroupRecord,
  listQuadrantGroups,
} from '@/lib/quadrant-groups/quadrant-group.service'

type CreateQuadrantGroupBody = {
  code?: unknown
  name?: unknown
  description?: unknown
  displayOrder?: unknown
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

function parseDisplayOrder(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsedValue = Number(value)

    if (Number.isFinite(parsedValue)) {
      return Math.trunc(parsedValue)
    }
  }

  return undefined
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const search = searchParams.get('search') ?? undefined
  const isActive = parseIsActive(searchParams.get('isActive'))

  const quadrantGroups = await listQuadrantGroups({
    search,
    isActive,
  })

  return NextResponse.json({
    data: quadrantGroups,
  })
}

export async function POST(request: Request) {
  let body: CreateQuadrantGroupBody

  try {
    body = (await request.json()) as CreateQuadrantGroupBody
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
    const quadrantGroup = await createQuadrantGroupRecord({
      code,
      name,
      description:
        body.description === undefined
          ? undefined
          : normalizeString(body.description),
      displayOrder: parseDisplayOrder(body.displayOrder),
      isActive:
        typeof body.isActive === 'boolean' ? body.isActive : undefined,
    })

    return NextResponse.json(
      {
        data: quadrantGroup,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof QuadrantGroupCodeAlreadyExistsError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      )
    }

    console.error('Error creando grupo de cuadrante:', error)

    return NextResponse.json(
      {
        error: 'No se pudo crear el grupo de cuadrante.',
      },
      { status: 500 },
    )
  }
}