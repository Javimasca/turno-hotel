import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type EditDepartmentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditDepartmentPage({
  params,
}: EditDepartmentPageProps) {
  const { id } = await params;

  const department = await prisma.department.findUnique({
    where: { id },
    select: {
      id: true,
      workplaceId: true,
      code: true,
      name: true,
      description: true,
      isActive: true,
    },
  });

  if (!department) {
    notFound();
  }

  const workplaces = await prisma.workplace.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
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
          <h1>Editar departamento</h1>
          <p className="page-description">
            Modificamos el departamento <strong>{department.name}</strong>.
          </p>
        </div>
      </section>

      <section className="card">
        <form
          className="form-grid"
          action={`/api/maestros/departamentos/${department.id}`}
          method="post"
        >
          <input type="hidden" name="_method" value="PATCH" />

          <div className="form-field">
            <label htmlFor="workplaceId">Lugar de trabajo</label>
            <select
              id="workplaceId"
              name="workplaceId"
              defaultValue={department.workplaceId}
              disabled
            >
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
              defaultValue={department.code}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={department.name}
              required
            />
          </div>

          <div className="form-field form-field-checkbox">
            <label htmlFor="isActive">Activo</label>
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={department.isActive}
              value="true"
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={department.description ?? ""}
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
              Guardar cambios
            </button>
          </div>
        </form>

        <form
          action={`/api/maestros/departamentos/${department.id}`}
          method="post"
          className="danger-zone"
        >
          <input type="hidden" name="_method" value="DELETE" />

          <button type="submit" className="button button-danger">
            Eliminar departamento
          </button>
        </form>
      </section>
    </main>
  );
}