import Link from 'next/link'

export default function MaestrosPage() {
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

        <Link href="/maestros/categorias-profesionales" className="nav-card">
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
            Visualizamos la estructura jerárquica real del equipo con navegación,
            búsqueda, zoom y control por niveles.
          </p>
          <span className="nav-card-link">Abrir →</span>
        </Link>

        <Link href="/turnos" className="nav-card">
          <h2 className="nav-card-title">Turnos</h2>
          <p className="nav-card-text">
            Accedemos al módulo operativo para crear maestros de turno, asignar
            turnos reales y activar la planificación semanal.
          </p>
          <span className="nav-card-link">Abrir →</span>
        </Link>
      </section>
    </main>
  )
}