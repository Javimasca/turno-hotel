import Link from "next/link";
import { headers } from "next/headers";
import ContratoActions from "@/components/contratos/ContratoActions";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  return `${protocol}://${host}`;
}

async function getContratos(employeeId: string) {
  const baseUrl = await getBaseUrl();

  const res = await fetch(
    `${baseUrl}/api/maestros/empleados/${employeeId}/contratos`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) return [];

  return res.json();
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("es-ES");
}

export default async function ContratosPage({ params }: Props) {
  const { id } = await params;
  const contratos = await getContratos(id);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Contratos</h1>
          <p className="page-description">Histórico laboral del empleado</p>
        </div>

        <div className="page-actions">
          <Link
            href={`/maestros/empleados/${id}/contratos/nuevo`}
            className="button button-primary"
          >
            Nuevo contrato
          </Link>
        </div>
      </div>

      {contratos.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No hay contratos</h3>
          <p className="empty-state-text">
            Este empleado todavía no tiene contratos registrados.
          </p>
          <Link
            href={`/maestros/empleados/${id}/contratos/nuevo`}
            className="button button-primary"
          >
            Crear primer contrato
          </Link>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th className="actions-column">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {contratos.map((contrato: any) => (
                <tr key={contrato.id}>
                  <td>{contrato.jobCategory?.name || "-"}</td>
                  <td>{contrato.contractType}</td>
                  <td>{formatDate(contrato.startDate)}</td>
                  <td>{formatDate(contrato.endDate)}</td>
                  <td>
                    <div className="actions-cell">
                      <ContratoActions
                        employeeId={id}
                        contractId={contrato.id}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}