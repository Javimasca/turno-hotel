'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type EditDepartmentJobCategoryPageProps = {
  params: Promise<{
    id: string
  }>
}

type DepartmentOption = {
  id: string
  name: string
  workplaceName: string
}

type WorkAreaOption = {
  id: string
  departmentId: string
  name: string
}

type QuadrantGroupOption = {
  id: string
  workAreaId: string
  name: string
}

type JobCategoryOption = {
  id: string
  name: string
  shortName: string | null
}

type AssignmentResponse = {
  id: string
  departmentId: string
  jobCategoryId: string
  workAreaId: string
  quadrantGroupId: string
  displayOrder: number
  isActive: boolean
  department: {
    id: string
    name: string
    workplace: {
      name: string
    }
  }
  workArea: {
    id: string
    departmentId: string
    name: string
  }
  quadrantGroup: {
    id: string
    workAreaId: string
    name: string
  }
  jobCategory: {
    id: string
    name: string
    shortName: string | null
  }
}

type EditBootstrapResponse = {
  assignment: AssignmentResponse
  departments: DepartmentOption[]
  workAreas: WorkAreaOption[]
  quadrantGroups: QuadrantGroupOption[]
  jobCategories: JobCategoryOption[]
}

type FormState = {
  departmentId: string
  workAreaId: string
  quadrantGroupId: string
  jobCategoryId: string
  displayOrder: string
  isActive: string
}

