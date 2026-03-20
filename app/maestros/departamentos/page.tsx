import Link from "next/link";

import { prisma } from "@/lib/prisma";

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isActive: true,
      workplace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros" className="back-link">
            ← Volver a maestros
          </Link>
          <p className="eyebrow">Maestros · Departamentos</p>
          <h1>Departamentos</h1>
          <p className="page-description">
            Gestionamos los departamentos del sistema. Desde cada uno podremos
            definir sus zonas de trabajo y la estructura del cuadrante.
          </p>
        </div>

        <div className="page-header-actions">
          <Link href="/maestros/departamentos/nuevo" className="button button-primary">
            Nuevo departamento
          </Link>
        </div>
      </section>

      <section className="card">
        {departments.length === 0 ? (
          <div className="empty-state">
            <h3>No hay departamentos</h3>
            <p>
              Primero necesitamos crear departamentos para poder definir zonas
              de trabajo y cuadrantes.
            </p>
            <Link href="/maestros/departamentos/nuevo" className="button button-primary">
              Crear primer departamento
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Hotel</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th className="actions-column">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.id}>
                    <td>{department.code}</td>
                    <td>{department.name}</td>
                    <td>{department.workplace.name}</td>
                    <td>{department.description || "—"}</td>
                    <td>
                      <span
                        className={
                          department.isActive ? "status-chip active" : "status-chip inactive"
                        }
                      >
                        {department.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <Link
                        href={`/maestros/departamentos/${department.id}/zonas-trabajo`}
                        className="button button-primary"
                      >
                        Zonas
                      </Link>

                      <Link
                        href={`/maestros/departamentos/${department.id}/editar`}
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