import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type EditDepartmentWorkAreaPageProps = {
  params: Promise<{
    id: string;
    workAreaId: string;
  }>;
};

export default async function EditDepartmentWorkAreaPage({
  params,
}: EditDepartmentWorkAreaPageProps) {
  const { id, workAreaId } = await params;

  const department = await prisma.department.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
      workplace: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  const workArea = await prisma.workArea.findUnique({
    where: { id: workAreaId },
    select: {
      id: true,
      departmentId: true,
      code: true,
      name: true,
      description: true,
      displayOrder: true,
      isActive: true,
    },
  });

  if (!workArea || workArea.departmentId !== department.id) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link
            href={`/maestros/departamentos/${department.id}/zonas-trabajo`}
            className="back-link"
          >
            ← Volver a zonas de trabajo
          </Link>
          <p className="eyebrow">Maestros · Departamentos · Zonas de trabajo</p>
          <h1>Editar zona de trabajo</h1>
          <p className="page-description">
            Modificamos la zona <strong>{workArea.name}</strong> dentro del departamento{" "}
            <strong>{department.name}</strong>.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="details-grid">
          <div>
            <span className="field-label">Hotel / centro</span>
            <strong>{department.workplace.name}</strong>
          </div>

          <div>
            <span className="field-label">Departamento</span>
            <strong>{department.name}</strong>
          </div>

          <div>
            <span className="field-label">Código departamento</span>
            <strong>{department.code}</strong>
          </div>

          <div>
            <span className="field-label">Estado</span>
            <span className={department.isActive ? "status-chip active" : "status-chip inactive"}>
              {department.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <form
          className="form-grid"
          action={`/api/maestros/zonas-trabajo/${workArea.id}`}
          method="post"
        >
          <input type="hidden" name="_method" value="PATCH" />

          <div className="form-field">
            <label htmlFor="code">Código</label>
            <input
              id="code"
              name="code"
              type="text"
              defaultValue={workArea.code}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={workArea.name}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="displayOrder">Orden</label>
            <input
              id="displayOrder"
              name="displayOrder"
              type="number"
              min={0}
              defaultValue={workArea.displayOrder}
              required
            />
          </div>

          <div className="form-field form-field-checkbox">
            <label htmlFor="isActive">Activa</label>
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={workArea.isActive}
              value="true"
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={workArea.description ?? ""}
            />
          </div>

          <div className="form-actions">
            <Link
              href={`/maestros/departamentos/${department.id}/zonas-trabajo`}
              className="button button-secondary"
            >
              Cancelar
            </Link>

            <button type="submit" className="button button-primary">
              Guardar cambios
            </button>
          </div>
        </form>

        <form
          action={`/api/maestros/zonas-trabajo/${workArea.id}`}
          method="post"
          className="danger-zone"
        >
          <input type="hidden" name="_method" value="DELETE" />

          <button type="submit" className="button button-danger">
            Eliminar zona de trabajo
          </button>
        </form>
      </section>
    </main>
  );
}