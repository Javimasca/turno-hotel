"use client";

import { useEffect, useMemo, useState } from "react";

type EmployeeOption = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
};

type UserItem = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive: boolean;
  employeeId: string | null;
  employee: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

type CreateUserForm = {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive: boolean;
  employeeId: string;
};

const INITIAL_FORM: CreateUserForm = {
  email: "",
  password: "",
  name: "",
  role: "EMPLOYEE",
  isActive: true,
  employeeId: "",
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [form, setForm] = useState<CreateUserForm>(INITIAL_FORM);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const availableEmployees = useMemo(() => {
    const linkedEmployeeIds = new Set(
      users
        .filter((user) => user.employeeId)
        .map((user) => user.employeeId as string)
    );

    return employees
      .filter((employee) => employee.isActive)
      .filter((employee) => !linkedEmployeeIds.has(employee.id))
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
          "es"
        )
      );
  }, [employees, users]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);

      const [usersResponse, employeesResponse] = await Promise.all([
        fetch("/api/users", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/employees", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const usersData = (await usersResponse.json().catch(() => null)) as
        | UserItem[]
        | { error?: string }
        | null;

      const employeesData = (await employeesResponse.json().catch(() => null)) as
        | EmployeeOption[]
        | { error?: string }
        | null;

           if (!usersResponse.ok) {
        throw new Error("No se pudieron cargar los usuarios.");
      }

      if (!employeesResponse.ok) {
        throw new Error("No se pudieron cargar los empleados.");
      }

            if (!Array.isArray(usersData)) {
        throw new Error(usersData?.error || "No se pudieron cargar los usuarios.");
      }

      if (!Array.isArray(employeesData)) {
        throw new Error(
          employeesData?.error || "No se pudieron cargar los empleados."
        );
      }

      setUsers(
        [...usersData].sort((a, b) => a.email.localeCompare(b.email, "es"))
      );

      setEmployees(
        [...employeesData].sort((a, b) =>
          `${a.lastName} ${a.firstName}`.localeCompare(
            `${b.lastName} ${b.firstName}`,
            "es"
          )
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error inesperado."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateForm<K extends keyof CreateUserForm>(
    key: K,
    value: CreateUserForm[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSuccessMessage(null);

      if (!form.email.trim()) {
        throw new Error("Debes indicar un email.");
      }

      if (!form.password) {
        throw new Error("Debes indicar una contraseña.");
      }

      if (form.password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres.");
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          name: form.name.trim() || null,
          role: form.role,
          isActive: form.isActive,
          employeeId: form.employeeId || null,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | UserItem
        | { error?: string }
        | null;

            if (!response.ok) {
        if (data && !("id" in data) && "error" in data && data.error) {
          throw new Error(data.error);
        }

        throw new Error("No se pudo crear el usuario.");
      }

      setForm(INITIAL_FORM);
      setSuccessMessage("Usuario creado correctamente.");
      await loadData();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error al crear el usuario."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-shell">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">TURNOHOTEL</p>
            <h1 className="page-title">Usuarios</h1>
            <p className="page-subtitle">
              Alta y consulta de usuarios reales del sistema.
            </p>
          </div>
        </div>

        {error ? (
          <div className="state-card error">
            <p>{error}</p>
          </div>
        ) : null}

        <div className="content-grid">
          <section className="card form-card">
            <div className="section-header">
              <h2>Nuevo usuario</h2>
              <p>Crea accesos reales vinculados opcionalmente a empleados.</p>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="usuario@empresa.com"
                  disabled={isSubmitting}
                />
              </div>

              <div className="field">
                <label htmlFor="password">Contraseña inicial</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  disabled={isSubmitting}
                />
              </div>

              <div className="field">
                <label htmlFor="name">Nombre visible</label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Opcional"
                  disabled={isSubmitting}
                />
              </div>

              <div className="field">
                <label htmlFor="role">Rol</label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(event) =>
                    updateForm(
                      "role",
                      event.target.value as "ADMIN" | "MANAGER" | "EMPLOYEE"
                    )
                  }
                  disabled={isSubmitting}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="employeeId">Empleado vinculado</label>
                <select
                  id="employeeId"
                  value={form.employeeId}
                  onChange={(event) =>
                    updateForm("employeeId", event.target.value)
                  }
                  disabled={isSubmitting}
                >
                  <option value="">Sin vincular</option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.lastName}, {employee.firstName} ({employee.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      updateForm("isActive", event.target.checked)
                    }
                    disabled={isSubmitting}
                  />
                  <span>Usuario activo</span>
                </label>
              </div>

              {submitError ? (
                <div className="state-card error compact">
                  <p>{submitError}</p>
                </div>
              ) : null}

              {successMessage ? (
                <div className="state-card success compact">
                  <p>{successMessage}</p>
                </div>
              ) : null}

              <div className="actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </section>

          <section className="card list-card">
            <div className="section-header">
              <h2>Usuarios existentes</h2>
              <p>{users.length} usuario(s) registrados.</p>
            </div>

            {isLoading ? (
              <div className="state-card">
                <p>Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="state-card">
                <p>No hay usuarios registrados.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Empleado vinculado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{user.name || "—"}</td>
                        <td>
                          <span className={`role-badge ${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              user.isActive ? "active" : "inactive"
                            }`}
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          {user.employee ? (
                            <div className="employee-cell">
                              <strong>
                                {user.employee.firstName} {user.employee.lastName}
                              </strong>
                              <span>{user.employee.code}</span>
                            </div>
                          ) : (
                            "Sin vincular"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <style jsx>{`
        .page-shell {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #f6f8fc;
          min-height: 100%;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        .page-eyebrow {
          margin: 0 0 4px 0;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b7791f;
        }

        .page-title {
          margin: 0;
          font-size: 24px;
          line-height: 1.1;
          font-weight: 800;
          color: #0f172a;
        }

        .page-subtitle {
          margin: 6px 0 0 0;
          color: #475569;
          font-size: 12px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }

        .card,
        .state-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .card {
          padding: 16px;
        }

        .section-header {
          margin-bottom: 14px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .section-header p {
          margin: 6px 0 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field label,
        .checkbox-label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .field input,
        .field select {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          color: #0f172a;
          background: white;
          outline: none;
        }

        .field input:focus,
        .field select:focus {
          border-color: #b7791f;
          box-shadow: 0 0 0 3px rgba(183, 121, 31, 0.12);
        }

        .field input:disabled,
        .field select:disabled {
          background: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
        }

        .checkbox-row {
          padding-top: 4px;
        }

        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 4px;
        }

        .primary-button {
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          background: #b7791f;
          color: white;
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .state-card {
          padding: 16px;
        }

        .state-card.compact {
          padding: 12px 14px;
          box-shadow: none;
        }

        .state-card.error {
          border-color: #fecaca;
          background: #fff7f7;
          color: #991b1b;
        }

        .state-card.success {
          border-color: #bbf7d0;
          background: #f0fdf4;
          color: #166534;
        }

        .table-wrap {
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .users-table th,
        .users-table td {
          padding: 12px 10px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }

        .users-table th {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #64748b;
        }

        .role-badge,
        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 800;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .role-badge.admin {
          background: #fee2e2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .role-badge.manager {
          background: #fef3c7;
          border-color: #fde68a;
          color: #92400e;
        }

        .role-badge.employee {
          background: #dbeafe;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }

        .status-badge.active {
          background: #dcfce7;
          border-color: #bbf7d0;
          color: #166534;
        }

        .status-badge.inactive {
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #475569;
        }

        .employee-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .employee-cell strong {
          font-size: 13px;
          color: #0f172a;
        }

        .employee-cell span {
          font-size: 12px;
          color: #64748b;
        }

        @media (max-width: 980px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}