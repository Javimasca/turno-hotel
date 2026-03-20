'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

type FormState = {
  code: string
  name: string
  description: string
  isActive: string
}

export default function NewWorkplacePage() {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    code: '',
    name: '',
    description: '',
    isActive: 'true',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/maestros/lugares-trabajo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          description: form.description,
          isActive: form.isActive === 'true',
        }),
      })

      const json = (await response.json()) as {
        data?: unknown
        error?: string
      }

      if (!response.ok) {
        setErrorMessage(json.error ?? 'No se pudo guardar el lugar de trabajo.')
        return
      }

      router.push('/maestros/lugares-trabajo')
      router.refresh()
    } catch {
      setErrorMessage('Se ha producido un error inesperado al guardar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main>
      <section className="app-section">
        <div className="app-container">
          <header className="page-header">
            <div className="page-header-content">
              <span className="page-eyebrow">Maestros · Lugares de trabajo</span>
              <h1 className="page-title">Nuevo lugar de trabajo</h1>
              <p className="page-description">
                Creamos aquí un nuevo hotel o centro operativo para incorporarlo
                a la estructura general de TurnoHotel.
              </p>
            </div>

            <div className="page-actions">
              <Link
                href="/maestros/lugares-trabajo"
                className="button button-secondary"
              >
                Volver al listado
              </Link>
            </div>
          </header>

          <form className="form-layout" onSubmit={handleSubmit}>
            <section className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">Datos generales</h2>
                <p className="form-section-text">
                  Definimos la información principal del lugar de trabajo.
                </p>
              </div>

              <div className="form-section-body">
                <div className="grid grid-cols-2">
                  <div className="field-group">
                    <label htmlFor="code" className="field-label">
                      Código
                    </label>
                    <input
                      id="code"
                      name="code"
                      className="input"
                      type="text"
                      placeholder="Ej. HTL001"
                      value={form.code}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          code: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="name" className="field-label">
                      Nombre
                    </label>
                    <input
                      id="name"
                      name="name"
                      className="input"
                      type="text"
                      placeholder="Ej. Hotel Puerto Antilla"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="field-group" style={{ marginTop: '24px' }}>
                  <label htmlFor="description" className="field-label">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="textarea"
                    placeholder="Descripción interna del lugar de trabajo"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">Estado inicial</h2>
                <p className="form-section-text">
                  Dejamos preparado si el centro nace activo o inactivo.
                </p>
              </div>

              <div className="form-section-body">
                <div className="field-group" style={{ maxWidth: '320px' }}>
                  <label htmlFor="isActive" className="field-label">
                    Estado
                  </label>
                  <select
                    id="isActive"
                    name="isActive"
                    className="select"
                    value={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">Resumen funcional</h2>
                <p className="form-section-text">
                  Este maestro será la base sobre la que colgarán departamentos
                  y, después, la planificación diaria.
                </p>
              </div>

              <div className="form-section-body">
                <div className="grid">
                  <div>
                    <span className="status-chip status-published">
                      departamentos
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Cada departamento pertenecerá a un único lugar de trabajo.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      empleados
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Los trabajadores podrán estar asignados a uno o varios
                      lugares según su ficha.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">turnos</span>
                    <p style={{ margin: '12px 0 0' }}>
                      La planificación futura solo permitirá turnos dentro de
                      lugares válidos para cada empleado.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {errorMessage && (
              <div className="form-section">
                <div className="form-section-body">
                  <span className="status-chip status-cancelled">error</span>
                  <p style={{ margin: '12px 0 0' }}>{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="page-actions">
              <Link
                href="/maestros/lugares-trabajo"
                className="button button-secondary"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Guardando lugar de trabajo...'
                  : 'Guardar lugar de trabajo'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}