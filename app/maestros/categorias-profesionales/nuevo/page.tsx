'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

type EditJobCategoryPageProps = {
  params: Promise<{
    id: string
  }>
}

type FormState = {
  code: string
  name: string
  shortName: string
  description: string
  displayOrder: string
  textColor: string
  isActive: string
}

type JobCategoryResponse = {
  id: string
  code: string
  name: string
  shortName: string | null
  description: string | null
  displayOrder: number
  textColor: string | null
  isActive: boolean
}

export default function EditJobCategoryPage({
  params,
}: EditJobCategoryPageProps) {
  const router = useRouter()

  const [categoryId, setCategoryId] = useState<string>('')

  const [form, setForm] = useState<FormState>({
    code: '',
    name: '',
    shortName: '',
    description: '',
    displayOrder: '0',
    textColor: '',
    isActive: 'true',
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const resolved = await params

        if (!isMounted) return

        setCategoryId(resolved.id)

        const response = await fetch(
          `/api/maestros/categorias-profesionales/${resolved.id}`,
          { cache: 'no-store' },
        )

        const json = (await response.json()) as JobCategoryResponse & {
          error?: string
        }

        if (!response.ok) {
          if (!isMounted) return
          setErrorMessage(json.error ?? 'No se pudo cargar la categoría.')
          setIsLoading(false)
          return
        }

        if (!isMounted) return

        setForm({
          code: json.code,
          name: json.name,
          shortName: json.shortName ?? '',
          description: json.description ?? '',
          displayOrder: String(json.displayOrder ?? 0),
          textColor: json.textColor ?? '',
          isActive: json.isActive ? 'true' : 'false',
        })

        setIsLoading(false)
      } catch {
        if (!isMounted) return
        setErrorMessage('Error al cargar la categoría.')
        setIsLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [params])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!categoryId) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/maestros/categorias-profesionales/${categoryId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: form.code,
            name: form.name,
            shortName: form.shortName,
            description: form.description,
            displayOrder: Number(form.displayOrder),
            textColor: form.textColor,
            isActive: form.isActive === 'true',
          }),
        },
      )

      const json = await response.json()

      if (!response.ok) {
        setErrorMessage(json.error ?? 'Error al guardar.')
        return
      }

      router.push('/maestros/categorias-profesionales')
      router.refresh()
    } catch {
      setErrorMessage('Error inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!categoryId) return

    const confirmed = window.confirm(
      '¿Seguro que queremos eliminar esta categoría profesional?',
    )

    if (!confirmed) return

    setErrorMessage(null)
    setIsDeleting(true)

    try {
      const response = await fetch(
        `/api/maestros/categorias-profesionales/${categoryId}`,
        { method: 'DELETE' },
      )

      const json = await response.json()

      if (!response.ok) {
        setErrorMessage(json.error ?? 'No se pudo eliminar.')
        return
      }

      router.push('/maestros/categorias-profesionales')
      router.refresh()
    } catch {
      setErrorMessage('Error inesperado al eliminar.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <p>Cargando categoría...</p>
      </main>
    )
  }

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
        </div>
      </section>

      <form className="form-layout" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-body">
            <div className="form-grid">
              <div className="form-field">
                <label>Código</label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Nombre corto</label>
                <input
                  value={form.shortName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, shortName: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Orden</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      displayOrder: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Color texto</label>
                <input
                  value={form.textColor}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      textColor: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-field form-field-checkbox">
                <label>Activo</label>
                <input
                  type="checkbox"
                  checked={form.isActive === 'true'}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      isActive: e.target.checked ? 'true' : 'false',
                    }))
                  }
                />
              </div>

              <div className="form-field form-field-full">
                <label>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="card">
            <span className="status-chip inactive">error</span>
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="page-actions">
          <Link
            href="/maestros/categorias-profesionales"
            className="button button-secondary"
          >
            Cancelar
          </Link>

          <button
            type="button"
            className="button button-danger"
            onClick={handleDelete}
            disabled={isDeleting || isSubmitting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>

          <button
            type="submit"
            className="button button-primary"
            disabled={isDeleting || isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </main>
  )
}