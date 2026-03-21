import { NextRequest, NextResponse } from 'next/server'

import {
  JobCategoryCodeAlreadyExistsError,
  JobCategoryNameAlreadyExistsError,
  createJobCategoryRecord,
  listJobCategoryRecords,
} from '@/lib/job-categories/job-category.service'

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

function buildNewJobCategoryUrl(
  request: NextRequest,
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
  const url = new URL('/maestros/categorias-profesionales/nuevo', request.url)

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = parseBoolean(searchParams.get('isActive'))

    const records = await listJobCategoryRecords({
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    })

    return NextResponse.json(records)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error al obtener las categorías profesionales.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  let code = ''
  let name = ''
  let shortName: string | null | undefined = undefined
  let description: string | null | undefined = undefined
  let displayOrder: number | undefined = undefined
  let textColor: string | null | undefined = undefined
  let isActive: boolean | undefined = undefined

  try {
    if (contentType.includes('application/json')) {
      const body = await request.json()

      code = typeof body.code === 'string' ? body.code : ''
      name = typeof body.name === 'string' ? body.name : ''
      shortName =
        typeof body.shortName === 'string' || body.shortName === null
          ? body.shortName
          : undefined
      description =
        typeof body.description === 'string' || body.description === null
          ? body.description
          : undefined
      displayOrder = parseInteger(body.displayOrder)
      textColor =
        typeof body.textColor === 'string' || body.textColor === null
          ? body.textColor
          : undefined
      isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined
    } else {
      const formData = await request.formData()

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
    }

    const created = await createJobCategoryRecord({
      code,
      name,
      shortName,
      description,
      displayOrder,
      textColor,
      isActive,
    })

    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(
        new URL('/maestros/categorias-profesionales', request.url),
        { status: 303 },
      )
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error al crear la categoría profesional.'

    const isHtmlFormRequest =
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data') ||
      contentType === ''

    if (isHtmlFormRequest) {
      return NextResponse.redirect(
        buildNewJobCategoryUrl(request, {
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

    if (error instanceof JobCategoryCodeAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    if (error instanceof JobCategoryNameAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}