"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  canManageShiftsForEmployeeFrontend,
  type FrontendPermissionUser,
} from "@/lib/permissions/canManageEmployeeFrontend";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  directManagerEmployeeId: string | null;
};

type Workplace = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

type ShiftMasterType = "GENERAL" | "RESTAURANTE" | "PISOS";

type ShiftMaster = {
  id: string;
  code: string;
  name: string;
  workplaceId: string;
  departmentId: string;
  type: ShiftMasterType;
  startMinute: number;
  endMinute: number;
  crossesMidnight: boolean;
  isPartial: boolean;
  backgroundColor: string | null;
  coversBreakfast: boolean;
  coversLunch: boolean;
  coversDinner: boolean;
  countsForRoomAssignment: boolean;
  isActive: boolean;
  workplace: Workplace;
  department: Department;
};

type Props = {
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  initialEmployeeId?: string;
  initialDate?: string;
  initialEndDate?: string;
  shiftId?: string;
};

type FormState = {
  employeeId: string;
  shiftMasterId: string;
  date: string;
  endDate: string;
  notes: string;
};

type CurrentUser = FrontendPermissionUser;

function buildInitialForm(
  initialEmployeeId?: string,
  initialDate?: string,
  initialEndDate?: string
): FormState {
  return {
    employeeId: initialEmployeeId ?? "",
    shiftMasterId: "",
    date: initialDate ?? "",
    endDate: initialEndDate ?? initialDate ?? "",
    notes: "",
  };
}

export default function ShiftForm({
  onClose,
  onCreated,
  initialEmployeeId,
  initialDate,
  initialEndDate,
  shiftId,
}: Props) {
  const { user, isLoading: isUserLoading, error: userError } = useCurrentUser();

  const [form, setForm] = useState<FormState>(() =>
  buildInitialForm(initialEmployeeId, initialDate, initialEndDate)
);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftMasters, setShiftMasters] = useState<ShiftMaster[]>([]);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedShiftMaster = useMemo(
    () => shiftMasters.find((item) => item.id === form.shiftMasterId) ?? null,
    [shiftMasters, form.shiftMasterId]
  );

  const canManageShifts =
    user?.isActive === true &&
    (user.role === "ADMIN" || user.role === "MANAGER");

  const isEmployeeRole = user?.role === "EMPLOYEE";
  const isInactiveUser = user?.isActive === false;

  const manageableEmployees = useMemo(() => {
  return employees.filter((employee) =>
    canManageShiftsForEmployeeFrontend(user, employee)
  );
}, [employees, user]);

  const allowedEmployeeIds = useMemo(
    () => new Set(manageableEmployees.map((employee) => employee.id)),
    [manageableEmployees]
  );

  const formDisabled = isSubmitting || isUserLoading || !canManageShifts;
  const isEditing = Boolean(shiftId);

  useEffect(() => {
  if (shiftId) return;

  setForm(buildInitialForm(initialEmployeeId, initialDate, initialEndDate));
}, [initialEmployeeId, initialDate, initialEndDate, shiftId]);

  useEffect(() => {
    void loadInitialOptions();
  }, []);

  useEffect(() => {
  if (!shiftId) return;

  void loadShiftToEdit(shiftId);
}, [shiftId]);

  useEffect(() => {
    setForm((prev) => {
      if (!prev.employeeId) {
        if (
          initialEmployeeId &&
          allowedEmployeeIds.has(initialEmployeeId)
        ) {
          return {
            ...prev,
            employeeId: initialEmployeeId,
          };
        }

        return prev;
      }

      if (!allowedEmployeeIds.has(prev.employeeId)) {
        return {
          ...prev,
          employeeId: "",
        };
      }

      return prev;
    });
  }, [allowedEmployeeIds, initialEmployeeId]);

