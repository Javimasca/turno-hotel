'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

type Props = {
  params: Promise<{ id: string }>
}

type FormState = {
  code: string
  firstName: string
  lastName: string
  email: string
  phone: string
  directManagerEmployeeId: string
  isActive: string
}

type EmployeeResponse = {
  id: string
  code: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  directManagerEmployeeId: string | null
  isActive: boolean
}

type Manager = {
  id: string
  code: string
  firstName: string
  lastName: string
}

export default function EditEmployeePage({ params }: Props) {
  const router = useRouter()

  const [employeeId, setEmployeeId] = useState<string>('')

  const [form, setForm] = useState<FormState>({
    code: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    directManagerEmployeeId: '',
    isActive: 'true',
  })

  const [managers, setManagers] = useState<Manager[]>([])

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

        setEmployeeId(resolved.id)

        const [employeeRes, managersRes] = await Promise.all([
          fetch(`/api/maestros/empleados/${resolved.id}`, { cache: 'no-store' }),
          fetch(`/api/maestros/empleados?isActive=true`, { cache: 'no-store' }),
        ])

        const employeeJson = await employeeRes.json()
        const managersJson = await managersRes.json()

        if (!employeeRes.ok) {
          setErrorMessage(employeeJson.error ?? 'No se pudo cargar el empleado.')
          setIsLoading(false)
          return
        }

        if (!isMounted) return

        setForm({
          code: employeeJson.code,
          firstName: employeeJson.firstName,
          lastName: employeeJson.lastName,
          email: employeeJson.email ?? '',
          phone: employeeJson.phone ?? '',
          directManagerEmployeeId: employeeJson.directManagerEmployeeId ?? '',
          isActive: employeeJson.isActive ? 'true' : 'false',
        })

        setManagers(Array.isArray(managersJson) ? managersJson : [])

        setIsLoading(false)
      } catch {
        if (!isMounted) return
        setErrorMessage('Error al cargar el empleado.')
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

    if (!employeeId) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/maestros/empleados/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          directManagerEmployeeId: form.directManagerEmployeeId || null,
          isActive: form.isActive === 'true',
        }),
      })

      const json = await response.json()

      if (!response.ok) {
        setErrorMessage(json.error ?? 'Error al guardar.')
        return
      }

      router.push('/maestros/empleados')
      router.refresh()
    } catch {
      setErrorMessage('Error inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!employeeId) return

    const confirmed = window.confirm(
      '¿Seguro que queremos eliminar este empleado?',
    )

    if (!confirmed) return

    setErrorMessage(null)
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/maestros/empleados/${employeeId}`, {
        method: 'DELETE',
      })

      const json = await response.json()

      if (!response.ok) {
        setErrorMessage(json.error ?? 'No se pudo eliminar.')
        return
      }

      router.push('/maestros/empleados')
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
        <p>Cargando empleado...</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros/empleados" className="back-link">
            ← Volver a empleados
          </Link>

          <p className="eyebrow">Maestros · Empleados</p>

          <h1>Editar empleado</h1>
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
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Apellidos</label>
                <input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Teléfono</label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Jefe inmediato</label>
                <select
                  value={form.directManagerEmployeeId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      directManagerEmployeeId: e.target.value,
                    }))
                  }
                >
                  <option value="">Sin asignar</option>
                  {managers
                    .filter((manager) => manager.id !== employeeId)
                    .map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName} · {manager.code}
                      </option>
                    ))}
                </select>
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
            href={`/maestros/empleados/${employeeId}/contratos`}
            className="button"
          >
            Ver contratos
          </Link>

          <Link href="/maestros/empleados" className="button button-secondary">
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