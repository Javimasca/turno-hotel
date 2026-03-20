import Link from 'next/link'

import { prisma } from '@/lib/prisma'

type Workplace = {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
}

async function getWorkplaces(): Promise<Workplace[]> {
  return prisma.workplace.findMany({
    orderBy: [{ name: 'asc' }],
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isActive: true,
    },
  })
}

export default async function WorkplacesPage() {
  const workplaces = await getWorkplaces()

  return (
    <main>
      <section className="app-section">
        <div className="app-container">
          <header className="page-header">
            <div className="page-header-content">
              <span className="page-eyebrow">Maestros</span>
              <h1 className="page-title">Lugares de trabajo</h1>
              <p className="page-description">
                Definimos aquí los hoteles o centros donde operará la
                planificación de turnos.
              </p>
            </div>

            <div className="page-actions">
              <Link href="/maestros" className="button button-secondary">
                Volver a maestros
              </Link>
              <Link
                href="/maestros/lugares-trabajo/nuevo"
                className="button button-primary"
              >
                Nuevo lugar de trabajo
              </Link>
            </div>
          </header>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workplaces.map((workplace) => (
                  <tr key={workplace.id}>
                    <td>{workplace.code}</td>
                    <td>{workplace.name}</td>
                    <td>{workplace.description ?? '-'}</td>
                    <td>
                      <span
                        className={`status-chip ${
                          workplace.isActive
                            ? 'status-completed'
                            : 'status-cancelled'
                        }`}
                      >
                        {workplace.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Link
                          href={`/maestros/lugares-trabajo/${workplace.id}/editar`}
                          className="button button-secondary"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {workplaces.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <h3 className="empty-state-title">
                          No hay lugares de trabajo
                        </h3>
                        <p className="empty-state-text">
                          Empieza creando el primer centro operativo.
                        </p>
                        <div style={{ marginTop: '16px' }}>
                          <Link
                            href="/maestros/lugares-trabajo/nuevo"
                            className="button button-primary"
                          >
                            Crear lugar de trabajo
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}