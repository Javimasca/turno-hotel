import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type DepartmentWorkAreasPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DepartmentWorkAreasPage({
  params,
}: DepartmentWorkAreasPageProps) {
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

  const workAreas = await prisma.workArea.findMany({
    where: {
      departmentId: id,
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      displayOrder: true,
      isActive: true,
    },
  });

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros/departamentos" className="back-link">
            ← Volver a departamentos
          </Link>
          <p className="eyebrow">Maestros · Departamentos · Zonas de trabajo</p>
          <h1>
            {department.name} <span>({department.code})</span>
          </h1>
          <p className="page-description">
            Gestionamos las zonas de trabajo del departamento dentro de{" "}
            <strong>{department.workplace.name}</strong>.
          </p>
        </div>

        <div className="page-header-actions">
          <Link
            href={`/maestros/departamentos/${department.id}/editar`}
            className="button button-secondary"
          >
            Editar departamento
          </Link>
          <Link
            href={`/maestros/departamentos/${department.id}/zonas-trabajo/nuevo`}
            className="button button-primary"
          >
            Nueva zona de trabajo
          </Link>
        </div>
      </section>

      <section className="card">
        {workAreas.length === 0 ? (
          <div className="empty-state">
            <h3>No hay zonas de trabajo</h3>
            <p>
              Todavía no hemos creado ninguna zona de trabajo para este
              departamento.
            </p>
            <Link
              href={`/maestros/departamentos/${department.id}/zonas-trabajo/nuevo`}
              className="button button-primary"
            >
              Crear primera zona
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th className="actions-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workAreas.map((workArea) => (
                  <tr key={workArea.id}>
                    <td>{workArea.displayOrder}</td>
                    <td>{workArea.code}</td>
                    <td>{workArea.name}</td>
                    <td>{workArea.description ?? "—"}</td>
                    <td>
                      <span
                        className={workArea.isActive ? "status-active" : "status-inactive"}
                      >
                        {workArea.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <Link
                        href={`/maestros/departamentos/${department.id}/zonas-trabajo/${workArea.id}/grupos-cuadrante`}
                        className="button button-secondary"
                      >
                        Grupos
                      </Link>
                      <Link
                        href={`/maestros/departamentos/${department.id}/zonas-trabajo/${workArea.id}/editar`}
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