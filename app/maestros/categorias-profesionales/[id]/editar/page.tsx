import Link from 'next/link'

import { prisma } from '@/lib/prisma'

const TEXT_COLOR_OPTIONS = [
  { value: '#0F172A', label: 'Azul corporativo' },
  { value: '#B7791F', label: 'Oro corporativo' },
  { value: '#0F766E', label: 'Verde petróleo' },
  { value: '#475569', label: 'Gris pizarra' },
  { value: '#047857', label: 'Verde operativo' },
  { value: '#C2410C', label: 'Terracota' },
]

type EditJobCategoryPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    error?: string
    code?: string
    name?: string
    shortName?: string
    description?: string
    displayOrder?: string
    textColor?: string
    isActive?: string
  }>
}

async function getJobCategory(id: string) {
  return prisma.jobCategory.findUnique({
    where: { id },
  })
}

export default async function EditJobCategoryPage({
  params,
  searchParams,
}: EditJobCategoryPageProps) {
  const { id } = await params
  const query = searchParams ? await searchParams : undefined

  const category = await getJobCategory(id)

  if (!category) {
    return (
      <main className="page-shell">
        <section className="page-header">
          <div>
            <Link
              href="/maestros/categorias-profesionales"
              className="back-link"
            >
              ← Volver a categorías profesionales
            </Link>

            <p className="eyebrow">Maestros · Categorías profesionales</p>
            <h1>Editar categoría profesional</h1>
            <p className="page-description">
              No se ha podido cargar la categoría profesional solicitada.
            </p>
          </div>
        </section>
      </main>
    )
  }

  const error = query?.error?.trim() || ''
  const code = query?.code?.trim() || category.code
  const name = query?.name?.trim() || category.name
  const shortName = query?.shortName?.trim() || category.shortName || ''
  const description = query?.description?.trim() || category.description || ''
  const displayOrder =
    query?.displayOrder?.trim() || String(category.displayOrder ?? 0)
  const textColor =
    query?.textColor?.trim() ||
    category.textColor ||
    TEXT_COLOR_OPTIONS[0].value
  const isActive = query?.isActive
    ? query.isActive !== 'false'
    : category.isActive

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link
            href="/maestros/categorias-profesionales"
            className="back-link"
          >
            ← Volver a categorías profesionales
          </Link>

          <p className="eyebrow">Maestros · Categorías profesionales</p>

          <h1>Editar categoría profesional</h1>

          <p className="page-description">
            Actualizamos la definición global de la categoría profesional para
            mantener coherencia en toda la estructura operativa.
          </p>
        </div>
      </section>

      <section className="card">
        <form
          className="form-grid"
          action={`/api/maestros/categorias-profesionales/${id}`}
          method="post"
        >
          <input type="hidden" name="_method" value="PATCH" />

          {error ? (
            <div className="form-field form-field-full">
              <div className="form-error" role="alert">
                {error}
              </div>
            </div>
          ) : null}

          <div className="form-field">
            <label htmlFor="code">Código</label>
            <input
              id="code"
              name="code"
              type="text"
              placeholder="Ej. CAM"
              defaultValue={code}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ej. Camarero/a"
              defaultValue={name}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="shortName">Nombre corto</label>
            <input
              id="shortName"
              name="shortName"
              type="text"
              placeholder="Ej. Camarero"
              defaultValue={shortName}
            />
          </div>

          <div className="form-field">
            <label htmlFor="displayOrder">Orden</label>
            <input
              id="displayOrder"
              name="displayOrder"
              type="number"
              min="0"
              step="1"
              defaultValue={displayOrder}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="textColor">Color de texto</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              {TEXT_COLOR_OPTIONS.map((option) => {
                const isSelected = textColor === option.value

                return (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      border: isSelected
                        ? '2px solid #b7791f'
                        : '1px solid #dbe4f0',
                      borderRadius: '12px',
                      background: isSelected ? '#fffaf0' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="textColor"
                      value={option.value}
                      defaultChecked={isSelected}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '999px',
                        border: '1px solid rgba(15, 23, 42, 0.15)',
                        backgroundColor: option.value,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '14px',
                        color: '#0f172a',
                        fontWeight: 600,
                      }}
                    >
                      {option.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="form-field form-field-checkbox">
            <label htmlFor="isActive">Activo</label>
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={isActive}
              value="true"
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe la categoría profesional."
              defaultValue={description}
            />
          </div>

          <div className="form-actions">
            <Link
              href="/maestros/categorias-profesionales"
              className="button button-secondary"
            >
              Cancelar
            </Link>

            <button type="submit" className="button button-primary">
              Guardar cambios
            </button>
          </div>
        </form>

        <form
          action="/api/maestros/categorias-profesionales"
          method="post"
          className="danger-zone"
        >
          <input type="hidden" name="_method" value="DELETE" />
          <input type="hidden" name="id" value={id} />

          <button type="submit" className="button button-danger">
            Eliminar categoría profesional
          </button>
        </form>
      </section>
    </main>
  )
}