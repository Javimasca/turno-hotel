import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    include: {
      directManager: {
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
        },
      },
      employeeWorkplaces: {
        include: {
          workplace: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: {
          workplace: {
            name: "asc",
          },
        },
      },
      employeeDepartments: {
        include: {
          department: {
            select: {
              id: true,
              code: true,
              name: true,
              workplace: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          department: {
            name: "asc",
          },
        },
      },
      employeeContracts: {
        include: {
          jobCategory: {
            select: {
              id: true,
              code: true,
              name: true,
              shortName: true,
            },
          },
        },
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros" className="back-link">
            ← Volver a maestros
          </Link>
          <p className="eyebrow">Maestros · Empleados</p>
          <h1>Empleados</h1>
          <p className="page-description">
            Gestionamos la ficha base de cada trabajador y su contexto
            organizativo dentro del hotel.
          </p>
        </div>

        <div className="page-actions">
          <Link
            href="/maestros/empleados/nuevo"
            className="button button-primary"
          >
            Nuevo empleado
          </Link>
        </div>
      </section>

      <section className="card">
        {employees.length === 0 ? (
          <div className="empty-state">
            <h3>No hay empleados todavía</h3>
            <p>
              Empezamos creando la primera ficha de empleado para poder
              construir después contratos, asignaciones y turnos.
            </p>
            <Link
              href="/maestros/empleados/nuevo"
              className="button button-primary"
            >
              Crear primer empleado
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Empleado</th>
                  <th>Responsable</th>
                  <th>Centros</th>
                  <th>Departamentos</th>
                  <th>Contrato actual</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const today = new Date();

                  const currentContract = employee.employeeContracts.find(
                    (contract) => {
                      const startsOk = contract.startDate <= today;
                      const endsOk =
                        contract.endDate === null || contract.endDate >= today;

                      return startsOk && endsOk;
                    },
                  );

                  const managerName = employee.directManager
                    ? `${employee.directManager.firstName} ${employee.directManager.lastName}`
                    : "—";

                  const workplaces =
                    employee.employeeWorkplaces.length > 0
                      ? employee.employeeWorkplaces.map(
                          (item) => item.workplace.name,
                        )
                      : [];

                  const departments =
                    employee.employeeDepartments.length > 0
                      ? employee.employeeDepartments.map(
                          (item) =>
                            `${item.department.name} · ${item.department.workplace.name}`,
                        )
                      : [];

                  const fullName = `${employee.firstName} ${employee.lastName}`;
                  const initials = `${employee.firstName.trim().charAt(0)}${employee.lastName
                    .trim()
                    .charAt(0)}`
                    .toUpperCase()
                    .trim();
                  const isOperationallyActive =
                    employee.isActive && Boolean(currentContract);

                  return (
                    <tr key={employee.id}>
                      <td>{employee.code}</td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                          }}
                        >
                          {employee.photoUrl ? (
                            <img
                              src={employee.photoUrl}
                              alt={`Foto de ${fullName}`}
                              style={{
                                width: "72px",
                                height: "72px",
                                borderRadius: "9999px",
                                objectFit: "cover",
                                border: "1px solid #d1d5db",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "72px",
                                height: "72px",
                                borderRadius: "9999px",
                                border: "1px solid #d1d5db",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.125rem",
                                fontWeight: 700,
                                backgroundColor: "#f8fafc",
                                color: "#334155",
                                flexShrink: 0,
                              }}
                            >
                              {initials || "EM"}
                            </div>
                          )}

                          <div>
                            <strong>{fullName}</strong>
                            {employee.email ? <div>{employee.email}</div> : null}
                          </div>
                        </div>
                      </td>

                      <td>{managerName}</td>

                      <td>
                        {workplaces.length > 0 ? (
                          <div className="stacked-list">
                            {workplaces.map((name) => (
                              <span key={name}>{name}</span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {departments.length > 0 ? (
                          <div className="stacked-list">
                            {departments.map((name) => (
                              <span key={name}>{name}</span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {currentContract ? (
                          <div>
                            <strong>
                              {currentContract.jobCategory.shortName ||
                                currentContract.jobCategory.name}
                            </strong>
                            <div>{currentContract.contractType}</div>
                          </div>
                        ) : (
                          "Sin contrato vigente"
                        )}
                      </td>

                      <td>
                        <span
                          className={`status-chip ${
                            isOperationallyActive ? "active" : "inactive"
                          }`}
                        >
                          {isOperationallyActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="actions-cell">
                        <Link
                          href={`/maestros/empleados/${employee.id}/editar`}
                          className="button button-secondary"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}