import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type NewEmployeePageProps = {
  searchParams?: Promise<{
    error?: string;
    code?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    directManagerEmployeeId?: string;
    workplaceId?: string;
    departmentId?: string;
    isActive?: string;
  }>;
};

export default async function NewEmployeePage({
  searchParams,
}: NewEmployeePageProps) {
  const params = searchParams ? await searchParams : undefined;

  const error = params?.error?.trim() || "";
  const code = params?.code?.trim() || "";
  const firstName = params?.firstName?.trim() || "";
  const lastName = params?.lastName?.trim() || "";
  const email = params?.email?.trim() || "";
  const phone = params?.phone?.trim() || "";
  const directManagerEmployeeId = params?.directManagerEmployeeId?.trim() || "";
  const workplaceId = params?.workplaceId?.trim() || "";
  const departmentId = params?.departmentId?.trim() || "";
  const isActive = params?.isActive !== "false";

  const [managers, workplaces, departments] = await Promise.all([
    prisma.employee.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.workplace.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: [{ name: "asc" }],
    }),
    prisma.department.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        workplace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
    }),
  ]);

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <Link href="/maestros/empleados" className="back-link">
            ← Volver a empleados
          </Link>
          <p className="eyebrow">Maestros · Empleados</p>
          <h1>Nuevo empleado</h1>
          <p className="page-description">
            Creamos la ficha base del trabajador y su asignación organizativa
            inicial.
          </p>
        </div>
      </section>

      <section className="card">
        <form
          className="form-grid"
          action="/api/maestros/empleados"
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
            <label htmlFor="code">Código</label>
            <input
              id="code"
              name="code"
              type="text"
              placeholder="Ej. EMP-001"
              defaultValue={code}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="firstName">Nombre</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Ej. María"
              defaultValue={firstName}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="lastName">Apellidos</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Ej. García López"
              defaultValue={lastName}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Ej. maria.garcia@hotel.com"
              defaultValue={email}
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone">Teléfono</label>
            <input
              id="phone"
              name="phone"
              type="text"
              placeholder="Ej. 600123123"
              defaultValue={phone}
            />
          </div>

          <div className="form-field">
            <label htmlFor="directManagerEmployeeId">Jefe inmediato</label>
            <select
              id="directManagerEmployeeId"
              name="directManagerEmployeeId"
              defaultValue={directManagerEmployeeId}
            >
              <option value="">Sin asignar</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.firstName} {manager.lastName} · {manager.code}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="workplaceId">Hotel / centro</label>
            <select
              id="workplaceId"
              name="workplaceId"
              defaultValue={workplaceId}
            >
              <option value="">Sin asignar</option>
              {workplaces.map((workplace) => (
                <option key={workplace.id} value={workplace.id}>
                  {workplace.name} · {workplace.code}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="departmentId">Departamento</label>
            <select
              id="departmentId"
              name="departmentId"
              defaultValue={departmentId}
            >
              <option value="">Sin asignar</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name} · {department.workplace.name}
                </option>
              ))}
            </select>
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

          <div className="form-actions">
            <Link href="/maestros/empleados" className="button button-secondary">
              Cancelar
            </Link>

            <button type="submit" className="button button-primary">
              Guardar empleado
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}