import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ContratoForm from "@/components/contratos/ContratoForm";

type Props = {
  params: Promise<{
    id: string;
    contractId: string;
  }>;
};

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  return `${protocol}://${host}`;
}

async function getContrato(id: string, contractId: string) {
  const baseUrl = await getBaseUrl();

  const res = await fetch(
    `${baseUrl}/api/maestros/empleados/${id}/contratos/${contractId}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) return null;

  return res.json();
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

export default async function EditarContratoPage({ params }: Props) {
  const { id, contractId } = await params;

  const [contrato, jobCategories] = await Promise.all([
    getContrato(id, contractId),
    getJobCategories(),
  ]);

  if (!contrato) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header-content">
          <span className="page-eyebrow">Empleado</span>
          <h1>Editar contrato</h1>
          <p className="page-description">
            Actualizamos la información laboral y la vigencia del contrato.
          </p>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-header">
          <h2 className="form-section-title">Datos del contrato</h2>
          <p className="form-section-text">
            Revisamos categoría, fechas, jornada y observaciones.
          </p>
        </div>

        <div className="form-section-body">
          <ContratoForm
            employeeId={id}
            mode="edit"
            initialData={contrato}
            jobCategories={jobCategories}
          />
        </div>
      </div>
    </div>
  );
}