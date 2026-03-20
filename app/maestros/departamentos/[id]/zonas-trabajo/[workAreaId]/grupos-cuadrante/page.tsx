import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type WorkAreaQuadrantGroupsPageProps = {
  params: Promise<{
    id: string;
    workAreaId: string;
  }>;
};

export default async function WorkAreaQuadrantGroupsPage({
  params,
}: WorkAreaQuadrantGroupsPageProps) {
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
      quadrantGroups: {
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          displayOrder: true,
          isActive: true,
        },
      },
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
          <p className="eyebrow">
            Maestros · Departamentos · Zonas de trabajo · Grupos de cuadrante
          </p>
          <h1>Grupos de cuadrante de {workArea.name}</h1>
          <p className="page-description">
            Organizamos la estructura visual del cuadrante dentro de esta zona
            operativa del departamento.
          </p>
        </div>

        <div className="page-header-actions">
          <Link
            href={`/maestros/departamentos/${department.id}/zonas-trabajo/${workArea.id}/grupos-cuadrante/nuevo`}
            className="button button-primary"
          >
            Nuevo grupo de cuadrante
          </Link>
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
        <div className="section-heading">
          <div>
            <h2>Listado de grupos</h2>
            <p>
              Cada grupo ordena visualmente el cuadrante dentro de la zona de
              trabajo actual.
            </p>
          </div>
        </div>

        {workArea.quadrantGroups.length === 0 ? (
          <div className="empty-state">
            <h3>Aún no hemos creado grupos de cuadrante</h3>
            <p>
              Empezamos definiendo los bloques de organización visual que
              necesitaremos dentro de esta zona operativa.
            </p>
            <Link
              href={`/maestros/departamentos/${department.id}/zonas-trabajo/${workArea.id}/grupos-cuadrante/nuevo`}
              className="button button-primary"
            >
              Crear primer grupo
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th className="actions-column">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workArea.quadrantGroups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.displayOrder}</td>
                    <td>{group.code}</td>
                    <td>{group.name}</td>
                    <td>{group.description || "—"}</td>
                    <td>
                      <span
                        className={
                          group.isActive ? "status-chip active" : "status-chip inactive"
                        }
                      >
                        {group.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <Link
                        href={`/maestros/departamentos/${department.id}/zonas-trabajo/${workArea.id}/grupos-cuadrante/${group.id}/editar`}
                        className="button button-secondary"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}