import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type EditQuadrantGroupPageProps = {
  params: Promise<{
    id: string;
    workAreaId: string;
    groupId: string;
  }>;
};

export default async function EditQuadrantGroupPage({
  params,
}: EditQuadrantGroupPageProps) {
  const { id, workAreaId, groupId } = await params;

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
      isActive: true,
    },
  });

  if (!workArea || workArea.departmentId !== department.id) {
    notFound();
  }

  const group = await prisma.quadrantGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      workAreaId: true,
      code: true,
      name: true,
      description: true,
      displayOrder: true,
      isActive: true,
    },
  });

  if (!group || group.workAreaId !== workArea.id) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link
            href={`/maestros/departamentos/${department.id}/zonas-trabajo/${workArea.id}/grupos-cuadrante`}
            className="back-link"
          >
            ← Volver a grupos de cuadrante
          </Link>
          <p className="eyebrow">
            Maestros · Departamentos · Zonas de trabajo · Grupos de cuadrante
          </p>
          <h1>Editar grupo de cuadrante</h1>
          <p className="page-description">
            Modificamos el grupo <strong>{group.name}</strong> dentro de la zona{" "}
            <strong>{workArea.name}</strong>.
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
            <span className="field-label">Zona de trabajo</span>
            <strong>{workArea.name}</strong>
          </div>

          <div>
            <span className="field-label">Estado zona</span>
            <span className={workArea.isActive ? "status-chip active" : "status-chip inactive"}>
              {workArea.isActive ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <form
          className="form-grid"
          action={`/api/maestros/grupos-cuadrante/${group.id}`}
          method="post"
        >
          <input type="hidden" name="_method" value="PATCH" />

          <div className="form-field">
            <label htmlFor="code">Código</label>
            <input
              id="code"
              name="code"
              type="text"
              defaultValue={group.code}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={group.name}
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
              defaultValue={group.displayOrder}
              required
            />
          </div>

          <div className="form-field form-field-checkbox">
            <label htmlFor="isActive">Activo</label>
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={group.isActive}
              value="true"
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={group.description ?? ""}
            />
          </div>

          <div className="form-actions">
            <Link
              href={`/maestros/departamentos/${department.id}/zonas-trabajo/${workArea.id}/grupos-cuadrante`}
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
          action={`/api/maestros/grupos-cuadrante/${group.id}`}
          method="post"
          className="danger-zone"
        >
          <input type="hidden" name="_method" value="DELETE" />

          <button type="submit" className="button button-danger">
            Eliminar grupo de cuadrante
          </button>
        </form>
      </section>
    </main>
  );
}