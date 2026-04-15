import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/auth-session";

export const dynamic = "force-dynamic";

function getUserRoleLabel(role: "ADMIN" | "MANAGER" | "EMPLOYEE") {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "EMPLOYEE":
      return "Employee";
    default:
      return role;
  }
}

function getSubordinatesLabel(count: number) {
  if (count === 0) return "Sin subordinados";
  if (count === 1) return "1 subordinado";
  return `${count} subordinados`;
}

export default async function EmployeesPage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!currentUser.isActive) {
    return (
      <main className="page-shell">
        <section className="page-header">
          <div>
            <Link href="/" className="back-link">
              ← Volver al inicio
            </Link>
            <p className="eyebrow">Maestros · Empleados</p>
            <h1>Empleados</h1>
            <p className="page-description">
              Gestionamos la ficha base de cada trabajador y su contexto
              organizativo dentro del hotel.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="empty-state">
            <h3>Acceso no disponible</h3>
            <p>Tu usuario está inactivo y no puede acceder a esta sección.</p>
          </div>
        </section>
      </main>
    );
  }

  if (currentUser.role === "EMPLOYEE") {
    return (
      <main className="page-shell">
        <section className="page-header">
          <div>
            <Link href="/" className="back-link">
              ← Volver al inicio
            </Link>
            <p className="eyebrow">Maestros · Empleados</p>
            <h1>Empleados</h1>
            <p className="page-description">
              Gestionamos la ficha base de cada trabajador y su contexto
              organizativo dentro del hotel.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="empty-state">
            <h3>Sin permisos suficientes</h3>
            <p>
              Tu perfil no puede acceder al listado maestro de empleados.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // 🔒 FILTRO POR ROL (CLAVE)
  const employeeWhere =
    currentUser.role === "ADMIN"
      ? undefined
      : {
          OR: [
            { id: currentUser.employeeId ?? "__no_employee__" },
            {
              directManagerEmployeeId:
                currentUser.employeeId ?? "__no_employee__",
            },
          ],
        };

  const employees = await prisma.employee.findMany({
    where: employeeWhere,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
      directManager: {
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
        },
      },
      subordinates: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
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

      {currentUser.role === "MANAGER" ? (
        <section className="card" style={{ marginBottom: "1rem" }}>
          <div className="empty-state" style={{ alignItems: "flex-start" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Vista de manager</h3>
            <p style={{ margin: 0 }}>
              Estás viendo tu propia ficha y la de tus subordinados directos.
            </p>
          </div>
        </section>
      ) : null}

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
                  <th>Usuario</th>
                  <th>Responsable</th>
                  <th>Equipo</th>
                  <th>Centros</th>
                  <th>Departamentos</th>
                  <th>Contrato actual</th>
                  <th>Estado</th>
                  <th />
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
                    }
                  );

                  const managerName = employee.directManager
                    ? `${employee.directManager.firstName} ${employee.directManager.lastName}`
                    : "—";

                  const workplaces = employee.employeeWorkplaces.map(
                    (item) => item.workplace.name
                  );

                  const departments = employee.employeeDepartments.map(
                    (item) =>
                      `${item.department.name} · ${item.department.workplace.name}`
                  );

                  const fullName = `${employee.firstName} ${employee.lastName}`;
                  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();

                  const isOperationallyActive =
                    employee.isActive && Boolean(currentContract);

                  const subordinateCount = employee.subordinates.length;
                  const activeSubordinateCount =
                    employee.subordinates.filter((s) => s.isActive).length;

                  return (
                    <tr key={employee.id}>
                      <td>{employee.code}</td>

                      <td>
                        <div style={{ display: "flex", gap: "1rem" }}>
                          {employee.photoUrl ? (
                            <Image
                              src={employee.photoUrl}
                              alt={fullName}
                              width={72}
                              height={72}
                              style={{ borderRadius: "9999px" }}
                            />
                          ) : (
                            <div>{initials}</div>
                          )}
                          <div>
                            <strong>{fullName}</strong>
                          </div>
                        </div>
                      </td>

                      <td>
                        {employee.user ? (
                          <>
                            <strong>
                              {getUserRoleLabel(employee.user.role)}
                            </strong>
                            <div>{employee.user.email}</div>
                          </>
                        ) : (
                          "Sin usuario"
                        )}
                      </td>

                      <td>{managerName}</td>

                      <td>
                        <strong>
                          {getSubordinatesLabel(subordinateCount)}
                        </strong>
                        {subordinateCount > 0 && (
                          <div>{activeSubordinateCount} activos</div>
                        )}
                      </td>

                      <td>{workplaces.join(", ") || "—"}</td>
                      <td>{departments.join(", ") || "—"}</td>

                      <td>
                        {currentContract
                          ? currentContract.jobCategory.shortName ||
                            currentContract.jobCategory.name
                          : "Sin contrato"}
                      </td>

                      <td>
                        {isOperationallyActive ? "Activo" : "Inactivo"}
                      </td>

                      <td>
                        <Link
                          href={`/maestros/empleados/${employee.id}/editar`}
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