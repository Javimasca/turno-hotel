import Link from 'next/link'

const masterSections = [
  {
    href: '/maestros/lugares-trabajo',
    title: 'Lugares de trabajo',
    description:
      'Gestionamos hoteles o centros de trabajo y dejamos preparada la estructura operativa de cada uno.',
    eyebrow: 'Maestro base',
  },
  {
    href: '/maestros/departamentos',
    title: 'Departamentos',
    description:
      'Definimos las áreas de cada lugar de trabajo y sus relaciones con categorías y turnos permitidos.',
    eyebrow: 'Estructura interna',
  },
  {
    href: '/maestros/categorias-laborales',
    title: 'Categorías laborales',
    description:
      'Configuramos las categorías profesionales que condicionan qué departamentos puede cubrir cada trabajador.',
    eyebrow: 'Clasificación',
  },
  {
    href: '/maestros/grupos-cuadrante',
    title: 'Grupos de cuadrante',
    description:
      'Agrupamos visual y operativamente categorías para ordenar mejor el cuadrante por bloques.',
    eyebrow: 'Orden visual',
  },
  {
    href: '/maestros/turnos',
    title: 'Turnos',
    description:
      'Creamos los turnos maestros o plantillas horarias que luego usaremos en la planificación diaria.',
    eyebrow: 'Plantillas',
  },
]

const rules = [
  'Un departamento pertenece siempre a un único lugar de trabajo.',
  'Cada departamento define qué categorías laborales admite.',
  'Cada departamento define qué turnos maestros puede utilizar.',
  'Las categorías pueden agruparse visualmente mediante grupos de cuadrante.',
  'La planificación diaria solo puede usar configuraciones válidas en maestros.',
]

export default function MaestrosPage() {
  return (
    <main>
      <section className="app-section">
        <div className="app-container">
          <header className="page-header">
            <div className="page-header-content">
              <span className="page-eyebrow">Configuración</span>
              <h1 className="page-title">Maestros</h1>
              <p className="page-description">
                Centralizamos aquí toda la configuración base de TurnoHotel para
                construir una planificación consistente desde el principio.
              </p>
            </div>

            <div className="page-actions">
              <Link href="/" className="button button-secondary">
                Volver al inicio
              </Link>
            </div>
          </header>

          <div className="grid grid-cols-2">
            <article className="card">
              <div className="card-header">
                <h2 className="card-title">Qué configuramos aquí</h2>
                <p className="card-description">
                  Los maestros definen la estructura del negocio antes de entrar
                  en empleados y planificación.
                </p>
              </div>

              <div className="card-content">
                <div className="grid">
                  <div>
                    <span className="status-chip status-published">
                      lugares
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Hoteles o centros de trabajo donde operará la aplicación.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      departamentos
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Áreas funcionales que organizan la operación de cada lugar
                      de trabajo.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      categorías
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Perfiles laborales que condicionan la asignación operativa.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      grupos
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Bloques visuales para ordenar categorías dentro del
                      cuadrante.
                    </p>
                  </div>

                  <div>
                    <span className="status-chip status-published">
                      turnos
                    </span>
                    <p style={{ margin: '12px 0 0' }}>
                      Plantillas horarias reutilizables para la planificación
                      diaria.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="card-header">
                <h2 className="card-title">Reglas base del modelo</h2>
                <p className="card-description">
                  Estas relaciones son las que sostienen el núcleo funcional del
                  MVP.
                </p>
              </div>

              <div className="card-content">
                <div className="grid">
                  {rules.map((rule) => (
                    <div key={rule}>
                      <span className="status-chip status-draft">regla</span>
                      <p style={{ margin: '12px 0 0' }}>{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="app-section">
        <div className="app-container">
          <header className="page-header">
            <div className="page-header-content">
              <span className="page-eyebrow">Áreas maestras</span>
              <h2 className="page-title">Bloques de configuración</h2>
              <p className="page-description">
                Entramos a cada maestro de forma independiente para trabajar con
                orden, archivo a archivo y sin improvisar estructura.
              </p>
            </div>
          </header>

          <div className="nav-grid">
            {masterSections.map((section) => (
              <Link key={section.href} href={section.href} className="nav-card">
                <span className="page-eyebrow">{section.eyebrow}</span>
                <h3 className="nav-card-title">{section.title}</h3>
                <p className="nav-card-text">{section.description}</p>
                <span className="nav-card-link">Entrar en este maestro</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="app-section">
        <div className="app-container">
          <article className="card">
            <div className="card-header">
              <h2 className="card-title">Orden recomendado de construcción</h2>
              <p className="card-description">
                Seguimos una secuencia lógica para evitar retrabajo en la capa
                de negocio.
              </p>
            </div>

            <div className="card-content">
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Paso</th>
                      <th>Maestro</th>
                      <th>Objetivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>Lugares de trabajo</td>
                      <td>Definir los centros operativos del sistema</td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>Grupos de cuadrante</td>
                      <td>
                        Preparar la agrupación visual y operativa del cuadrante
                      </td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>Categorías laborales</td>
                      <td>Fijar la clasificación profesional de empleados</td>
                    </tr>
                    <tr>
                      <td>4</td>
                      <td>Turnos</td>
                      <td>Crear las plantillas horarias reutilizables</td>
                    </tr>
                    <tr>
                      <td>5</td>
                      <td>Departamentos</td>
                      <td>
                        Relacionar lugares, categorías permitidas y turnos
                        válidos
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}