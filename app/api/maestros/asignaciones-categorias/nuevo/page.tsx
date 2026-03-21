import Link from 'next/link'
import { notFound } from 'next/navigation'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type NewDepartmentJobCategoryPageProps = {
  searchParams?: Promise<{
    departmentId?: string
    workAreaId?: string
  }>
}

export default async function NewDepartmentJobCategoryPage({
  searchParams,
}: NewDepartmentJobCategoryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const selectedDepartmentId = resolvedSearchParams.departmentId?.trim() || ''
  const selectedWorkAreaId = resolvedSearchParams.workAreaId?.trim() || ''

  const [departments, jobCategories] = await Promise.all([
    prisma.department.findMany({
      include: {
        workplace: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: [{ workplace: { name: 'asc' } }, { name: 'asc' }],
    }),
    prisma.jobCategory.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    }),
  ])

  const selectedDepartment = selectedDepartmentId
    ? await prisma.department.findUnique({
        where: { id: selectedDepartmentId },
        include: {
          workplace: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          workAreas: {
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            select: {
              id: true,
              departmentId: true,
              code: true,
              name: true,
              isActive: true,
              displayOrder: true,
            },
          },
        },
      })
    : null

  if (selectedDepartmentId && !selectedDepartment) {
    notFound()
  }

  const workAreas = selectedDepartment?.workAreas ?? []

  const selectedWorkArea =
    selectedDepartment && selectedWorkAreaId
      ? workAreas.find((workArea) => workArea.id === selectedWorkAreaId) ?? null
      : null

  if (selectedDepartment && selectedWorkAreaId && !selectedWorkArea) {
    notFound()
  }

  const quadrantGroups = selectedWorkArea
    ? await prisma.quadrantGroup.findMany({
        where: {
          workAreaId: selectedWorkArea.id,
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      })
    : []

  const departmentOptions = departments.map((department) => ({
    id: department.id,
    label: `${department.workplace.name} · ${department.name}`,
  }))

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros/asignaciones-categorias" className="back-link">
            ← Volver a asignaciones de categorías
          </Link>

          <p className="eyebrow">Maestros · Asignaciones de categorías</p>

          <h1>Nueva asignación de categoría</h1>

          <p className="page-description">
            Relacionamos una categoría profesional con su contexto operativo
            real dentro del hotel: departamento, zona de trabajo y grupo de
            cuadrante.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="details-grid">
          <div>
            <span className="field-label">Paso 1</span>
            <strong>Seleccionamos departamento</strong>
          </div>

          <div>
            <span className="field-label">Paso 2</span>
            <strong>Acotamos la zona de trabajo</strong>
          </div>

          <div>
            <span className="field-label">Paso 3</span>
            <strong>Elegimos el grupo de cuadrante</strong>
          </div>

          <div>
            <span className="field-label">Paso 4</span>
            <strong>Asignamos la categoría profesional</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <form className="filters-bar" method="get">
          <div className="field-group">
            <label htmlFor="departmentId" className="field-label">
              Departamento
            </label>

            <select
              id="departmentId"
              name="departmentId"
              className="select"
              defaultValue={selectedDepartmentId}
            >
              <option value="">Selecciona un departamento</option>

              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.label}
                </option>
              ))}
            </select>
          </div>

          {selectedDepartment ? (
            <div className="field-group">
              <label htmlFor="workAreaId" className="field-label">
                Zona de trabajo
              </label>

              <select
                id="workAreaId"
                name="workAreaId"
                className="select"
                defaultValue={selectedWorkAreaId}
              >
                <option value="">Selecciona una zona</option>

                {workAreas.map((workArea) => (
                  <option key={workArea.id} value={workArea.id}>
                    {workArea.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="page-actions">
            <button type="submit" className="button button-secondary">
              Actualizar contexto
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <form
          className="form-grid"
          action="/api/maestros/asignaciones-categorias"
          method="post"
        >
          <div className="form-field">
            <label htmlFor="departmentId">Departamento</label>
            <select
              id="departmentId"
              name="departmentId"
              defaultValue={selectedDepartmentId}
              required
            >
              <option value="">Selecciona un departamento</option>

              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="workAreaId">Zona de trabajo</label>
            <select
              id="workAreaId"
              name="workAreaId"
              defaultValue={selectedWorkAreaId}
              required
              disabled={!selectedDepartment}
            >
              <option value="">
                {selectedDepartment
                  ? 'Selecciona una zona'
                  : 'Primero selecciona un departamento'}
              </option>

              {workAreas.map((workArea) => (
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
              defaultValue=""
              required
              disabled={!selectedWorkArea}
            >
              <option value="">
                {selectedWorkArea
                  ? 'Selecciona un grupo'
                  : 'Primero selecciona una zona'}
              </option>

              {quadrantGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="jobCategoryId">Categoría profesional</label>
            <select id="jobCategoryId" name="jobCategoryId" defaultValue="" required>
              <option value="">Selecciona una categoría</option>

              {jobCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
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
              defaultValue={0}
              required
            />
          </div>

          <div className="form-field form-field-checkbox">
            <label htmlFor="isActive">Activa</label>
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked
              value="true"
            />
          </div>

          <div className="form-actions">
            <Link
              href="/maestros/asignaciones-categorias"
              className="button button-secondary"
            >
              Cancelar
            </Link>

            <button type="submit" className="button button-primary">
              Guardar asignación
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}