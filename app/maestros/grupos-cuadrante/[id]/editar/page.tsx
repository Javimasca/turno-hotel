'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

type EditQuadrantGroupPageProps = {
  params: Promise<{
    id: string
  }>
}

type FormState = {
  code: string
  name: string
  description: string
  displayOrder: string
  isActive: string
}

type QuadrantGroupResponse = {
  data?: {
    id: string
    code: string
    name: string
    description: string | null
    displayOrder: number
    isActive: boolean
  }
  error?: string
}

export default function EditQuadrantGroupPage({
  params,
}: EditQuadrantGroupPageProps) {
  const router = useRouter()

  const [quadrantGroupId, setQuadrantGroupId] = useState<string>('')
  const [form, setForm] = useState<FormState>({
    code: '',
    name: '',
    description: '',
    displayOrder: '0',
    isActive: 'true',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadQuadrantGroup() {
      try {
        const resolvedParams = await params

        if (!isMounted) {
          return
        }

        setQuadrantGroupId(resolvedParams.id)

        const response = await fetch(
          `/api/maestros/grupos-cuadrante/${resolvedParams.id}`,
          {
            cache: 'no-store',
          },
        )

        const json = (await response.json()) as QuadrantGroupResponse

        if (!response.ok || !json.data) {
          if (!isMounted) {
            return
          }

          setErrorMessage(
            json.error ?? 'No se pudo cargar el grupo de cuadrante.',
          )
          setIsLoading(false)
          return
        }

        if (!isMounted) {
          return
        }

        setForm({
          code: json.data.code,
          name: json.data.name,
          description: json.data.description ?? '',
          displayOrder: String(json.data.displayOrder),
          isActive: json.data.isActive ? 'true' : 'false',
        })
        setIsLoading(false)
      } catch {
        if (!isMounted) {
          return
        }

        setErrorMessage('Se ha producido un error al cargar el registro.')
        setIsLoading(false)
      }
    }

    loadQuadrantGroup()

    return () => {
      isMounted = false
    }
  }, [params])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!quadrantGroupId) {
      setErrorMessage('No se ha podido identificar el grupo de cuadrante.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/maestros/grupos-cuadrante/${quadrantGroupId}`,
        {
          method: 'PATCH',
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
        },
      )

      const json = (await response.json()) as QuadrantGroupResponse

      if (!response.ok) {
        setErrorMessage(
          json.error ?? 'No se pudo actualizar el grupo de cuadrante.',
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

  if (isLoading) {
    return (
      <main>
        <section className="app-section">
          <div className="app-container">
            <header className="page-header">
              <div className="page-header-content">
                <span className="page-eyebrow">
                  Maestros · Grupos de cuadrante
                </span>
                <h1 className="page-title">Editar grupo de cuadrante</h1>
                <p className="page-description">
                  Estamos cargando la información del registro.
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

            <div className="card">
              <div className="card-content">
                <p style={{ margin: 0 }}>Cargando datos del grupo de cuadrante...</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
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
              <h1 className="page-title">Editar grupo de cuadrante</h1>
              <p className="page-description">
                Actualizamos la agrupación visual y operativa del cuadrante con
                datos reales del sistema.
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

          <div className="grid grid-cols-2" style={{ marginBottom: '24px' }}>
            <article className="card">
              <div className="card-header">
                <h2 className="card-title">Contexto del registro</h2>
                <p className="card-description">
                  Trabajamos ya sobre el grupo de cuadrante real seleccionado.
                </p>
              </div>

              <div className="card-content">
                <div className="grid">
                  <div>
                    <span className="status-chip status-draft">id</span>
                    <p style={{ margin: '12px 0 0' }}>{quadrantGroupId}</p>
                  </div>

                  <div>
                    <span className="status-chip status-published">estado</span>
                    <p style={{ margin: '12px 0 0' }}>
                      {form.isActive === 'true' ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="card-header">
                <h2 className="card-title">Uso en cuadrante</h2>
                <p className="card-description">
                  Este maestro permite ordenar categorías distintas dentro de la
                  misma zona visual del planning.
                </p>
              </div>

              <div className="card-content">
                <div className="grid">
                  <div>
                    <span className="status-chip status-published">
                      agrupación
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Varias categorías podrán compartir este mismo grupo.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">orden</span>
                    <p style={{ margin: '12px 0 0' }}>
                      El orden visual ayuda a estructurar el cuadrante por
                      bloques operativos.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">lectura</span>
                    <p style={{ margin: '12px 0 0' }}>
                      Mejoramos claridad sin deformar la categoría laboral real.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <form className="form-layout" onSubmit={handleSubmit}>
            <section className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">Datos generales</h2>
                <p className="form-section-text">
                  Editamos la información principal del grupo de cuadrante.
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
                {isSubmitting ? 'Guardando cambios...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}