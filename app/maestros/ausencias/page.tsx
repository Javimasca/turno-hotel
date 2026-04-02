import Link from 'next/link'
import { absenceTypeService } from '@/lib/absence-types/absence-type.service'

type PageProps = {
  searchParams?: Promise<{
    created?: string
    updated?: string
    deleted?: string
    error?: string
  }>
}

function getDurationModeLabel(mode: 'FULL_DAY' | 'HOURLY' | 'BOTH') {
  switch (mode) {
    case 'FULL_DAY':
      return 'Día completo'
    case 'HOURLY':
      return 'Por horas'
    case 'BOTH':
      return 'Ambos'
    default:
      return mode
  }
}

function getStatusClass(isActive: boolean) {
  return isActive ? 'status-chip active' : 'status-chip inactive'
}

export default async function AusenciasPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const result = await absenceTypeService.list()

  if (!result.ok) {
    throw new Error(result.error)
  }

  const items = result.data

  const activeCount = items.filter((item) => item.isActive).length
  const paidCount = items.filter((item) => item.isPaid).length
  const blockingCount = items.filter((item) => item.blocksShifts).length

  return (
    <main className="page-shell">
      <section className="page-header">
        <div className="page-header-content">
          <p className="eyebrow">Maestros</p>
          <h1>Ausencias</h1>
          <p className="page-description">
            Gestionamos el catálogo de tipos de ausencia del sistema, su duración,
            su comportamiento operativo y su impacto en planificación y nómina.
          </p>
        </div>

        <div className="page-header-actions">
          <Link href="/maestros" className="button button-secondary">
            Volver a maestros
          </Link>
          <Link href="/maestros/ausencias/nuevo" className="button button-primary">
            Nueva ausencia
          </Link>
        </div>
      </section>

      <section className="kpi-grid">
        <article className="kpi-card">
          <p className="kpi-label">Total tipos</p>
          <p className="kpi-value">{items.length}</p>
          <p className="kpi-text">Tipos de ausencia registrados</p>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Activas</p>
          <p className="kpi-value">{activeCount}</p>
          <p className="kpi-text">Disponibles para usar</p>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Retribuidas</p>
          <p className="kpi-value">{paidCount}</p>
          <p className="kpi-text">Con impacto retributivo</p>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Bloquean turnos</p>
          <p className="kpi-value">{blockingCount}</p>
          <p className="kpi-text">Incompatibles con asignación</p>
        </article>
      </section>

      {resolvedSearchParams.created === '1' && (
        <section className="card">
          <p style={{ margin: 0, color: 'var(--color-success)', fontWeight: 700 }}>
            Tipo de ausencia creado correctamente.
          </p>
        </section>
      )}

      {resolvedSearchParams.updated === '1' && (
        <section className="card">
          <p style={{ margin: 0, color: 'var(--color-success)', fontWeight: 700 }}>
            Tipo de ausencia actualizado correctamente.
          </p>
        </section>
      )}

      {resolvedSearchParams.deleted === '1' && (
        <section className="card">
          <p style={{ margin: 0, color: 'var(--color-success)', fontWeight: 700 }}>
            Tipo de ausencia eliminado correctamente.
          </p>
        </section>
      )}

      {resolvedSearchParams.error && (
        <section className="card">
          <p style={{ margin: 0, color: 'var(--color-error)', fontWeight: 700 }}>
            {resolvedSearchParams.error}
          </p>
        </section>
      )}

      {items.length === 0 ? (
        <section className="empty-state">
          <h3 className="empty-state-title">Todavía no hay tipos de ausencia</h3>
          <p className="empty-state-text">
            Crea el primer tipo de ausencia para empezar a configurar vacaciones,
            IT, consulta médica, asuntos propios y otros casos.
          </p>
          <Link href="/maestros/ausencias/nuevo" className="button button-primary">
            Crear primer tipo de ausencia
          </Link>
        </section>
      ) : (
        <section className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Duración</th>
                <th>Estado</th>
                <th>Retribuida</th>
                <th>Bloquea turnos</th>
                <th>Aprobación</th>
                <th>Color</th>
                <th className="actions-column">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.displayOrder}</td>

                  <td>
                    <span className="badge status-draft">{item.code}</span>
                  </td>

                  <td>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <strong>{item.name}</strong>
                      {item.description && (
                        <span style={{ color: 'var(--color-text-soft)', fontSize: 14 }}>
                          {item.description}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span className="badge status-published">
                      {getDurationModeLabel(item.durationMode)}
                    </span>
                  </td>

                  <td>
                    <span className={getStatusClass(item.isActive)}>
                      {item.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>

                  <td>
                    <span className={item.isPaid ? 'status-chip active' : 'status-chip inactive'}>
                      {item.isPaid ? 'Sí' : 'No'}
                    </span>
                  </td>

                  <td>
                    <span className={item.blocksShifts ? 'status-chip active' : 'status-chip inactive'}>
                      {item.blocksShifts ? 'Sí' : 'No'}
                    </span>
                  </td>

                  <td>
                    <span className={item.requiresApproval ? 'status-chip active' : 'status-chip inactive'}>
                      {item.requiresApproval ? 'Sí' : 'No'}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border: '1px solid var(--color-border)',
                          background: item.color || '#ffffff',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ color: 'var(--color-text-soft)', fontSize: 14 }}>
                        {item.color || '—'}
                      </span>
                    </div>
                  </td>

                  <td className="actions-column">
                    <div className="actions-cell">
                      <Link
                        href={`/maestros/ausencias/${item.id}/editar`}
                        className="button button-secondary"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  )
}