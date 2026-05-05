"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type FrontendUserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

const mainAreas: {
  href: string;
  title: string;
  description: string;
  roles: FrontendUserRole[];
}[] = [
  {
    href: "/turnos",
    title: "Cuadrantes",
    description:
      "Vista semanal operativa para organizar turnos, ausencias y días libres del personal.",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/planificacion",
    title: "Planificación automática",
    description:
      "Genera propuestas de turnos a partir de previsión, demanda y reglas de disponibilidad.",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "maestros/empleados",
    title: "Empleados",
    description:
      "Gestiona fichas de trabajadores, categorías, antigüedad y relaciones de responsable.",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/maestros/turnos",
    title: "Maestro de turnos",
    description:
      "Configura las plantillas de turno que se usan para crear cuadrantes y propuestas.",
    roles: ["ADMIN"],
  },
  {
    href: "/maestros",
    title: "Maestros generales",
    description:
      "Administra centros, departamentos, zonas de trabajo y categorías laborales.",
    roles: ["ADMIN"],
  },
];

const highlights = [
  {
    label: "Cuadrantes",
    value: "Operación semanal",
    text: "Turnos, ausencias y días libres visibles en una única vista.",
  },
  {
    label: "Automatización",
    value: "Asignación inteligente",
    text: "Propuestas semanales basadas en demanda, áreas y disponibilidad.",
  },
  {
    label: "Disponibilidad",
    value: "Reglas reales",
    text: "Días libres y bloqueos evitan asignaciones incorrectas.",
  },
  {
    label: "Maestros",
    value: "Plantillas reutilizables",
    text: "Turnos base configurables por centro, departamento y tipo.",
  },
];