async function loadShiftToEdit(id: string) {
  try {
    setError(null);

    const response = await fetch(`/api/shifts/${id}`, {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo cargar el turno.");
    }

    const startDate = toInputDate(new Date(data.startAt));

    setForm({
      employeeId: data.employeeId,
      shiftMasterId: data.shiftMasterId ?? "",
      date: startDate,
      endDate: startDate,
      notes: data.notes ?? "",
    });
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Error cargando el turno."
    );
  }
}

  async function loadInitialOptions() {
    try {
      setIsLoadingOptions(true);
      setError(null);

      const [employeesResponse, shiftMastersResponse] = await Promise.all([
        fetch("/api/employees", { cache: "no-store" }),
        fetch("/api/shift-masters", { cache: "no-store" }),
      ]);

      const employeesData = await employeesResponse.json();
      const shiftMastersData = await shiftMastersResponse.json();

      if (!employeesResponse.ok) {
        throw new Error(
          employeesData.error || "No se pudieron cargar los empleados."
        );
      }

      if (!shiftMastersResponse.ok) {
        throw new Error(
          shiftMastersData.error ||
            "No se pudieron cargar los maestros de turno."
        );
      }

      setEmployees(
        (employeesData as Employee[])
          .filter((employee) => employee.isActive)
          .sort((a, b) =>
            `${a.lastName} ${a.firstName}`.localeCompare(
              `${b.lastName} ${b.firstName}`,
              "es"
            )
          )
      );

      setShiftMasters(
        (shiftMastersData as ShiftMaster[])
          .filter((item) => item.isActive)
          .sort((a, b) => {
            const byWorkplace = a.workplace.name.localeCompare(
              b.workplace.name,
              "es"
            );

            if (byWorkplace !== 0) {
              return byWorkplace;
            }

            const byDepartment = a.department.name.localeCompare(
              b.department.name,
              "es"
            );

            if (byDepartment !== 0) {
              return byDepartment;
            }

            return a.name.localeCompare(b.name, "es");
          })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error cargando el formulario."
      );
    } finally {
      setIsLoadingOptions(false);
    }
  }
async function handleDelete() {
  if (!shiftId) return;

  const confirmed = window.confirm("¿Seguro que quieres eliminar este turno?");

  if (!confirmed) return;

  try {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/shifts/${shiftId}`, {
      method: "DELETE",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "No se pudo eliminar el turno.");
    }

    await onCreated();
    onClose();
  } catch (err) {
    setError(err instanceof Error ? err.message : "Error al eliminar el turno.");
  } finally {
    setIsSubmitting(false);
  }
}

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      if (!user) {
        throw new Error("No se ha podido resolver el usuario actual.");
      }

      if (!user.isActive) {
        throw new Error("Tu usuario está inactivo.");
      }

      if (!canManageShifts) {
        throw new Error("No tienes permisos para crear turnos.");
      }

      if (!form.employeeId) {
        throw new Error("Debes seleccionar un empleado.");
      }

      if (!allowedEmployeeIds.has(form.employeeId)) {
        throw new Error("No tienes permisos para crear turnos a este empleado.");
      }

      if (!form.shiftMasterId) {
        throw new Error("Debes seleccionar un maestro de turno.");
      }

      if (!form.date) {
  throw new Error("Debes indicar una fecha.");
}

if (!form.endDate) {
  throw new Error("Debes indicar una fecha fin.");
}


if (isEditing && shiftId) {
  const response = await fetch(`/api/shifts/${shiftId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      employeeId: form.employeeId,
      shiftMasterId: form.shiftMasterId,
      date: buildApiDate(form.date),
      notes: form.notes.trim() || null,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "No se pudo actualizar el turno.");
  }

async function handleDelete() {
  if (!shiftId) return;

  const confirmed = window.confirm(
    "¿Seguro que quieres eliminar este turno?"
  );

  if (!confirmed) return;

  try {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/shifts/${shiftId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo eliminar el turno.");
    }

    await onCreated();
    onClose();
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Error al eliminar el turno."
    );
  } finally {
    setIsSubmitting(false);
  }
}

  await onCreated();
  onClose();
  return;
}

const selectedDates = getDatesBetween(form.date, form.endDate);

// Obtener turnos existentes
const existingResponse = await fetch(
  `/api/shifts?startAt=${buildApiDate(form.date)}&endAt=${buildApiDate(
    form.endDate
  )}&employeeId=${form.employeeId}`
);

const existingData = await existingResponse.json();

const existingDates = new Set(
  (existingData?.shifts ?? []).map((shift: any) => {
    const d = new Date(shift.startAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  })
);

const datesToCreate = selectedDates.filter((date) => !existingDates.has(date));

const results = await Promise.all(
  datesToCreate.map((date) =>
    fetch("/api/shifts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId: form.employeeId,
        shiftMasterId: form.shiftMasterId,
        date: buildApiDate(date),
        notes: form.notes.trim() || null,
      }),
    })
  )
);

