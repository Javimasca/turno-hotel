"use client";

import { useEffect, useMemo, useState } from "react";

type ShiftMasterType = "GENERAL" | "RESTAURANTE" | "PISOS";

type Workplace = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

type WorkArea = {
  id: string;
  code: string;
  name: string;
  departmentId: string;
};

type ShiftMaster = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  workplaceId: string;
  departmentId: string;
  workAreaId: string | null;
  type: ShiftMasterType;
  startMinute: number;
  endMinute: number;
  crossesMidnight: boolean;
  isPartial: boolean;
  effectiveCleaningMinutes: number | null;
  coversBreakfast: boolean;
  coversLunch: boolean;
  coversDinner: boolean;
  countsForRoomAssignment: boolean;
  isActive: boolean;
  workplace: Workplace;
  department: Department;
  workArea: WorkArea | null;
};

type FormState = {
  code: string;
  name: string;
  description: string;
  workplaceId: string;
  departmentId: string;
  workAreaId: string;
  type: ShiftMasterType;
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
  isPartial: boolean;
  effectiveCleaningMinutes: string;
  coversBreakfast: boolean;
  coversLunch: boolean;
  coversDinner: boolean;
  countsForRoomAssignment: boolean;
  isActive: boolean;
};

const initialForm: FormState = {
  code: "",
  name: "",
  description: "",
  workplaceId: "",
  departmentId: "",
  workAreaId: "",
  type: "GENERAL",
  startTime: "08:00",
  endTime: "16:00",
  crossesMidnight: false,
  isPartial: false,
  effectiveCleaningMinutes: "",
  coversBreakfast: false,
  coversLunch: false,
  coversDinner: false,
  countsForRoomAssignment: false,
  isActive: true,
};

