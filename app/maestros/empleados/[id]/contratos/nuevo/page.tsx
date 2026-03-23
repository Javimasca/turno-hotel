import { headers } from "next/headers";
import ContratoForm from "@/components/contratos/ContratoForm";

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

async function getJobCategories() {
  const baseUrl = await getBaseUrl();

  const res = await fetch(`${baseUrl}/api/maestros/categorias-profesionales`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export default async function NuevoContratoPage({ params }: Props) {
  const { id } = await params;
  const jobCategories = await getJobCategories();

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header-content">
          <span className="page-eyebrow">Empleado</span>
          <h1>Nuevo contrato</h1>
          <p className="page-description">
            Registramos una nueva situación laboral para el empleado.
          </p>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-header">
          <h2 className="form-section-title">Datos del contrato</h2>
          <p className="form-section-text">
            Completamos la información laboral y las fechas de vigencia.
          </p>
        </div>

        <div className="form-section-body">
          <ContratoForm
            employeeId={id}
            mode="create"
            jobCategories={jobCategories}
          />
        </div>
      </div>
    </div>
  );
}