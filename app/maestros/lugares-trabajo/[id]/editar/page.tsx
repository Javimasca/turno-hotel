'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

type EditWorkplacePageProps = {
  params: Promise<{
    id: string
  }>
}

type FormState = {
  code: string
  name: string
  description: string
  isActive: string
}

type WorkplaceResponse = {
  data?: {
    id: string
    code: string
    name: string
    description: string | null
    isActive: boolean
  }
  error?: string
}

export default function EditWorkplacePage({
  params,
}: EditWorkplacePageProps) {
  const router = useRouter()

  const [workplaceId, setWorkplaceId] = useState<string>('')
  const [form, setForm] = useState<FormState>({
    code: '',
    name: '',
    description: '',
    isActive: 'true',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadWorkplace() {
      try {
        const resolvedParams = await params

        if (!isMounted) {
          return
        }

        setWorkplaceId(resolvedParams.id)

        const response = await fetch(
          `/api/maestros/lugares-trabajo/${resolvedParams.id}`,
          {
            cache: 'no-store',
          },
        )

        const json = (await response.json()) as WorkplaceResponse

        if (!response.ok || !json.data) {
          if (!isMounted) {
            return
          }

          setErrorMessage(
            json.error ?? 'No se pudo cargar el lugar de trabajo.',
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

    loadWorkplace()

    return () => {
      isMounted = false
    }
  }, [params])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!workplaceId) {
      setErrorMessage('No se ha podido identificar el lugar de trabajo.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/maestros/lugares-trabajo/${workplaceId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: form.code,
            name: form.name,
            description: form.description,
            isActive: form.isActive === 'true',
          }),
        },
      )

      const json = (await response.json()) as WorkplaceResponse

      if (!response.ok) {
        setErrorMessage(
          json.error ?? 'No se pudo actualizar el lugar de trabajo.',
        )
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

  if (isLoading) {
    return (
      <main>
        <section className="app-section">
          <div className="app-container">
            <header className="page-header">
              <div className="page-header-content">
                <span className="page-eyebrow">
                  Maestros · Lugares de trabajo
                </span>
                <h1 className="page-title">Editar lugar de trabajo</h1>
                <p className="page-description">
                  Estamos cargando la información del registro.
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

            <div className="card">
              <div className="card-content">
                <p style={{ margin: 0 }}>Cargando datos del lugar de trabajo...</p>
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
              <span className="page-eyebrow">Maestros · Lugares de trabajo</span>
              <h1 className="page-title">Editar lugar de trabajo</h1>
              <p className="page-description">
                Actualizamos la información del centro operativo con datos reales
                del sistema.
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

          <div className="grid grid-cols-2" style={{ marginBottom: '24px' }}>
            <article className="card">
              <div className="card-header">
                <h2 className="card-title">Contexto del registro</h2>
                <p className="card-description">
                  Trabajamos ya sobre el lugar de trabajo real seleccionado.
                </p>
              </div>

              <div className="card-content">
                <div className="grid">
                  <div>
                    <span className="status-chip status-draft">id</span>
                    <p style={{ margin: '12px 0 0' }}>{workplaceId}</p>
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
                <h2 className="card-title">Impacto funcional</h2>
                <p className="card-description">
                  Cualquier cambio aquí afecta a la estructura general de
                  departamentos y asignaciones.
                </p>
              </div>

              <div className="card-content">
                <div className="grid">
                  <div>
                    <span className="status-chip status-published">
                      departamentos
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Los departamentos dependerán de este lugar de trabajo.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      empleados
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Los trabajadores podrán estar autorizados para operar en
                      este centro.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      planificación
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      La asignación de turnos diarios dependerá de estas
                      relaciones maestras.
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
                  Editamos la información principal del lugar de trabajo.
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

            <section className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">Estado</h2>
                <p className="form-section-text">
                  Controlamos si el lugar de trabajo está disponible para su uso
                  operativo.
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
                {isSubmitting ? 'Guardando cambios...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}