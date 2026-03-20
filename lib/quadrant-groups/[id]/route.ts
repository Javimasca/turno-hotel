import { NextResponse } from 'next/server'

import {
  QuadrantGroupCodeAlreadyExistsError,
  QuadrantGroupNotFoundError,
  deleteQuadrantGroupRecord,
  getQuadrantGroupById,
  updateQuadrantGroupRecord,
} from '@/lib/quadrant-groups/quadrant-group.service'

type Params = {
  params: {
    id: string
  }
}

type UpdateQuadrantGroupBody = {
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

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
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

export async function GET(_: Request, { params }: Params) {
  try {
    const quadrantGroup = await getQuadrantGroupById(params.id)

    return NextResponse.json({
      data: quadrantGroup,
    })
  } catch (error) {
    if (error instanceof QuadrantGroupNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      )
    }

    console.error('Error obteniendo grupo de cuadrante:', error)

    return NextResponse.json(
      { error: 'No se pudo obtener el grupo de cuadrante.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  let body: UpdateQuadrantGroupBody

  try {
    body = (await request.json()) as UpdateQuadrantGroupBody
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo de la petición no es un JSON válido.' },
      { status: 400 },
    )
  }

  const code =
    body.code !== undefined ? normalizeString(body.code) : undefined

  const name =
    body.name !== undefined ? normalizeString(body.name) : undefined

  if (body.code !== undefined && !code) {
    return NextResponse.json(
      { error: 'El código no puede estar vacío.' },
      { status: 400 },
    )
  }

  if (body.name !== undefined && !name) {
    return NextResponse.json(
      { error: 'El nombre no puede estar vacío.' },
      { status: 400 },
    )
  }

  try {
    const quadrantGroup = await updateQuadrantGroupRecord(params.id, {
      ...(code !== undefined ? { code } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(body.description !== undefined
        ? { description: normalizeString(body.description) }
        : {}),
      ...(body.displayOrder !== undefined
        ? { displayOrder: parseDisplayOrder(body.displayOrder) }
        : {}),
      ...(typeof body.isActive === 'boolean'
        ? { isActive: body.isActive }
        : {}),
    })

    return NextResponse.json({
      data: quadrantGroup,
    })
  } catch (error) {
    if (error instanceof QuadrantGroupNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      )
    }

    if (error instanceof QuadrantGroupCodeAlreadyExistsError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 },
      )
    }

    console.error('Error actualizando grupo de cuadrante:', error)

    return NextResponse.json(
      { error: 'No se pudo actualizar el grupo de cuadrante.' },
      { status: 500 },
    )
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await deleteQuadrantGroupRecord(params.id)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    if (error instanceof QuadrantGroupNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      )
    }

    console.error('Error eliminando grupo de cuadrante:', error)

    return NextResponse.json(
      { error: 'No se pudo eliminar el grupo de cuadrante.' },
      { status: 500 },
    )
  }
}