const failed = results.filter((response) => !response.ok);

if (failed.length > 0) {
  throw new Error(`No se pudieron crear ${failed.length} turno(s).`);
}

const skipped = selectedDates.length - datesToCreate.length;

if (skipped > 0) {
  alert(
    `Se han creado ${datesToCreate.length} turno(s). ${skipped} ya existían y se han omitido.`
  );
}

await onCreated();
onClose();

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ha ocurrido un error al guardar."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />

      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-form-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">HORION</p>
            <h2 id="shift-form-title" className="title">
  {isEditing ? "Editar turno" : "Nuevo turno"}
</h2>
<p className="subtitle">
  {isEditing ? "Modifica los datos del turno" : "Alta desde maestro de turno"}
</p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {userError ? <div className="error-box">{userError}</div> : null}

        {isInactiveUser ? (
          <div className="error-box">
            Tu usuario está inactivo y no puede crear turnos.
          </div>
        ) : null}

        {isEmployeeRole ? (
          <div className="error-box">
            Tu perfil no tiene permisos para crear turnos.
          </div>
        ) : null}

        {!isUserLoading && user?.role === "MANAGER" ? (
          <div className="state-box compact">
            Solo puedes crear turnos para ti y tus subordinados directos.
          </div>
        ) : null}

        {isLoadingOptions ? (
          <div className="state-box">
            <p>Cargando opciones del formulario...</p>
          </div>
        ) : (
          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="employeeId">Empleado</label>
              <select
                id="employeeId"
                value={form.employeeId}
                onChange={(event) => updateField("employeeId", event.target.value)}
                required
                disabled={formDisabled}
              >
                <option value="">Selecciona un empleado</option>
                {manageableEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.lastName}, {employee.firstName}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="date">Fecha</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                required
                disabled={formDisabled}
              />
            </div>

{!isEditing ? (
  <div className="field">
    <label htmlFor="endDate">Fecha fin</label>
    <input
      id="endDate"
      type="date"
      value={form.endDate}
      onChange={(event) => updateField("endDate", event.target.value)}
      required
      disabled={formDisabled}
    />
  </div>
) : null}

            <div className="field">
              <label htmlFor="shiftMasterId">Maestro de turno</label>
              <select
                id="shiftMasterId"
                value={form.shiftMasterId}
                onChange={(event) =>
                  updateField("shiftMasterId", event.target.value)
                }
                required
                disabled={formDisabled}
              >
                <option value="">Selecciona un maestro de turno</option>
                {shiftMasters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.workplace.name} · {item.department.name} · {item.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedShiftMaster ? (
              <div
                className="shift-master-preview"
                style={{
                  background: selectedShiftMaster.backgroundColor || "#f8fafc",
                }}
              >
                <div className="preview-header">
                  <strong>{selectedShiftMaster.name}</strong>
                  <span className={`type-badge ${selectedShiftMaster.type.toLowerCase()}`}>
                    {formatType(selectedShiftMaster.type)}
                  </span>
                </div>

                <div className="preview-grid">
                  <div>
                    <span className="preview-label">Centro</span>
                    <span className="preview-value">
                      {selectedShiftMaster.workplace.name}
                    </span>
                  </div>

                  <div>
                    <span className="preview-label">Departamento</span>
                    <span className="preview-value">
                      {selectedShiftMaster.department.name}
                    </span>
                  </div>

                  <div>
                    <span className="preview-label">Horario</span>
                    <span className="preview-value">
                      {formatMinute(selectedShiftMaster.startMinute)} -{" "}
                      {formatMinute(selectedShiftMaster.endMinute)}
                      {selectedShiftMaster.crossesMidnight
                        ? " · Cruza medianoche"
                        : ""}
                    </span>
                  </div>

                  <div>
                    <span className="preview-label">Parcial</span>
                    <span className="preview-value">
                      {selectedShiftMaster.isPartial ? "Sí" : "No"}
                    </span>
                  </div>
                </div>

                {selectedShiftMaster.type === "RESTAURANTE" ? (
                  <div className="flag-row">
                    <MiniFlag
                      active={selectedShiftMaster.coversBreakfast}
                      label="Desayuno"
                    />
                    <MiniFlag
                      active={selectedShiftMaster.coversLunch}
                      label="Almuerzo"
                    />
                    <MiniFlag
                      active={selectedShiftMaster.coversDinner}
                      label="Cena"
                    />
                  </div>
                ) : null}

                {selectedShiftMaster.type === "PISOS" ? (
                  <div className="flag-row">
                    <MiniFlag
                      active={selectedShiftMaster.countsForRoomAssignment}
                      label="Cuenta habitaciones"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Observaciones del turno"
                rows={4}
                disabled={formDisabled}
              />
            </div>

            {error ? <div className="error-box">{error}</div> : null}

            <div className="actions">
  <button
    type="button"
    className="button secondary"
    onClick={onClose}
    disabled={isSubmitting}
  >
    Cancelar
  </button>

  {isEditing ? (
    <button
      type="button"
      className="button danger"
      onClick={handleDelete}
      disabled={isSubmitting}
    >
      Eliminar
    </button>
  ) : null}

  <button
    type="submit"
    className="button primary"
    disabled={isSubmitting || isLoadingOptions || isUserLoading || !canManageShifts}
  >
    {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear turno"}
  </button>
</div>
          </form>
        )}
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.42);
          z-index: 100;
        }

        .modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(720px, calc(100vw - 32px));
          max-height: calc(100vh - 32px);
          overflow: auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
          padding: 24px;
          z-index: 101;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .eyebrow {
          margin: 0 0 6px 0;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b7791f;
        }

        .title {
          margin: 0;
          font-size: 26px;
          line-height: 1.1;
          font-weight: 800;
          color: #0f172a;
        }

        .subtitle {
          margin: 6px 0 0 0;
          font-size: 14px;
          color: #64748b;
        }

        .icon-button {
          border: none;
          background: #f8fafc;
          color: #0f172a;
          width: 36px;
          height: 36px;
          border-radius: 999px;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid #dbe4f0;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        input:disabled,
        select:disabled,
        textarea:disabled {
          background: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
        }

        .shift-master-preview {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .preview-header strong {
          font-size: 16px;
          color: #0f172a;
        }

        .preview-grid {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .preview-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 4px;
        }

        .preview-value {
          display: block;
          font-size: 14px;
          color: #0f172a;
        }

        .flag-row {
          margin-top: 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
        }

        .type-badge.general {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #334155;
        }

        .type-badge.restaurante {
          background: #fff8e6;
          border-color: #fcd34d;
          color: #92400e;
        }

        .type-badge.pisos {
          background: #ecfeff;
          border-color: #a5f3fc;
          color: #155e75;
        }

        .state-box {
          padding: 20px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
        }

        .state-box.compact {
          padding: 12px 14px;
        }

        .error-box {
          border: 1px solid #fecaca;
          background: #fff7f7;
          color: #991b1b;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 14px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 8px;
        }

        .button {
          border: none;
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .button:hover {
          transform: translateY(-1px);
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .button.primary {
          background: #b7791f;
          color: #ffffff;
        }

        .button.danger {
  background: #fee2e2;
  color: #991b1b;
}

.button.danger:hover {
  background: #fecaca;
}
              
        .button.secondary {
          background: #0f172a;
          color: #ffffff;
        }

        @media (max-width: 640px) {
          .modal {
            padding: 18px;
          }

          .preview-grid {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column-reverse;
          }

          .button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

function MiniFlag({ active, label }: { active: boolean; label: string }) {
  return (
    <>
      <span className={`flag ${active ? "active" : "inactive"}`}>{label}</span>

      <style jsx>{`
        .flag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .flag.active {
          background: #fff7ed;
          border-color: #fdba74;
          color: #9a3412;
        }

        .flag.inactive {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #94a3b8;
        }
      `}</style>
    </>
  );
}


function formatType(type: ShiftMasterType) {
  switch (type) {
    case "GENERAL":
      return "General";
    case "RESTAURANTE":
      return "Restaurante";
    case "PISOS":
      return "Pisos";
    default:
      return type;
  }
}

function formatMinute(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getDatesBetween(startValue: string, endValue: string) {
  const start = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T00:00:00`);

  const normalizedStart = start <= end ? start : end;
  const normalizedEnd = start <= end ? end : start;

  const result: string[] = [];
  const current = new Date(normalizedStart);

  while (current <= normalizedEnd) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");

    result.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildApiDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}