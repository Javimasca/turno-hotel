import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type NewEmployeeContractPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    jobCategoryId?: string;
    contractType?: string;
    startDate?: string;
    endDate?: string;
    seniorityDate?: string;
    weeklyHours?: string;
    dailyHours?: string;
    employmentRate?: string;
    notes?: string;
  }>;
};

export default async function NewEmployeeContractPage({
  params,
  searchParams,
}: NewEmployeeContractPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;

  const error = query?.error?.trim() || "";
  const jobCategoryId = query?.jobCategoryId?.trim() || "";
  const contractType = query?.contractType?.trim() || "INDEFINIDO";
  const startDate = query?.startDate?.trim() || "";
  const endDate = query?.endDate?.trim() || "";
  const seniorityDate = query?.seniorityDate?.trim() || "";
  const weeklyHours = query?.weeklyHours?.trim() || "";
  const dailyHours = query?.dailyHours?.trim() || "";
  const employmentRate = query?.employmentRate?.trim() || "";
  const notes = query?.notes?.trim() || "";

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  if (!employee) {
    return (
      <main className="page-shell">
        <section className="card">
          <div className="empty-state">
            <h3>El empleado no existe</h3>
            <p>No hemos encontrado la ficha del empleado seleccionado.</p>
            <Link href="/maestros/empleados" className="button button-primary">
              Volver a empleados
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const jobCategories = await prisma.jobCategory.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      shortName: true,
    },
  });

  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link
            href={`/maestros/empleados/${employee.id}/editar`}
            className="back-link"
          >
            ← Volver a empleado
          </Link>
          <p className="eyebrow">Maestros · Empleados · Contratos</p>
          <h1>Nuevo contrato</h1>
          <p className="page-description">
            Damos de alta un nuevo tramo contractual para <strong>{fullName}</strong>.
          </p>
        </div>
      </section>

      <section className="card">
        {jobCategories.length === 0 ? (
          <div className="empty-state">
            <h3>No hay categorías profesionales</h3>
            <p>
              Primero necesitamos crear al menos una categoría profesional antes
              de poder dar de alta contratos.
            </p>
            <Link
              href="/maestros/categorias-profesionales"
              className="button button-primary"
            >
              Ir a categorías profesionales
            </Link>
          </div>
        ) : (
          <form
            className="form-grid"
            action={`/api/maestros/empleados/${employee.id}/contratos`}
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
              <label htmlFor="jobCategoryId">Categoría profesional</label>
              <select
                id="jobCategoryId"
                name="jobCategoryId"
                defaultValue={jobCategoryId}
                required
              >
                <option value="">Selecciona una categoría</option>
                {jobCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.shortName || category.name} · {category.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="contractType">Tipo de contrato</label>
              <select
                id="contractType"
                name="contractType"
                defaultValue={contractType}
                required
              >
                <option value="INDEFINIDO">Indefinido</option>
                <option value="TEMPORAL">Temporal</option>
                <option value="FIJO_DISCONTINUO">Fijo discontinuo</option>
                <option value="FORMACION">Formación</option>
                <option value="PRACTICAS">Prácticas</option>
                <option value="INTERINIDAD">Interinidad</option>
                <option value="EVENTUAL">Eventual</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="startDate">Fecha de inicio</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={startDate}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="endDate">Fecha fin</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={endDate}
              />
            </div>

            <div className="form-field">
              <label htmlFor="seniorityDate">Fecha de antigüedad</label>
              <input
                id="seniorityDate"
                name="seniorityDate"
                type="date"
                defaultValue={seniorityDate}
              />
            </div>

            <div className="form-field">
              <label htmlFor="weeklyHours">Horas semanales</label>
              <input
                id="weeklyHours"
                name="weeklyHours"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej. 40"
                defaultValue={weeklyHours}
              />
            </div>

            <div className="form-field">
              <label htmlFor="dailyHours">Horas diarias</label>
              <input
                id="dailyHours"
                name="dailyHours"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej. 8"
                defaultValue={dailyHours}
              />
            </div>

            <div className="form-field">
              <label htmlFor="employmentRate">Parcialidad (%)</label>
              <input
                id="employmentRate"
                name="employmentRate"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej. 100"
                defaultValue={employmentRate}
              />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="notes">Observaciones</label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Añadimos aquí detalles del contrato, observaciones o contexto."
                defaultValue={notes}
              />
            </div>

            <div className="form-actions">
              <Link
                href={`/maestros/empleados/${employee.id}/editar`}
                className="button button-secondary"
              >
                Cancelar
              </Link>

              <button type="submit" className="button button-primary">
                Guardar contrato
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}