export default function ShiftMastersPage() {
  const [shiftMasters, setShiftMasters] = useState<ShiftMaster[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredDepartments = useMemo(() => {
    if (!form.workplaceId) return departments;
    return departments;
  }, [departments, form.workplaceId]);

  const filteredWorkAreas = useMemo(() => {
    if (!form.departmentId) return [];
    return workAreas.filter((workArea) => workArea.departmentId === form.departmentId);
  }, [workAreas, form.departmentId]);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!form.workplaceId) {
      setDepartments([]);
      setWorkAreas([]);
      setForm((prev) => ({ ...prev, departmentId: "", workAreaId: "" }));
      return;
    }

    void loadDepartments(form.workplaceId);
  }, [form.workplaceId]);

  useEffect(() => {
    if (!form.departmentId) {
      setWorkAreas([]);
      setForm((prev) => ({ ...prev, workAreaId: "" }));
      return;
    }

    void loadWorkAreas(form.departmentId);
  }, [form.departmentId]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);

      const [shiftMastersResponse, workplacesResponse] = await Promise.all([
        fetch("/api/shift-masters", { cache: "no-store" }),
        fetch("/api/workplaces", { cache: "no-store" }),
      ]);

      const shiftMastersData = await shiftMastersResponse.json();
      const workplacesData = await workplacesResponse.json();

      if (!shiftMastersResponse.ok) {
        throw new Error(
          shiftMastersData.error || "No se pudieron cargar los maestros de turno."
        );
      }

      if (!workplacesResponse.ok) {
        throw new Error(
          workplacesData.error || "No se pudieron cargar los centros."
        );
      }

      setShiftMasters(Array.isArray(shiftMastersData) ? shiftMastersData : []);
      setWorkplaces(Array.isArray(workplacesData) ? workplacesData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDepartments(workplaceId: string) {
    try {
      const response = await fetch(
        `/api/departments?workplaceId=${encodeURIComponent(workplaceId)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar los departamentos.");
      }

      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error cargando departamentos."
      );
      setDepartments([]);
    }
  }

  async function loadWorkAreas(departmentId: string) {
    try {
      const response = await fetch(
        `/api/work-areas?departmentId=${encodeURIComponent(departmentId)}&isActive=true`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar las áreas.");
      }

      setWorkAreas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando áreas.");
      setWorkAreas([]);
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

      if (!form.code.trim()) throw new Error("El código es obligatorio.");
      if (!form.name.trim()) throw new Error("El nombre es obligatorio.");
      if (!form.workplaceId) throw new Error("Selecciona un centro.");
      if (!form.departmentId) throw new Error("Selecciona un departamento.");

      const response = await fetch(
  editingId ? `/api/shift-masters/${editingId}` : "/api/shift-masters",
  {
    method: editingId ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim() || null,
          workplaceId: form.workplaceId,
          departmentId: form.departmentId,
          workAreaId: form.workAreaId || null,
          type: form.type,
          startMinute: timeToMinutes(form.startTime),
          endMinute: timeToMinutes(form.endTime),
          crossesMidnight: form.crossesMidnight,
          isPartial: form.isPartial,
          effectiveCleaningMinutes:
            form.type === "PISOS" && form.effectiveCleaningMinutes.trim()
              ? Number(form.effectiveCleaningMinutes)
              : null,
          coversBreakfast: form.coversBreakfast,
          coversLunch: form.coversLunch,
          coversDinner: form.coversDinner,
          countsForRoomAssignment: form.countsForRoomAssignment,
          isActive: form.isActive,
                }),
      }
    );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el maestro de turno.");
      }

      setForm(initialForm);
setEditingId(null);
setIsFormOpen(false);
setDepartments([]);
setWorkAreas([]);
await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setIsSubmitting(false);
    }
  }

function handleEdit(item: ShiftMaster) {
  setEditingId(item.id);
  setIsFormOpen(true);

  setForm({
    code: item.code,
    name: item.name,
    description: item.description ?? "",
    workplaceId: item.workplaceId,
    departmentId: item.departmentId,
    workAreaId: item.workAreaId ?? "",
    type: item.type,
    startTime: formatMinutes(item.startMinute),
    endTime: formatMinutes(item.endMinute),
    crossesMidnight: item.crossesMidnight,
    isPartial: item.isPartial,
    effectiveCleaningMinutes:
      item.effectiveCleaningMinutes == null
        ? ""
        : String(item.effectiveCleaningMinutes),
    coversBreakfast: item.coversBreakfast,
    coversLunch: item.coversLunch,
    coversDinner: item.coversDinner,
    countsForRoomAssignment: item.countsForRoomAssignment,
    isActive: item.isActive,
  });

  void loadDepartments(item.workplaceId);
  if (item.departmentId) {
    void loadWorkAreas(item.departmentId);
  }
}

async function handleDelete(id: string) {
  const confirmed = window.confirm(
    "¿Seguro que quieres eliminar este maestro de turno?"
  );

  if (!confirmed) return;

  try {
    setError(null);

    const response = await fetch(`/api/shift-masters/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo eliminar el maestro de turno.");
    }

    await loadData();
  } catch (err) {
    setError(err instanceof Error ? err.message : "Error al eliminar.");
  }
}

function cancelEdit() {
  setEditingId(null);
  setIsFormOpen(false);
  setForm(initialForm);
  setDepartments([]);
  setWorkAreas([]);
}

function openCreateForm() {
  setEditingId(null);
  setForm(initialForm);
  setDepartments([]);
  setWorkAreas([]);
  setIsFormOpen(true);
}
  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Maestros</p>
          <h1>Maestro de turnos</h1>
          <p className="page-description">
            Gestiona las plantillas de turno que después se usan en cuadrantes y
            propuestas automáticas.
          </p>
        </div>
      </section>

      {error ? (
        <div className="state-card error">
          <p>{error}</p>
        </div>
      ) : null}

      <section className="layout-grid">
        {isFormOpen ? (
        <form className="form-card" onSubmit={handleSubmit}>
          <h2>{editingId ? "Editar maestro de turno" : "Nuevo maestro de turno"}</h2>

          <div className="form-grid">
            <div className="field">
              <label>Código</label>
              <input
                value={form.code}
                onChange={(event) => updateField("code", event.target.value)}
                placeholder="M1, CENA, PISOS..."
              />
            </div>

            <div className="field">
              <label>Nombre</label>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Mañana, Cena, Pisos..."
              />
            </div>

            <div className="field">
              <label>Centro</label>
              <select
                value={form.workplaceId}
                onChange={(event) =>
                  updateField("workplaceId", event.target.value)
                }
              >
                <option value="">Selecciona centro</option>
                {workplaces.map((workplace) => (
                  <option key={workplace.id} value={workplace.id}>
                    {workplace.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Departamento</label>
              <select
                value={form.departmentId}
                onChange={(event) =>
                  updateField("departmentId", event.target.value)
                }
                disabled={!form.workplaceId}
              >
                <option value="">Selecciona departamento</option>
                {filteredDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Área</label>
              <select
                value={form.workAreaId}
                onChange={(event) =>
                  updateField("workAreaId", event.target.value)
                }
                disabled={!form.departmentId}
              >
                <option value="">Sin área específica</option>
                {filteredWorkAreas.map((workArea) => (
                  <option key={workArea.id} value={workArea.id}>
                    {workArea.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Tipo</label>
              <select
                value={form.type}
                onChange={(event) =>
                  updateField("type", event.target.value as ShiftMasterType)
                }
              >
                <option value="GENERAL">General</option>
                <option value="RESTAURANTE">Restaurante</option>
                <option value="PISOS">Pisos</option>
              </select>
            </div>

            <div className="field">
              <label>Inicio</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => updateField("startTime", event.target.value)}
              />
            </div>

            <div className="field">
              <label>Fin</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => updateField("endTime", event.target.value)}
              />
            </div>

            {form.type === "PISOS" ? (
              <div className="field">
                <label>Minutos efectivos limpieza</label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={form.effectiveCleaningMinutes}
                  onChange={(event) =>
                    updateField("effectiveCleaningMinutes", event.target.value)
                  }
                  placeholder="Ej. 390"
                />
              </div>
            ) : null}

            <div className="field full">
              <label>Descripción</label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Notas internas sobre esta plantilla"
                rows={3}
              />
            </div>
          </div>

          <div className="checks-grid">
            <label>
              <input
                type="checkbox"
                checked={form.crossesMidnight}
                onChange={(event) =>
                  updateField("crossesMidnight", event.target.checked)
                }
              />
              Cruza medianoche
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.isPartial}
                onChange={(event) =>
                  updateField("isPartial", event.target.checked)
                }
              />
              Parcial
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.coversBreakfast}
                onChange={(event) =>
                  updateField("coversBreakfast", event.target.checked)
                }
              />
              Desayuno
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.coversLunch}
                onChange={(event) =>
                  updateField("coversLunch", event.target.checked)
                }
              />
              Almuerzo
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.coversDinner}
                onChange={(event) =>
                  updateField("coversDinner", event.target.checked)
                }
              />
              Cena
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.countsForRoomAssignment}
                onChange={(event) =>
                  updateField("countsForRoomAssignment", event.target.checked)
                }
              />
              Cuenta para habitaciones
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateField("isActive", event.target.checked)}
              />
              Activo
            </label>
          </div>

          <div className="actions">
  {editingId ? (
    <button type="button" className="secondary-button" onClick={cancelEdit}>
      Cancelar
    </button>
  ) : null}

  <button type="submit" disabled={isSubmitting}>
    {isSubmitting
      ? "Guardando..."
      : editingId
      ? "Guardar cambios"
      : "Crear maestro"}
  </button>
</div>

        </form>
        ) : null}

        <section className="list-card">
          <div className="list-header">
            <h2>Plantillas existentes</h2>
            <button type="button" className="create-button" onClick={openCreateForm}>
              Nuevo turno
            </button>
          </div>

          {isLoading ? (
            <div className="state-card">
              <p>Cargando maestros de turno...</p>
            </div>
          ) : shiftMasters.length === 0 ? (
            <div className="state-card">
              <p>No hay maestros de turno creados todavía.</p>
            </div>
          ) : (
            <div className="shift-master-list">
              {shiftMasters.map((item) => (
                <article key={item.id} className="shift-master-card">
                  <div>
                    <div className="card-top">
                      <strong>{item.name}</strong>
                      <span className={`badge ${item.type.toLowerCase()}`}>
                        {formatType(item.type)}
                      </span>
                    </div>

                    <p>
                      {item.code} · {formatMinutes(item.startMinute)} -{" "}
                      {formatMinutes(item.endMinute)}
                      {item.crossesMidnight ? " · Cruza medianoche" : ""}
                    </p>

                    <p>
                      {item.workplace?.name ?? "Sin centro"} ·{" "}
                      {item.department?.name ?? "Sin departamento"}
                      {item.workArea?.name ? ` · ${item.workArea.name}` : ""}
                    </p>
                  </div>

                  <div className="card-actions">
  <span className={item.isActive ? "status active" : "status inactive"}>
    {item.isActive ? "Activo" : "Inactivo"}
  </span>

  <button type="button" className="small-button" onClick={() => handleEdit(item)}>
    Editar
  </button>

  <button
    type="button"
    className="small-button danger"
    onClick={() => handleDelete(item.id)}
  >
    Borrar
  </button>
</div>

                </article>
              ))}
            </div>
          )}
        </section>
      </section>

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
        }

        .eyebrow {
          margin: 0 0 4px 0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b7791f;
        }

        h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 900;
          color: #0f172a;
        }

        .page-description {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: ${isFormOpen
            ? "minmax(360px, 0.9fr) minmax(0, 1.1fr)"
            : "1fr"};
          gap: 16px;
          align-items: start;
        }

        .form-card,
        .list-card,
        .state-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .form-card,
        .list-card {
          padding: 16px;
        }

        h2 {
          margin: 0 0 14px;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
        }

        .list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .list-header h2 {
          margin: 0;
        }

        .create-button {
          white-space: nowrap;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        label {
          font-size: 12px;
          font-weight: 800;
          color: #334155;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 9px 10px;
          font-size: 13px;
          color: #0f172a;
          background: white;
          outline: none;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #b7791f;
          box-shadow: 0 0 0 3px rgba(183, 121, 31, 0.12);
        }

        select:disabled {
          background: #f8fafc;
          color: #94a3b8;
        }

        .checks-grid {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .checks-grid label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          font-size: 12px;
        }

        .checks-grid input {
          width: auto;
        }

        .actions {
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
        }
        
        .actions {
  gap: 8px;
}

.secondary-button {
  background: #f1f5f9;
  color: #334155;
}

.card-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.small-button {
  padding: 7px 10px;
  font-size: 11px;
  background: #f1f5f9;
  color: #334155;
}

.small-button.danger {
  background: #fee2e2;
  color: #991b1b;
}

        button {
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          background: #b7791f;
          color: white;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .state-card {
          padding: 14px;
          color: #334155;
        }

        .state-card.error {
          border-color: #fecaca;
          background: #fff7f7;
          color: #991b1b;
        }

        .shift-master-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .shift-master-card {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px;
          background: #ffffff;
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .card-top strong {
          font-size: 15px;
          color: #0f172a;
        }

        .shift-master-card p {
          margin: 5px 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .badge,
        .status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 900;
        }

        .badge.general {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #cbd5e1;
        }

        .badge.restaurante {
          background: #fff8e6;
          color: #92400e;
          border: 1px solid #fcd34d;
        }

        .badge.pisos {
          background: #ecfeff;
          color: #155e75;
          border: 1px solid #a5f3fc;
        }

        .status.active {
          background: #ecfdf5;
          color: #047857;
        }

        .status.inactive {
          background: #f8fafc;
          color: #64748b;
        }

        @media (max-width: 1000px) {
          .layout-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .form-grid,
          .checks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