export default function EditDepartmentJobCategoryPage({
  params,
}: EditDepartmentJobCategoryPageProps) {
  const router = useRouter()

  const [assignmentId, setAssignmentId] = useState('')
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [workAreas, setWorkAreas] = useState<WorkAreaOption[]>([])
  const [quadrantGroups, setQuadrantGroups] = useState<QuadrantGroupOption[]>([])
  const [jobCategories, setJobCategories] = useState<JobCategoryOption[]>([])

  const [form, setForm] = useState<FormState>({
    departmentId: '',
    workAreaId: '',
    quadrantGroupId: '',
    jobCategoryId: '',
    displayOrder: '0',
    isActive: 'true',
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadPage() {
      try {
        const resolvedParams = await params

        if (!isMounted) {
          return
        }

        setAssignmentId(resolvedParams.id)

        const [assignmentResponse, departmentsResponse, workAreasResponse, groupsResponse, categoriesResponse] =
          await Promise.all([
            fetch(`/api/maestros/asignaciones-categorias/${resolvedParams.id}`, {
              cache: 'no-store',
            }),
            fetch('/api/maestros/departamentos', { cache: 'no-store' }),
            fetch('/api/maestros/zonas-trabajo', { cache: 'no-store' }),
            fetch('/api/maestros/grupos-cuadrante', { cache: 'no-store' }),
            fetch('/api/maestros/categorias-profesionales', { cache: 'no-store' }),
          ])

        const assignmentJson = (await assignmentResponse.json()) as AssignmentResponse & {
          error?: string
        }

        const departmentsJson = (await departmentsResponse.json()) as
          | DepartmentOption[]
          | { error?: string }

        const workAreasJson = (await workAreasResponse.json()) as
          | WorkAreaOption[]
          | { error?: string }

        const groupsJson = (await groupsResponse.json()) as
          | QuadrantGroupOption[]
          | { error?: string }

        const categoriesJson = (await categoriesResponse.json()) as
          | JobCategoryOption[]
          | { error?: string }

        if (!assignmentResponse.ok) {
          if (!isMounted) {
            return
          }

          setErrorMessage(
            assignmentJson.error ?? 'No se pudo cargar la asignación.',
          )
          setIsLoading(false)
          return
        }

        if (
          !departmentsResponse.ok ||
          !Array.isArray(departmentsJson) ||
          !workAreasResponse.ok ||
          !Array.isArray(workAreasJson) ||
          !groupsResponse.ok ||
          !Array.isArray(groupsJson) ||
          !categoriesResponse.ok ||
          !Array.isArray(categoriesJson)
        ) {
          if (!isMounted) {
            return
          }

          setErrorMessage('No se pudo cargar el contexto de edición.')
          setIsLoading(false)
          return
        }

        if (!isMounted) {
          return
        }

        setDepartments(departmentsJson)
        setWorkAreas(workAreasJson)
        setQuadrantGroups(groupsJson)
        setJobCategories(categoriesJson)

        setForm({
          departmentId: assignmentJson.departmentId,
          workAreaId: assignmentJson.workAreaId,
          quadrantGroupId: assignmentJson.quadrantGroupId,
          jobCategoryId: assignmentJson.jobCategoryId,
          displayOrder: String(assignmentJson.displayOrder ?? 0),
          isActive: assignmentJson.isActive ? 'true' : 'false',
        })

        setIsLoading(false)
      } catch {
        if (!isMounted) {
          return
        }

        setErrorMessage('Se ha producido un error al cargar la asignación.')
        setIsLoading(false)
      }
    }

    loadPage()

    return () => {
      isMounted = false
    }
  }, [params])

  const availableWorkAreas = useMemo(
    () => workAreas.filter((workArea) => workArea.departmentId === form.departmentId),
    [workAreas, form.departmentId],
  )

  const availableQuadrantGroups = useMemo(
    () =>
      quadrantGroups.filter(
        (quadrantGroup) => quadrantGroup.workAreaId === form.workAreaId,
      ),
    [quadrantGroups, form.workAreaId],
  )

  function handleDepartmentChange(departmentId: string) {
    setForm((current) => ({
      ...current,
      departmentId,
      workAreaId: '',
      quadrantGroupId: '',
    }))
  }

  function handleWorkAreaChange(workAreaId: string) {
    setForm((current) => ({
      ...current,
      workAreaId,
      quadrantGroupId: '',
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!assignmentId) {
      setErrorMessage('No se ha podido identificar la asignación.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/maestros/asignaciones-categorias/${assignmentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            departmentId: form.departmentId,
            workAreaId: form.workAreaId,
            quadrantGroupId: form.quadrantGroupId,
            jobCategoryId: form.jobCategoryId,
            displayOrder: Number(form.displayOrder),
            isActive: form.isActive === 'true',
          }),
        },
      )

      const json = (await response.json()) as { error?: string }

      if (!response.ok) {
        setErrorMessage(json.error ?? 'No se pudo actualizar la asignación.')
        return
      }

      router.push('/maestros/asignaciones-categorias')
      router.refresh()
    } catch {
      setErrorMessage('Se ha producido un error inesperado al guardar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!assignmentId) {
      setErrorMessage('No se ha podido identificar la asignación.')
      return
    }

    const confirmed = window.confirm(
      '¿Seguro que queremos eliminar esta asignación de categoría?',
    )

    if (!confirmed) {
      return
    }

    setErrorMessage(null)
    setIsDeleting(true)

    try {
      const response = await fetch(
        `/api/maestros/asignaciones-categorias/${assignmentId}`,
        {
          method: 'DELETE',
        },
      )

      const json = (await response.json()) as { error?: string }

      if (!response.ok) {
        setErrorMessage(json.error ?? 'No se pudo eliminar la asignación.')
        return
      }

      router.push('/maestros/asignaciones-categorias')
      router.refresh()
    } catch {
      setErrorMessage('Se ha producido un error inesperado al eliminar.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="page-header">
          <div>
            <p className="eyebrow">Maestros · Asignaciones de categorías</p>
            <h1>Editar asignación de categoría</h1>
            <p className="page-description">
              Estamos cargando la información de la asignación.
            </p>
          </div>
        </section>

        <section className="card">
          <p style={{ margin: 0 }}>Cargando asignación...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros/asignaciones-categorias" className="back-link">
            ← Volver a asignaciones de categorías
          </Link>

          <p className="eyebrow">Maestros · Asignaciones de categorías</p>

          <h1>Editar asignación de categoría</h1>

          <p className="page-description">
            Ajustamos la relación entre departamento, zona, grupo de cuadrante y
            categoría profesional.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="details-grid">
          <div>
            <span className="field-label">Departamento</span>
            <strong>
              {departments.find((department) => department.id === form.departmentId)
                ? `${departments.find((department) => department.id === form.departmentId)?.workplaceName} · ${
                    departments.find((department) => department.id === form.departmentId)?.name
                  }`
                : '—'}
            </strong>
          </div>

          <div>
            <span className="field-label">Zona</span>
            <strong>
              {availableWorkAreas.find((workArea) => workArea.id === form.workAreaId)
                ?.name ?? '—'}
            </strong>
          </div>

          <div>
            <span className="field-label">Grupo</span>
            <strong>
              {availableQuadrantGroups.find(
                (group) => group.id === form.quadrantGroupId,
              )?.name ?? '—'}
            </strong>
          </div>

          <div>
            <span className="field-label">Categoría</span>
            <strong>
              {jobCategories.find((category) => category.id === form.jobCategoryId)
                ?.name ?? '—'}
            </strong>
          </div>
        </div>
      </section>

      <form className="form-layout" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Contexto operativo</h2>
            <p className="form-section-text">
              Definimos el encaje exacto de esta categoría en la operación real.
            </p>
          </div>

          <div className="form-section-body">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="departmentId">Departamento</label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={form.departmentId}
                  onChange={(event) => handleDepartmentChange(event.target.value)}
                  disabled={isSubmitting || isDeleting}
                >
                  <option value="">Selecciona un departamento</option>

                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.workplaceName} · {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="workAreaId">Zona de trabajo</label>
                <select
                  id="workAreaId"
                  name="workAreaId"
                  value={form.workAreaId}
                  onChange={(event) => handleWorkAreaChange(event.target.value)}
                  disabled={isSubmitting || isDeleting || !form.departmentId}
                >
                  <option value="">
                    {form.departmentId
                      ? 'Selecciona una zona'
                      : 'Primero selecciona un departamento'}
                  </option>

                  {availableWorkAreas.map((workArea) => (
                    <option key={workArea.id} value={workArea.id}>
                      {workArea.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="quadrantGroupId">Grupo de cuadrante</label>
                <select
                  id="quadrantGroupId"
                  name="quadrantGroupId"
                  value={form.quadrantGroupId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quadrantGroupId: event.target.value,
                    }))
                  }
                  disabled={isSubmitting || isDeleting || !form.workAreaId}
                >
                  <option value="">
                    {form.workAreaId
                      ? 'Selecciona un grupo'
                      : 'Primero selecciona una zona'}
                  </option>

                  {availableQuadrantGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="jobCategoryId">Categoría profesional</label>
                <select
                  id="jobCategoryId"
                  name="jobCategoryId"
                  value={form.jobCategoryId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      jobCategoryId: event.target.value,
                    }))
                  }
                  disabled={isSubmitting || isDeleting}
                >
                  <option value="">Selecciona una categoría</option>

                  {jobCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {category.shortName ? ` · ${category.shortName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="displayOrder">Orden</label>
                <input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  min={0}
                  value={form.displayOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      displayOrder: event.target.value,
                    }))
                  }
                  disabled={isSubmitting || isDeleting}
                />
              </div>

              <div className="form-field">
                <label htmlFor="isActive">Estado</label>
                <select
                  id="isActive"
                  name="isActive"
                  value={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.value,
                    }))
                  }
                  disabled={isSubmitting || isDeleting}
                >
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <section className="form-section">
            <div className="form-section-body">
              <span className="status-chip inactive">error</span>
              <p style={{ margin: '12px 0 0' }}>{errorMessage}</p>
            </div>
          </section>
        )}

        <div className="page-actions">
          <Link
            href="/maestros/asignaciones-categorias"
            className="button button-secondary"
          >
            Cancelar
          </Link>

          <button
            type="button"
            className="button button-danger"
            onClick={handleDelete}
            disabled={isSubmitting || isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>

          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting || isDeleting}
          >
            {isSubmitting ? 'Guardando cambios...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </main>
  )
}