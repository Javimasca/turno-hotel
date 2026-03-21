
import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeContractsPage({ params }: Props) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  if (!employee) {
    return (
      <main className="page-shell">
        <section className="card">
          <div className="empty-state">
            <h3>Empleado no encontrado</h3>
            <Link href="/maestros/empleados" className="button button-primary">
              Volver a empleados
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const contracts = await prisma.employeeContract.findMany({
    where: { employeeId: id },
    include: {
      jobCategory: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      },
    },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const today = new Date();

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link
            href={`/maestros/empleados/${employee.id}/editar`}
            className="back-link"
          >
            ← Volver a empleado
          </Link>

          <p className="eyebrow">Maestros · Empleados · Contratos</p>

          <h1>Contratos</h1>

          <p className="page-description">
            Gestionamos el histórico contractual de{" "}
            <strong>{fullName}</strong>.
          </p>
        </div>

        <div className="page-actions">
          <Link
            href={`/maestros/empleados/${employee.id}/contratos/nuevo`}
            className="button button-primary"
          >
            Nuevo contrato
          </Link>
        </div>
      </section>

      <section className="card">
        {contracts.length === 0 ? (
          <div className="empty-state">
            <h3>Sin contratos</h3>
            <p>
              Este empleado todavía no tiene contratos registrados. Añadimos el
              primero para empezar a trabajar con su historial laboral.
            </p>
            <Link
              href={`/maestros/empleados/${employee.id}/contratos/nuevo`}
              className="button button-primary"
            >
              Crear contrato
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Horas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const isActive =
                    contract.startDate <= today &&
                    (!contract.endDate || contract.endDate >= today);

                  return (
                    <tr key={contract.id}>
                      <td>
                        {contract.jobCategory.shortName ||
                          contract.jobCategory.name}
                      </td>

                      <td>{contract.contractType}</td>

                      <td>
                        {new Date(contract.startDate).toLocaleDateString()}
                      </td>

                      <td>
                        {contract.endDate
                          ? new Date(contract.endDate).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        {contract.weeklyHours
                          ? `${contract.weeklyHours}h/sem`
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`status-chip ${
                            isActive ? "active" : "inactive"
                          }`}
                        >
                          {isActive ? "Vigente" : "Finalizado"}
                        </span>
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