export default function HomePage() {
  const { user, isLoading: isUserLoading, error: userError } = useCurrentUser();

  const visibleMainAreas = useMemo(() => {
    if (!user || !user.isActive) return [];
    return mainAreas.filter((area) => area.roles.includes(user.role));
  }, [user]);

  const canOpenPlanner = user?.isActive === true;

  return (
    <main className="home-shell">
      <section className="hero-section">
        <div className="hero-card">
          <div className="hero-content">
            <span className="eyebrow">TurnoHotel</span>

            <h1 className="hero-title">
              Gestión hotelera de turnos,
              <br />
              cuadrantes y disponibilidad
            </h1>

            <p className="hero-text">
              Organiza equipos, turnos, ausencias y días libres desde una vista
              operativa clara, preparada para planificación manual y automática.
            </p>

            {userError ? (
              <div className="home-message error">{userError}</div>
            ) : null}

            {!isUserLoading && user?.isActive === false ? (
              <div className="home-message warning">
                Tu usuario está inactivo. No tienes acceso operativo a los módulos.
              </div>
            ) : null}

            <div className="hero-actions">
              {canOpenPlanner ? (
                <Link href="/turnos" className="button primary">
                  Abrir cuadrantes
                </Link>
              ) : null}

              {user?.isActive === true && user.role === "ADMIN" ? (
                <Link href="/maestros/turnos" className="button secondary">
                  Maestro de turnos
                </Link>
              ) : null}
            </div>
          </div>

          <div className="hero-summary">
            <div className="summary-card featured">
              <span className="summary-label">Vista principal</span>
              <strong>Cuadrante semanal</strong>
              <p>El centro de trabajo para gestionar la operación diaria.</p>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <span className="summary-label">Estado</span>
                <strong>Operativo</strong>
              </div>

              <div className="summary-card">
                <span className="summary-label">Modo</span>
                <strong>Manual + automático</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <header className="section-header">
          <span className="eyebrow">Accesos</span>
          <h2>Áreas principales</h2>
          <p>
            Entra directamente en las herramientas según los permisos de tu perfil.
          </p>
        </header>

        {isUserLoading ? (
          <div className="home-message info">Cargando accesos disponibles...</div>
        ) : visibleMainAreas.length > 0 ? (
          <div className="nav-grid">
            {visibleMainAreas.map((area) => (
              <Link key={area.href} href={area.href} className="nav-card">
                <h3>{area.title}</h3>
                <p>{area.description}</p>
                <span>Acceder →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="home-message info">
            No hay áreas disponibles para tu perfil en esta pantalla.
          </div>
        )}
      </section>

      <section className="content-section">
        <header className="section-header">
          <span className="eyebrow">Sistema</span>
          <h2>Base operativa del producto</h2>
          <p>
            TurnoHotel separa configuración, personas y operación para mantener
            una planificación clara y escalable.
          </p>
        </header>

        <div className="kpi-grid">
          {highlights.map((item) => (
            <article key={item.label} className="kpi-card">
              <p className="kpi-label">{item.label}</p>
              <p className="kpi-value">{item.value}</p>
              <p className="kpi-text">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .home-shell {
          min-height: 100%;
          background: #f6f8fc;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .hero-section,
        .content-section {
          max-width: 1180px;
          width: 100%;
          margin: 0 auto;
        }

        .hero-card {
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(183, 121, 31, 0.16), transparent 34%),
            linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
          padding: 34px;
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.8fr);
          gap: 28px;
          align-items: stretch;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .eyebrow {
          display: inline-flex;
          width: fit-content;
          margin-bottom: 10px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #b7791f;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(32px, 5vw, 56px);
          line-height: 1;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.04em;
        }

        .hero-text {
          max-width: 680px;
          margin: 18px 0 0;
          font-size: 16px;
          line-height: 1.65;
          color: #475569;
        }

        .hero-actions {
          margin-top: 26px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            opacity 0.15s ease;
        }

        .button:hover {
          transform: translateY(-1px);
        }

        .button.primary {
          background: #b7791f;
          color: #ffffff;
          box-shadow: 0 10px 22px rgba(183, 121, 31, 0.22);
        }

        .button.secondary {
          background: #0f172a;
          color: #ffffff;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.18);
        }

        .hero-summary {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .summary-card {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.82);
          padding: 16px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
        }

        .summary-card.featured {
          min-height: 170px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.9)),
            #0f172a;
          color: white;
        }

        .summary-label {
          display: block;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .summary-card strong {
          display: block;
          font-size: 22px;
          line-height: 1.1;
          color: inherit;
        }

        .summary-card p {
          margin: 10px 0 0;
          font-size: 13px;
          line-height: 1.45;
          color: #cbd5e1;
        }

        .content-section {
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          background: white;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
          padding: 24px;
        }

        .section-header {
          margin-bottom: 18px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        .section-header p {
          max-width: 680px;
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.55;
        }

        .nav-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .nav-card {
          min-height: 170px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #ffffff;
          padding: 16px;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition:
            transform 0.15s ease,
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }

        .nav-card:hover {
          transform: translateY(-2px);
          border-color: #d6a354;
          background: #fffaf2;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }

        .nav-card h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
        }

        .nav-card p {
          flex: 1;
          margin: 10px 0 16px;
          font-size: 13px;
          line-height: 1.45;
          color: #64748b;
        }

        .nav-card span {
          font-size: 13px;
          font-weight: 900;
          color: #b7791f;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .kpi-card {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #f8fafc;
          padding: 16px;
        }

        .kpi-label {
          margin: 0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
        }

        .kpi-value {
          margin: 8px 0 0;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
        }

        .kpi-text {
          margin: 8px 0 0;
          font-size: 13px;
          line-height: 1.45;
          color: #64748b;
        }

        .home-message {
          margin-top: 16px;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
        }

        .home-message.info {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #334155;
        }

        .home-message.warning {
          border: 1px solid #fde68a;
          background: #fffbeb;
          color: #92400e;
        }

        .home-message.error {
          border: 1px solid #fecaca;
          background: #fff7f7;
          color: #991b1b;
        }

        @media (max-width: 1100px) {
          .hero-card {
            grid-template-columns: 1fr;
          }

          .nav-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .home-shell {
            padding: 12px;
          }

          .hero-card,
          .content-section {
            padding: 20px;
            border-radius: 18px;
          }

          .nav-grid,
          .kpi-grid,
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .hero-actions {
            flex-direction: column;
          }

          .button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}