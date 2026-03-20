import Link from 'next/link'

type QuadrantGroup = {
  id: string
  code: string
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

async function getQuadrantGroups(): Promise<QuadrantGroup[]> {
  const res = await fetch(
    'http://localhost:3000/api/maestros/grupos-cuadrante',
    {
      cache: 'no-store',
    },
  )

  if (!res.ok) {
    throw new Error('Error cargando grupos de cuadrante')
  }

  const json = (await res.json()) as {
    data: QuadrantGroup[]
  }

  return json.data
}

export default async function QuadrantGroupsPage() {
  const quadrantGroups = await getQuadrantGroups()

  return (
    <main>
      <section className="app-section">
        <div className="app-container">
          <header className="page-header">
            <div className="page-header-content">
              <span className="page-eyebrow">Maestros</span>
              <h1 className="page-title">Grupos de cuadrante</h1>
              <p className="page-description">
                Definimos aquí las agrupaciones visuales y operativas que nos
                ayudarán a ordenar categorías dentro del cuadrante.
              </p>
            </div>

            <div className="page-actions">
              <Link href="/maestros" className="button button-secondary">
                Volver a maestros
              </Link>
              <Link
                href="/maestros/grupos-cuadrante/nuevo"
                className="button button-primary"
              >
                Nuevo grupo de cuadrante
              </Link>
            </div>
          </header>

          <div className="grid grid-cols-2" style={{ marginBottom: '24px' }}>
            <article className="card">
              <div className="card-header">
                <h2 className="card-title">Para qué sirve este maestro</h2>
                <p className="card-description">
                  Separamos la categoría laboral real de la agrupación visual del
                  cuadrante.
                </p>
              </div>

              <div className="card-content">
                <div className="grid">
                  <div>
                    <span className="status-chip status-published">
                      agrupación
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Permite colocar juntas categorías distintas dentro de la
                      misma zona operativa del cuadrante.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">orden</span>
                    <p style={{ margin: '12px 0 0' }}>
                      El campo de orden nos ayudará a decidir cómo se dibujan los
                      bloques en pantalla.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      categorías
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Varias categorías laborales podrán pertenecer al mismo
                      grupo de cuadrante.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="card-header">
                <h2 className="card-title">Ejemplos típicos</h2>
                <p className="card-description">
                  Esta agrupación no sustituye a la categoría, la organiza
                  visualmente.
                </p>
              </div>

              <div className="card-content">
                <div className="grid">
                  <div>
                    <span className="status-chip status-draft">sala</span>
                    <p style={{ margin: '12px 0 0' }}>
                      Camareros y ayudantes de camarero.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-draft">cocina</span>
                    <p style={{ margin: '12px 0 0' }}>
                      Cocineros y ayudantes de cocina.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-draft">pisos</span>
                    <p style={{ margin: '12px 0 0' }}>
                      Gobernanta y camareras de pisos.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quadrantGroups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.displayOrder}</td>
                    <td>{group.code}</td>
                    <td>{group.name}</td>
                    <td>{group.description ?? '-'}</td>
                    <td>
                      <span
                        className={`status-chip ${
                          group.isActive
                            ? 'status-completed'
                            : 'status-cancelled'
                        }`}
                      >
                        {group.isActive ? 'Activo' : 'Inactivo'}
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
                          href={`/maestros/grupos-cuadrante/${group.id}/editar`}
                          className="button button-secondary"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {quadrantGroups.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <h3 className="empty-state-title">
                          No hay grupos de cuadrante
                        </h3>
                        <p className="empty-state-text">
                          Crea el primero para empezar a ordenar visualmente las
                          categorías en el cuadrante.
                        </p>
                        <div style={{ marginTop: '16px' }}>
                          <Link
                            href="/maestros/grupos-cuadrante/nuevo"
                            className="button button-primary"
                          >
                            Crear grupo de cuadrante
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