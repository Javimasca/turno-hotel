import { NextResponse } from 'next/server'

import {
  WorkplaceCodeAlreadyExistsError,
  WorkplaceNotFoundError,
  deleteWorkplaceRecord,
  getWorkplaceById,
  updateWorkplaceRecord,
} from '@/lib/workplaces/workplace.service'

type Params = {
  params: {
    id: string
  }
}

type UpdateWorkplaceBody = {
  code?: unknown
  name?: unknown
  description?: unknown
  isActive?: unknown
}

function normalizeString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

export async function GET(_: Request, { params }: Params) {
  try {
    const workplace = await getWorkplaceById(params.id)

    return NextResponse.json({
      data: workplace,
    })
  } catch (error) {
    if (error instanceof WorkplaceNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      )
    }

    console.error('Error obteniendo lugar de trabajo:', error)

    return NextResponse.json(
      { error: 'No se pudo obtener el lugar de trabajo.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  let body: UpdateWorkplaceBody

  try {
    body = (await request.json()) as UpdateWorkplaceBody
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
    const workplace = await updateWorkplaceRecord(params.id, {
      ...(code !== undefined ? { code } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(body.description !== undefined
        ? { description: normalizeString(body.description) }
        : {}),
      ...(typeof body.isActive === 'boolean'
        ? { isActive: body.isActive }
        : {}),
    })

    return NextResponse.json({
      data: workplace,
    })
  } catch (error) {
    if (error instanceof WorkplaceNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      )
    }

    if (error instanceof WorkplaceCodeAlreadyExistsError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 },
      )
    }

    console.error('Error actualizando lugar de trabajo:', error)

    return NextResponse.json(
      { error: 'No se pudo actualizar el lugar de trabajo.' },
      { status: 500 },
    )
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await deleteWorkplaceRecord(params.id)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    if (error instanceof WorkplaceNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      )
    }

    console.error('Error eliminando lugar de trabajo:', error)

    return NextResponse.json(
      { error: 'No se pudo eliminar el lugar de trabajo.' },
      { status: 500 },
    )
  }
}