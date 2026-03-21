import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewDepartmentPage() {
  const workplaces = await prisma.workplace.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
    },
  });

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros/departamentos" className="back-link">
            ← Volver a departamentos
          </Link>
          <p className="eyebrow">Maestros · Departamentos</p>
          <h1>Nuevo departamento</h1>
          <p className="page-description">
            Creamos un nuevo departamento dentro de un lugar de trabajo.
          </p>
        </div>
      </section>

      <section className="card">
        {workplaces.length === 0 ? (
          <div className="empty-state">
            <h3>No hay lugares de trabajo</h3>
            <p>
              Primero necesitamos crear al menos un lugar de trabajo antes de
              poder definir departamentos.
            </p>
            <Link
              href="/maestros/lugares-trabajo"
              className="button button-primary"
            >
              Ir a lugares de trabajo
            </Link>
          </div>
        ) : (
          <form
            className="form-grid"
            action="/api/maestros/departamentos"
            method="post"
          >
            <div className="form-field">
              <label htmlFor="workplaceId">Lugar de trabajo</label>
              <select id="workplaceId" name="workplaceId" required>
                <option value="">Selecciona un lugar</option>
                {workplaces.map((wp) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="code">Código</label>
              <input
                id="code"
                name="code"
                type="text"
                placeholder="Ej. REST"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="name">Nombre</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Ej. Restaurante"
                required
              />
            </div>

            <div className="form-field form-field-checkbox">
              <label htmlFor="isActive">Activo</label>
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                defaultChecked
                value="true"
              />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Describe el departamento."
              />
            </div>

            <div className="form-actions">
              <Link
                href="/maestros/departamentos"
                className="button button-secondary"
              >
                Cancelar
              </Link>

              <button type="submit" className="button button-primary">
                Guardar departamento
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}