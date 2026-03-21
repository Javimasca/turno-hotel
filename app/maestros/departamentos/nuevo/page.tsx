import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type NewDepartmentPageProps = {
  searchParams?: Promise<{
    error?: string;
    workplaceId?: string;
    code?: string;
    name?: string;
    description?: string;
    isActive?: string;
  }>;
};

export default async function NewDepartmentPage({
  searchParams,
}: NewDepartmentPageProps) {
  const params = searchParams ? await searchParams : undefined;

  const error = params?.error?.trim() || "";
  const selectedWorkplaceId = params?.workplaceId?.trim() || "";
  const code = params?.code?.trim() || "";
  const name = params?.name?.trim() || "";
  const description = params?.description?.trim() || "";
  const isActive = params?.isActive !== "false";

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
            {error ? (
              <div className="form-field form-field-full">
                <div className="form-error" role="alert">
                  {error}
                </div>
              </div>
            ) : null}

            <div className="form-field">
              <label htmlFor="workplaceId">Lugar de trabajo</label>
              <select
                id="workplaceId"
                name="workplaceId"
                defaultValue={selectedWorkplaceId}
                required
              >
                <option value="">Selecciona un lugar</option>
                {workplaces.map((workplace) => (
                  <option key={workplace.id} value={workplace.id}>
                    {workplace.name}
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
                defaultValue={code}
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
                defaultValue={name}
                required
              />
            </div>

            <div className="form-field form-field-checkbox">
              <label htmlFor="isActive">Activo</label>
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                defaultChecked={isActive}
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
                defaultValue={description}
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