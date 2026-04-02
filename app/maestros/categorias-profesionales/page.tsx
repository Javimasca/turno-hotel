import Link from 'next/link'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type JobCategoriesPageProps = {
  searchParams?: Promise<{
    error?: string
  }>
}

export default async function JobCategoriesPage({
  searchParams,
}: JobCategoriesPageProps) {
  const query = searchParams ? await searchParams : undefined
  const error = query?.error?.trim() || ''

  const categories = await prisma.jobCategory.findMany({
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  })

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros" className="back-link">
            ← Volver a maestros
          </Link>

          <p className="eyebrow">Maestros · Categorías profesionales</p>

          <h1>Categorías profesionales</h1>

          <p className="page-description">
            Definimos las categorías laborales del sistema. Estas categorías se
            utilizarán para asignar empleados y estructurar la planificación.
          </p>
        </div>

        <div className="page-header-actions">
          <Link
            href="/maestros/categorias-profesionales/nuevo"
            className="button button-primary"
          >
            Nueva categoría
          </Link>
        </div>
      </section>

      {error ? (
        <section className="card">
          <div className="form-error" role="alert">
            {error}
          </div>
        </section>
      ) : null}

      <section className="card">
        {categories.length === 0 ? (
          <div className="empty-state">
            <h3>No hay categorías profesionales</h3>
            <p>
              Todavía no hemos definido ninguna categoría. Podemos empezar
              creando la primera.
            </p>

            <Link
              href="/maestros/categorias-profesionales/nuevo"
              className="button button-primary"
            >
              Crear categoría
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Nombre corto</th>
                  <th>Orden</th>
                  <th>Estado</th>
                  <th className="actions-column">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => {
                  const resolvedTextColor = category.textColor || '#0f172a'
                  const resolvedDotColor = category.textColor || '#cbd5e1'

                  return (
                    <tr key={category.id}>
                      <td>{category.code}</td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '999px',
                              flexShrink: 0,
                              border: '1px solid rgba(15, 23, 42, 0.08)',
                              backgroundColor: resolvedDotColor,
                            }}
                          />

                          <strong style={{ color: resolvedTextColor }}>
                            {category.name}
                          </strong>
                        </div>
                      </td>

                      <td>
                        {category.shortName ? (
                          <span style={{ color: resolvedTextColor }}>
                            {category.shortName}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td>{category.displayOrder}</td>

                      <td>
                        <span
                          className={
                            category.isActive
                              ? 'status-chip active'
                              : 'status-chip inactive'
                          }
                        >
                          {category.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>

                      <td className="actions-cell">
                        <Link
                          href={`/maestros/categorias-profesionales/${category.id}/editar`}
                          className="button button-secondary"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}