import Link from 'next/link'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function DepartmentJobCategoriesPage() {
  const records = await prisma.departmentJobCategory.findMany({
    include: {
      department: {
        select: {
          id: true,
          code: true,
          name: true,
          workplace: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
      jobCategory: {
        select: {
          id: true,
          code: true,
          name: true,
          shortName: true,
          isActive: true,
        },
      },
      workArea: {
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
        },
      },
      quadrantGroup: {
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
        },
      },
    },
    orderBy: [
      { department: { name: 'asc' } },
      { workArea: { displayOrder: 'asc' } },
      { quadrantGroup: { displayOrder: 'asc' } },
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros" className="back-link">
            ← Volver a maestros
          </Link>

          <p className="eyebrow">Maestros · Asignaciones de categorías</p>

          <h1>Asignaciones de categorías</h1>

          <p className="page-description">
            Relacionamos categorías profesionales con su contexto operativo real:
            departamento, zona de trabajo y grupo de cuadrante.
          </p>
        </div>

        <div className="page-header-actions">
          <Link
            href="/maestros/asignaciones-categorias/nuevo"
            className="button button-primary"
          >
            Nueva asignación
          </Link>
        </div>
      </section>

      <section className="card">
        {records.length === 0 ? (
          <div className="empty-state">
            <h3>No hay asignaciones de categorías</h3>
            <p>
              Todavía no hemos definido ninguna relación entre departamento,
              zona, grupo y categoría profesional.
            </p>

            <Link
              href="/maestros/asignaciones-categorias/nuevo"
              className="button button-primary"
            >
              Crear primera asignación
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hotel / centro</th>
                  <th>Departamento</th>
                  <th>Zona</th>
                  <th>Grupo</th>
                  <th>Categoría</th>
                  <th>Orden</th>
                  <th>Estado</th>
                  <th className="actions-column">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.department.workplace.name}</td>

                    <td>
                      <strong>{record.department.name}</strong>
                    </td>

                    <td>{record.workArea.name}</td>

                    <td>{record.quadrantGroup.name}</td>

                    <td>
                      <strong>{record.jobCategory.name}</strong>
                      {record.jobCategory.shortName ? (
                        <>
                          <br />
                          <span style={{ color: 'var(--color-text-soft)' }}>
                            {record.jobCategory.shortName}
                          </span>
                        </>
                      ) : null}
                    </td>

                    <td>{record.displayOrder}</td>

                    <td>
                      <span
                        className={
                          record.isActive
                            ? 'status-chip active'
                            : 'status-chip inactive'
                        }
                      >
                        {record.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    <td className="actions-cell">
                      <Link
                        href={`/maestros/asignaciones-categorias/${record.id}/editar`}
                        className="button button-secondary"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}