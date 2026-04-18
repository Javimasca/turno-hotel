"use client";

import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function PlanificacionPage() {
  const { user, isLoading, error } = useCurrentUser();

  const isActive = user?.isActive === true;
  const canAccess = isActive && (user.role === "ADMIN" || user.role === "MANAGER");

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Planificación</p>
          <h1>Planificación operativa</h1>
          <p className="page-description">
            Generamos demanda y propuestas de turnos basadas en previsiones del hotel.
          </p>
        </div>
      </section>

      {error ? (
        <div className="state-card error">
          <p>{error}</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="state-card">
          <p>Cargando permisos...</p>
        </div>
      ) : null}

      {!isLoading && user?.isActive === false ? (
        <div className="state-card warning">
          <p>Tu usuario está inactivo.</p>
        </div>
      ) : null}

      {!isLoading && isActive && !canAccess ? (
        <div className="state-card warning">
          <p>No tienes acceso a planificación.</p>
        </div>
      ) : null}

      {canAccess ? (
        <section className="nav-grid">
          <Link
            href="/planificacion/restaurante"
            className="nav-card"
          >
            <h2 className="nav-card-title">Restaurante</h2>
            <p className="nav-card-text">
              Calculamos demanda por servicios y generamos propuesta de turnos.
            </p>
            <span className="nav-card-link">Abrir →</span>
          </Link>
        </section>
      ) : null}

      <style jsx>{`
        .state-card {
          margin-top: 16px;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
        }

        .state-card.warning {
          border-color: #fde68a;
          background: #fffbeb;
          color: #92400e;
        }

        .state-card.error {
          border-color: #fecaca;
          background: #fff7f7;
          color: #991b1b;
        }
      `}</style>
    </main>
  );
}