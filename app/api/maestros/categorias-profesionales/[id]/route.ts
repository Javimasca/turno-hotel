import { NextRequest, NextResponse } from 'next/server'

import {
  JobCategoryCodeAlreadyExistsError,
  JobCategoryNameAlreadyExistsError,
  JobCategoryNotFoundError,
  updateJobCategoryRecord,
} from '@/lib/job-categories/job-category.service'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function parseBoolean(value: string | null) {
  if (value === null) {
    return undefined
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return undefined
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

function buildEditJobCategoryUrl(
  request: NextRequest,
  id: string,
  values: {
    error: string
    code?: string
    name?: string
    shortName?: string
    description?: string
    displayOrder?: string
    textColor?: string
    isActive?: boolean
  },
) {
  const url = new URL(
    `/maestros/categorias-profesionales/${id}/editar`,
    request.url,
  )

  url.searchParams.set('error', values.error)

  if (values.code) {
    url.searchParams.set('code', values.code)
  }

  if (values.name) {
    url.searchParams.set('name', values.name)
  }

  if (values.shortName) {
    url.searchParams.set('shortName', values.shortName)
  }

  if (values.description) {
    url.searchParams.set('description', values.description)
  }

  if (values.displayOrder) {
    url.searchParams.set('displayOrder', values.displayOrder)
  }

  if (values.textColor) {
    url.searchParams.set('textColor', values.textColor)
  }

  if (typeof values.isActive === 'boolean') {
    url.searchParams.set('isActive', values.isActive ? 'true' : 'false')
  }

  return url
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const { id } = await context.params
  const contentType = request.headers.get('content-type') || ''

  let code = ''
  let name = ''
  let shortName: string | null | undefined = undefined
  let description: string | null | undefined = undefined
  let displayOrder: number | undefined = undefined
  let textColor: string | null | undefined = undefined
  let isActive: boolean | undefined = undefined

  try {
    const formData = await request.formData()
    const method = formData.get('_method')?.toString()

    if (method !== 'PATCH') {
      return NextResponse.json(
        { error: 'Método no soportado.' },
        { status: 405 },
      )
    }

    code = formData.get('code')?.toString() ?? ''
    name = formData.get('name')?.toString() ?? ''

    const shortNameValue = formData.get('shortName')?.toString()
    shortName =
      typeof shortNameValue === 'string' ? shortNameValue : undefined

    const descriptionValue = formData.get('description')?.toString()
    description =
      typeof descriptionValue === 'string' ? descriptionValue : undefined

    displayOrder = parseInteger(
      formData.get('displayOrder')?.toString() ?? undefined,
    )

    const textColorValue = formData.get('textColor')?.toString()
    textColor =
      typeof textColorValue === 'string' ? textColorValue : undefined

    const isActiveValue = formData.get('isActive')?.toString() ?? null
    isActive = parseBoolean(isActiveValue)

    await updateJobCategoryRecord(id, {
      code,
      name,
      shortName,
      description,
      displayOrder,
      textColor,
      isActive: isActive ?? false,
    })

    return NextResponse.redirect(
      new URL('/maestros/categorias-profesionales', request.url),
      { status: 303 },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo actualizar la categoría profesional.'

    if (
      error instanceof JobCategoryCodeAlreadyExistsError ||
      error instanceof JobCategoryNameAlreadyExistsError ||
      error instanceof JobCategoryNotFoundError
    ) {
      return NextResponse.redirect(
        buildEditJobCategoryUrl(request, id, {
          error: error.message,
          code,
          name,
          shortName: shortName ?? undefined,
          description: description ?? undefined,
          displayOrder:
            typeof displayOrder === 'number' ? String(displayOrder) : undefined,
          textColor: textColor ?? undefined,
          isActive,
        }),
        { status: 303 },
      )
    }

    const isHtmlFormRequest =
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data') ||
      contentType === ''

    if (isHtmlFormRequest) {
      return NextResponse.redirect(
        buildEditJobCategoryUrl(request, id, {
          error: message,
          code,
          name,
          shortName: shortName ?? undefined,
          description: description ?? undefined,
          displayOrder:
            typeof displayOrder === 'number' ? String(displayOrder) : undefined,
          textColor: textColor ?? undefined,
          isActive,
        }),
        { status: 303 },
      )
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}