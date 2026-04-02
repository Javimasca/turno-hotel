import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import QueryFeedbackToast from "@/components/shared/query-feedback-toast";
import DeleteDepartmentForm from "./delete-department-form";
import DepartmentJobCategoriesSelect from "./department-job-categories-select";

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
      departmentJobCategories: {
        where: { isActive: true },
        select: { jobCategoryId: true },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!department) {
    notFound();
  }

  const workplaces = await prisma.workplace.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true },
  });

  const jobCategories = await prisma.jobCategory.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      shortName: true,
      textColor: true,
    },
  });

  const initialSelectedIds = department.departmentJobCategories.map(
    (item) => item.jobCategoryId
  );

  return (
    <main className="page-shell">
      <QueryFeedbackToast />

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

          <DepartmentJobCategoriesSelect
            jobCategories={jobCategories}
            initialSelectedIds={initialSelectedIds}
          />

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

        <DeleteDepartmentForm
          action={`/api/maestros/departamentos/${department.id}`}
        />
      </section>
    </main>
  );
}