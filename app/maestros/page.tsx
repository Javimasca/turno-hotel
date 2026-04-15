"use client";

import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function MaestrosPage() {
  const { user, isLoading, error } = useCurrentUser();

  const isActive = user?.isActive === true;
  const isAdmin = isActive && user?.role === "ADMIN";

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Maestros</p>
          <h1>Configuración del sistema</h1>
          <p className="page-description">
            Gestionamos la estructura base del hotel: centros, departamentos,
            zonas, grupos y configuración operativa.
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
          <p>Cargando permisos de acceso...</p>
        </div>
      ) : null}

      {!isLoading && user?.isActive === false ? (
        <div className="state-card warning">
          <p>Tu usuario está inactivo y no puede acceder a esta sección.</p>
        </div>
      ) : null}

      {!isLoading && user?.isActive === true && user.role !== "ADMIN" ? (
        <div className="state-card warning">
          <p>
            No tienes permisos para acceder a la configuración maestra del
            sistema.
          </p>
        </div>
      ) : null}

      {isAdmin ? (
        <section className="nav-grid">
          <Link href="/maestros/lugares-trabajo" className="nav-card">
            <h2 className="nav-card-title">Lugares de trabajo</h2>
            <p className="nav-card-text">
              Definimos los hoteles o centros operativos del sistema.
            </p>
            <span className="nav-card-link">Gestionar →</span>
          </Link>

          <Link href="/maestros/departamentos" className="nav-card">
            <h2 className="nav-card-title">Departamentos</h2>
            <p className="nav-card-text">
              Organizamos las áreas funcionales dentro de cada centro.
            </p>
            <span className="nav-card-link">Gestionar →</span>
          </Link>

          <Link
            href="/maestros/categorias-profesionales"
            className="nav-card"
          >
            <h2 className="nav-card-title">Categorías profesionales</h2>
            <p className="nav-card-text">
              Definimos los roles laborales disponibles en el sistema.
            </p>
            <span className="nav-card-link">Gestionar →</span>
          </Link>

          <Link href="/maestros/asignaciones-categorias" className="nav-card">
            <h2 className="nav-card-title">Asignaciones de categorías</h2>
            <p className="nav-card-text">
              Conectamos categorías con departamentos, zonas y grupos de
              cuadrante.
            </p>
            <span className="nav-card-link">Gestionar →</span>
          </Link>

          <Link href="/maestros/empleados" className="nav-card">
            <h2 className="nav-card-title">Empleados</h2>
            <p className="nav-card-text">
              Gestionamos la ficha base del trabajador, su responsable y su
              contexto organizativo.
            </p>
            <span className="nav-card-link">Gestionar →</span>
          </Link>

          <Link href="/maestros/organigrama" className="nav-card">
            <h2 className="nav-card-title">Organigrama</h2>
            <p className="nav-card-text">
              Visualizamos la estructura jerárquica real del equipo con
              navegación, búsqueda, zoom y control por niveles.
            </p>
            <span className="nav-card-link">Abrir →</span>
          </Link>

          <Link href="/maestros/turnos" className="nav-card">
            <h2 className="nav-card-title">Maestro de turnos</h2>
            <p className="nav-card-text">
              Gestionamos el catálogo base de turnos reutilizables por centro y
              departamento.
            </p>
            <span className="nav-card-link">Abrir →</span>
          </Link>

          <Link href="/maestros/ausencias" className="nav-card">
            <h2 className="nav-card-title">Ausencias</h2>
            <p className="nav-card-text">
              Gestionamos el catálogo de tipos de ausencia del sistema, como
              vacaciones, IT, consulta médica o asuntos propios.
            </p>
            <span className="nav-card-link">Gestionar →</span>
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