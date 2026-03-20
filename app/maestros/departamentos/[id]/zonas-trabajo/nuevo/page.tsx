import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type NewDepartmentWorkAreaPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewDepartmentWorkAreaPage({
  params,
}: NewDepartmentWorkAreaPageProps) {
  const { id } = await params;

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
          <h1>Nueva zona de trabajo</h1>
          <p className="page-description">
            Creamos una nueva zona operativa dentro del departamento{" "}
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
          action={`/api/maestros/zonas-trabajo`}
          method="post"
        >
          <input type="hidden" name="departmentId" value={department.id} />

          <div className="form-field">
            <label htmlFor="code">Código</label>
            <input
              id="code"
              name="code"
              type="text"
              placeholder="Ej. BUFFET"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ej. Buffet"
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

          <div className="form-field form-field-full">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe brevemente el propósito operativo de esta zona."
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
              Guardar zona de trabajo
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}