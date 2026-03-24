import Link from "next/link";
import { headers } from "next/headers";

import OrganigramaTree from "@/components/organigrama/OrganigramaTree";
import { OrgNode as OrgNodeType } from "@/lib/employees/employee.org.service";

export const dynamic = "force-dynamic";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  return `${protocol}://${host}`;
}

async function getData(): Promise<OrgNodeType[]> {
  const baseUrl = await getBaseUrl();

  const response = await fetch(`${baseUrl}/api/organigrama`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar el organigrama.");
  }

  return response.json();
}

export default async function OrganigramaPage() {
  const nodes = await getData();

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros" className="back-link">
            ← Volver a maestros
          </Link>

          <p className="eyebrow">Maestros · Organigrama</p>

          <h1>Organigrama</h1>

          <p className="page-description">
            Visualizamos la estructura organizativa real de Horion a partir del
            jefe inmediato de cada persona.
          </p>
        </div>
      </section>

      <section
        className="card"
        style={{
          padding: "1.5rem",
          borderRadius: "24px",
          border: "1px solid rgba(29,42,71,0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
          boxShadow: "0 18px 40px rgba(18, 28, 45, 0.06)",
        }}
      >
        <div
          style={{
            marginBottom: "1.25rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "#1d2a47",
                marginBottom: "0.25rem",
              }}
            >
              Estructura organizativa Horion
            </div>

            <div
              style={{
                fontSize: "0.92rem",
                color: "#55637d",
              }}
            >
              Vista inicial por dependencia jerárquica, con foto, categoría
              vigente y centro principal.
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55rem",
              padding: "0.55rem 0.9rem",
              borderRadius: "9999px",
              background:
                "linear-gradient(90deg, rgba(29,42,71,0.95) 0%, rgba(48,74,122,0.95) 100%)",
              color: "white",
              fontWeight: 800,
              fontSize: "0.85rem",
              letterSpacing: "0.02em",
            }}
          >
            HORION
          </div>
        </div>

        {nodes.length === 0 ? (
          <div
            className="empty-state"
            style={{
              minHeight: "260px",
              borderRadius: "20px",
              border: "1px dashed rgba(29,42,71,0.18)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)",
            }}
          >
            <h3>El organigrama está vacío</h3>
            <p>
              Necesitamos empleados y relaciones de jefe inmediato para poder
              representar la estructura.
            </p>
            <Link
              href="/maestros/empleados"
              className="button button-primary"
            >
              Ir a empleados
            </Link>
          </div>
        ) : (
          <OrganigramaTree nodes={nodes} />
        )}
      </section>
    </main>
  );
}