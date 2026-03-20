'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

type FormState = {
  code: string
  name: string
  description: string
  displayOrder: string
  isActive: string
}

export default function NewQuadrantGroupPage() {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    code: '',
    name: '',
    description: '',
    displayOrder: '0',
    isActive: 'true',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/maestros/grupos-cuadrante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          description: form.description,
          displayOrder:
            form.displayOrder.trim().length > 0
              ? Number(form.displayOrder)
              : 0,
          isActive: form.isActive === 'true',
        }),
      })

      const json = (await response.json()) as {
        data?: unknown
        error?: string
      }

      if (!response.ok) {
        setErrorMessage(
          json.error ?? 'No se pudo guardar el grupo de cuadrante.',
        )
        return
      }

      router.push('/maestros/grupos-cuadrante')
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
              <span className="page-eyebrow">
                Maestros · Grupos de cuadrante
              </span>
              <h1 className="page-title">Nuevo grupo de cuadrante</h1>
              <p className="page-description">
                Creamos aquí una agrupación operativa para ordenar visualmente
                las categorías dentro del cuadrante.
              </p>
            </div>

            <div className="page-actions">
              <Link
                href="/maestros/grupos-cuadrante"
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
                  Definimos la agrupación que luego podremos reutilizar en varias
                  categorías laborales.
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
                      placeholder="Ej. SALA"
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
                      placeholder="Ej. Sala"
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

                <div className="grid grid-cols-2" style={{ marginTop: '24px' }}>
                  <div className="field-group">
                    <label htmlFor="displayOrder" className="field-label">
                      Orden visual
                    </label>
                    <input
                      id="displayOrder"
                      name="displayOrder"
                      className="input"
                      type="number"
                      min="0"
                      step="1"
                      value={form.displayOrder}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          displayOrder: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="field-group">
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

                <div className="field-group" style={{ marginTop: '24px' }}>
                  <label htmlFor="description" className="field-label">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="textarea"
                    placeholder="Descripción interna del grupo de cuadrante"
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
                <h2 className="form-section-title">Uso funcional</h2>
                <p className="form-section-text">
                  Este maestro no sustituye a la categoría laboral: la organiza
                  visualmente dentro del cuadrante.
                </p>
              </div>

              <div className="form-section-body">
                <div className="grid">
                  <div>
                    <span className="status-chip status-published">
                      agrupación
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Varias categorías podrán compartir el mismo grupo de
                      cuadrante.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      ordenación
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      El orden visual ayudará a decidir en qué zona aparece cada
                      bloque en el planning.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      lectura
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Esto hará más fácil leer juntos perfiles como cocina, sala
                      o pisos.
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
                href="/maestros/grupos-cuadrante"
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
                  ? 'Guardando grupo de cuadrante...'
                  : 'Guardar grupo de cuadrante'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}