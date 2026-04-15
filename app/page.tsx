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
    href: "/maestros",
    title: "Maestros",
    description:
      "Configuramos lugares de trabajo, departamentos, categorías laborales y turnos maestros.",
    roles: ["ADMIN"],
  },
  {
    href: "/empleados",
    title: "Empleados",
    description:
      "Gestionamos fichas de trabajadores, categoría, antigüedad, parcialidad y asignaciones.",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/turnos",
    title: "Cuadrantes",
    description:
      "Accedemos al cuadrante operativo para consultar y organizar turnos del personal.",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    href: "/planificacion",
    title: "Planificación",
    description:
      "Organizamos turnos diarios con vista por día, semana y mes, filtros y validaciones.",
    roles: ["ADMIN", "MANAGER"],
  },
];

const highlights = [
  {
    label: "Lugares de trabajo",
    value: "Hoteles",
    text: "Base preparada para gestionar más de un centro operativo.",
  },
  {
    label: "Departamentos",
    value: "Áreas",
    text: "Recepción, pisos, cocina, mantenimiento y cualquier estructura futura.",
  },
  {
    label: "Turnos",
    value: "Plantillas",
    text: "Separación clara entre turno maestro y turno planificado diario.",
  },
  {
    label: "Empleados",
    value: "Ficha completa",
    text: "Con categoría laboral, antigüedad, parcialidad y asignaciones.",
  },
];

export default function HomePage() {
  const { user, isLoading: isUserLoading, error: userError } = useCurrentUser();

  const visibleMainAreas = useMemo(() => {
    if (!user || !user.isActive) {
      return [];
    }

    return mainAreas.filter((area) => area.roles.includes(user.role));
  }, [user]);

  const canAccessMaestros =
    user?.isActive === true && user.role === "ADMIN";

  const canAccessTurnos = user?.isActive === true;

  return (
    <main>
      <section className="app-section">
        <div className="app-container">
          <div className="hero-panel">
            <div className="hero-panel-content">
              <span className="page-eyebrow">TurnoHotel</span>

              <h1 className="hero-panel-title">
                Gestión de turnos con
                <br />
                identidad hotelera
              </h1>

              <p className="hero-panel-text">
                Construimos una aplicación interna clara, elegante y operativa
                para organizar lugares de trabajo, departamentos, empleados,
                cuadrantes y planificación diaria con una estética inspirada en
                Puerto Antilla.
              </p>

              {userError ? (
                <div className="home-message error" style={{ marginTop: "16px" }}>
                  {userError}
                </div>
              ) : null}

              {!isUserLoading && user?.isActive === false ? (
                <div className="home-message warning" style={{ marginTop: "16px" }}>
                  Tu usuario está inactivo. No tienes acceso operativo a los módulos.
                </div>
              ) : null}

              <div className="page-actions" style={{ marginTop: "24px" }}>
                {canAccessMaestros ? (
                  <Link href="/maestros" className="button button-primary">
                    Entrar en maestros
                  </Link>
                ) : null}

                {canAccessTurnos ? (
                  <Link href="/turnos" className="button button-secondary">
                    Abrir cuadrantes
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-section">
        <div className="app-container">
          <header className="page-header">
            <div className="page-header-content">
              <span className="page-eyebrow">Áreas principales</span>
              <h2 className="page-title">La estructura base del proyecto</h2>
              <p className="page-description">
                Separamos configuración, personas y operación para construir una
                base limpia desde el inicio.
              </p>
            </div>
          </header>

          {isUserLoading ? (
            <div className="home-message info">
              Cargando accesos disponibles...
            </div>
          ) : visibleMainAreas.length > 0 ? (
            <div className="nav-grid">
              {visibleMainAreas.map((area) => (
                <Link key={area.href} href={area.href} className="nav-card">
                  <h3 className="nav-card-title">{area.title}</h3>
                  <p className="nav-card-text">{area.description}</p>
                  <span className="nav-card-link">Acceder</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="home-message info">
              No hay áreas disponibles para tu perfil en esta pantalla.
            </div>
          )}
        </div>
      </section>

      <section className="app-section">
        <div className="app-container">
          <header className="page-header">
            <div className="page-header-content">
              <span className="page-eyebrow">Punto de partida</span>
              <h2 className="page-title">Qué dejamos preparado desde el MVP</h2>
              <p className="page-description">
                El modelo ya nace pensado para crecer sin rehacer el núcleo
                cuando lleguen informes, mejoras de planificación o nuevos
                centros.
              </p>
            </div>
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
        </div>
      </section>

      <section className="app-section">
        <div className="app-container">
          <div className="grid grid-cols-2">
            <article className="card">
              <div className="card-header">
                <h2 className="card-title">Criterio funcional</h2>
                <p className="card-description">
                  Priorizamos reglas de negocio claras antes de llenar la app de
                  pantallas.
                </p>
              </div>

              <div className="card-content">
                <div className="grid">
                  <div>
                    <span className="status-chip status-published">
                      maestros
                    </span>
                    <p style={{ margin: "12px 0 0" }}>
                      Lugares de trabajo, departamentos, categorías laborales y
                      turnos maestros como base de configuración.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      empleados
                    </span>
                    <p style={{ margin: "12px 0 0" }}>
                      Cada trabajador tendrá su ficha con datos laborales y las
                      asignaciones que condicionan qué turnos puede realizar.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      cuadrantes
                    </span>
                    <p style={{ margin: "12px 0 0" }}>
                      El cuadrante será la vista operativa principal para
                      organizar equipos, coberturas y turnos por periodo.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      planificación
                    </span>
                    <p style={{ margin: "12px 0 0" }}>
                      La operación diaria se construye sobre turnos reales con
                      filtros, validaciones y vistas por fecha.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="card-header">
                <h2 className="card-title">Próximos pasos</h2>
                <p className="card-description">
                  Seguimos archivo a archivo, sin tocar nada innecesario.
                </p>
              </div>

              <div className="card-content">
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Paso</th>
                        <th>Objetivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>Crear la entrada de Maestros</td>
                      </tr>
                      <tr>
                        <td>2</td>
                        <td>Montar las páginas base de cada bloque</td>
                      </tr>
                      <tr>
                        <td>3</td>
                        <td>Conectar Prisma con los primeros endpoints</td>
                      </tr>
                      <tr>
                        <td>4</td>
                        <td>Empezar por Lugares de trabajo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-message {
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
      `}</style>
    </main>
  );
}