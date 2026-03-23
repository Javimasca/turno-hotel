'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Props = {
  params: Promise<{ id: string }>
}

type FormState = {
  code: string
  firstName: string
  lastName: string
  email: string
  phone: string
  photoUrl: string
  directManagerEmployeeId: string
  workplaceId: string
  departmentId: string
  isActive: string
}

type EmployeeResponse = {
  id: string
  code: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  photoUrl?: string | null
  directManagerEmployeeId: string | null
  isActive: boolean
  employeeWorkplaces?: Array<{
    workplaceId: string
    workplace: {
      id: string
      code: string
      name: string
    }
  }>
  employeeDepartments?: Array<{
    departmentId: string
    department: {
      id: string
      code: string
      name: string
      workplace?: {
        id: string
        name: string
      }
    }
  }>
}

type ErrorResponse = {
  error?: string
}

type Manager = {
  id: string
  code: string
  firstName: string
  lastName: string
}

type Workplace = {
  id: string
  code: string
  name: string
}

type Department = {
  id: string
  code: string
  name: string
  workplace?: {
    id: string
    name: string
  }
}

type WorkplacesApiResponse =
  | Workplace[]
  | {
      data?: Workplace[]
    }

function isEmployeeResponse(value: unknown): value is EmployeeResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  return (
    'id' in value &&
    'code' in value &&
    'firstName' in value &&
    'lastName' in value &&
    'isActive' in value
  )
}

function extractErrorMessage(value: unknown, fallback: string) {
  if (
    value &&
    typeof value === 'object' &&
    'error' in value &&
    typeof value.error === 'string' &&
    value.error.trim().length > 0
  ) {
    return value.error
  }

  return fallback
}

function normalizeWorkplacesResponse(value: WorkplacesApiResponse): Workplace[] {
  if (Array.isArray(value)) {
    return value
  }

  if (value && Array.isArray(value.data)) {
    return value.data
  }

  return []
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
    photoUrl: '',
    directManagerEmployeeId: '',
    workplaceId: '',
    departmentId: '',
    isActive: 'true',
  })

  const [managers, setManagers] = useState<Manager[]>([])
  const [workplaces, setWorkplaces] = useState<Workplace[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const resolved = await params

        if (!isMounted) return

        setEmployeeId(resolved.id)
        setErrorMessage(null)

        const employeeRes = await fetch(`/api/maestros/empleados/${resolved.id}`, {
          cache: 'no-store',
        })

        const employeeJson: EmployeeResponse | ErrorResponse =
          await employeeRes.json()

        if (!employeeRes.ok || !isEmployeeResponse(employeeJson)) {
          if (!isMounted) return

          setErrorMessage(
            extractErrorMessage(
              employeeJson,
              'No se pudo cargar el empleado.',
            ),
          )
          setIsLoading(false)
          return
        }

        const [managersResult, workplacesResult, departmentsResult] =
          await Promise.allSettled([
            fetch('/api/maestros/empleados?isActive=true', {
              cache: 'no-store',
            }).then(async (response) => {
              const json = await response.json().catch(() => [])

              if (!response.ok) {
                return []
              }

              return Array.isArray(json) ? json : []
            }),
            fetch('/api/maestros/workplaces?isActive=true', {
              cache: 'no-store',
            }).then(async (response) => {
              const json: WorkplacesApiResponse = await response
                .json()
                .catch(() => ({ data: [] }))

              if (!response.ok) {
                return []
              }

              return normalizeWorkplacesResponse(json)
            }),
            fetch('/api/maestros/departamentos?isActive=true', {
              cache: 'no-store',
            }).then(async (response) => {
              const json = await response.json().catch(() => [])

              if (!response.ok) {
                return []
              }

              return Array.isArray(json) ? json : []
            }),
          ])

        if (!isMounted) return

        setForm({
          code: employeeJson.code,
          firstName: employeeJson.firstName,
          lastName: employeeJson.lastName,
          email: employeeJson.email ?? '',
          phone: employeeJson.phone ?? '',
          photoUrl: employeeJson.photoUrl ?? '',
          directManagerEmployeeId: employeeJson.directManagerEmployeeId ?? '',
          workplaceId: employeeJson.employeeWorkplaces?.[0]?.workplaceId ?? '',
          departmentId: employeeJson.employeeDepartments?.[0]?.departmentId ?? '',
          isActive: employeeJson.isActive ? 'true' : 'false',
        })

        setManagers(
          managersResult.status === 'fulfilled' ? managersResult.value : [],
        )
        setWorkplaces(
          workplacesResult.status === 'fulfilled' ? workplacesResult.value : [],
        )
        setDepartments(
          departmentsResult.status === 'fulfilled'
            ? departmentsResult.value
            : [],
        )

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

  const employeeInitials = useMemo(() => {
    const firstInitial = form.firstName.trim().charAt(0)
    const lastInitial = form.lastName.trim().charAt(0)
    const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase()

    return initials || 'EM'
  }, [form.firstName, form.lastName])

  const filteredDepartments = form.workplaceId
    ? departments.filter(
        (department) => department.workplace?.id === form.workplaceId,
      )
    : departments

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
          workplaceId: form.workplaceId || null,
          departmentId: form.departmentId || null,
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

  async function handlePhotoUpload() {
    if (!employeeId) return

    if (!selectedPhoto) {
      setErrorMessage('Debemos seleccionar una imagen antes de subirla.')
      return
    }

    setErrorMessage(null)
    setIsUploadingPhoto(true)

    try {
      const body = new FormData()
      body.append('file', selectedPhoto)

      const response = await fetch(
        `/api/maestros/empleados/${employeeId}/foto`,
        {
          method: 'POST',
          body,
        },
      )

      const json = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(json?.error ?? 'No se pudo subir la foto.')
        return
      }

      setForm((current) => ({
        ...current,
        photoUrl: json?.photoUrl ?? current.photoUrl,
      }))
      setSelectedPhoto(null)
      router.refresh()
    } catch {
      setErrorMessage('Error inesperado al subir la foto.')
    } finally {
      setIsUploadingPhoto(false)
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
            <div
              className="card"
              style={{
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt={`Foto de ${form.firstName} ${form.lastName}`}
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '9999px',
                      objectFit: 'cover',
                      border: '1px solid #d1d5db',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '9999px',
                      border: '1px solid #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      backgroundColor: '#f8fafc',
                      color: '#334155',
                      flexShrink: 0,
                    }}
                  >
                    {employeeInitials}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    minWidth: '260px',
                    flex: 1,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                      }}
                    >
                      Foto del empleado
                    </h3>

                    <p
                      style={{
                        margin: '0.35rem 0 0 0',
                        color: '#64748b',
                      }}
                    >
                      Podemos subir una imagen y dejarla asociada a la ficha.
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setSelectedPhoto(file)
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={handlePhotoUpload}
                      disabled={isUploadingPhoto || isSubmitting || isDeleting}
                    >
                      {isUploadingPhoto ? 'Subiendo foto...' : 'Subir foto'}
                    </button>

                    {selectedPhoto ? (
                      <span
                        style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                        }}
                      >
                        Archivo seleccionado: {selectedPhoto.name}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

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

              <div className="form-field">
                <label>Hotel / centro</label>
                <select
                  value={form.workplaceId}
                  onChange={(e) => {
                    const nextWorkplaceId = e.target.value

                    setForm((f) => {
                      const nextDepartments = nextWorkplaceId
                        ? departments.filter(
                            (department) =>
                              department.workplace?.id === nextWorkplaceId,
                          )
                        : departments

                      const keepDepartment = nextDepartments.some(
                        (department) => department.id === f.departmentId,
                      )

                      return {
                        ...f,
                        workplaceId: nextWorkplaceId,
                        departmentId: keepDepartment ? f.departmentId : '',
                      }
                    })
                  }}
                >
                  <option value="">Sin asignar</option>
                  {workplaces.map((workplace) => (
                    <option key={workplace.id} value={workplace.id}>
                      {workplace.name} · {workplace.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Departamento</label>
                <select
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      departmentId: e.target.value,
                    }))
                  }
                >
                  <option value="">Sin asignar</option>
                  {filteredDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                      {department.workplace?.name
                        ? ` · ${department.workplace.name}`
                        : ''}
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
            className="button button-secondary"
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
            disabled={isDeleting || isSubmitting || isUploadingPhoto}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>

          <button
            type="submit"
            className="button button-primary"
            disabled={isDeleting || isSubmitting || isUploadingPhoto}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </main>
  )
}