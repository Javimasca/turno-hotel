"use client";

import { useEffect, useMemo, useState } from "react";

type ShiftMasterType = "GENERAL" | "RESTAURANTE" | "PISOS";

type Workplace = {
  id: string;
  name: string;
  isActive?: boolean;
};

type Department = {
  id: string;
  name: string;
  workplaceId: string;
  isActive?: boolean;
};

type ShiftMasterFormData = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  workplaceId: string;
  departmentId: string;
  type: ShiftMasterType;
  startMinute: number;
  endMinute: number;
  crossesMidnight: boolean;
  isPartial: boolean;
  coversBreakfast: boolean;
  coversLunch: boolean;
  coversDinner: boolean;
  countsForRoomAssignment: boolean;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
  shiftMaster?: ShiftMasterFormData | null;
};

const MORNING_COLOR = "#FEF3C7";
const AFTERNOON_COLOR = "#B7791F";
const NIGHT_COLOR = "#0F172A";

export default function ShiftMasterForm({
  open,
  onOpenChange,
  onSuccess,
  shiftMaster = null,
}: Props) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    workplaceId: "",
    departmentId: "",
    type: "GENERAL" as ShiftMasterType,
    startHour: "08:00",
    endHour: "16:00",
    crossesMidnight: false,
    isPartial: false,
    coversBreakfast: false,
    coversLunch: false,
    coversDinner: false,
    countsForRoomAssignment: false,
  });

  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(shiftMaster);

  const availableDepartments = useMemo(() => {
    return departments.filter(
      (department) => department.workplaceId === form.workplaceId
    );
  }, [departments, form.workplaceId]);

  const resolvedColor = useMemo(() => {
    return getAutoColor(form.endHour);
  }, [form.endHour]);

  const resolvedTextColor = useMemo(() => {
    return resolvedColor === NIGHT_COLOR ? "#FFFFFF" : "#0F172A";
  }, [resolvedColor]);

  const resolvedColorLabel = useMemo(() => {
    return getColorLabel(form.endHour);
  }, [form.endHour]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadData();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!shiftMaster) {
      setForm({
        code: "",
        name: "",
        description: "",
        workplaceId: "",
        departmentId: "",
        type: "GENERAL",
        startHour: "08:00",
        endHour: "16:00",
        crossesMidnight: false,
        isPartial: false,
        coversBreakfast: false,
        coversLunch: false,
        coversDinner: false,
        countsForRoomAssignment: false,
      });
      setError(null);
      return;
    }

    setForm({
      code: shiftMaster.code,
      name: shiftMaster.name,
      description: shiftMaster.description ?? "",
      workplaceId: shiftMaster.workplaceId,
      departmentId: shiftMaster.departmentId,
      type: shiftMaster.type,
      startHour: minuteToTime(shiftMaster.startMinute),
      endHour: minuteToTime(shiftMaster.endMinute),
      crossesMidnight: shiftMaster.crossesMidnight,
      isPartial: shiftMaster.isPartial,
      coversBreakfast: shiftMaster.coversBreakfast,
      coversLunch: shiftMaster.coversLunch,
      coversDinner: shiftMaster.coversDinner,
      countsForRoomAssignment: shiftMaster.countsForRoomAssignment,
    });
    setError(null);
  }, [open, shiftMaster]);

  useEffect(() => {
    if (!form.workplaceId) {
      if (form.departmentId) {
        setForm((prev) => ({ ...prev, departmentId: "" }));
      }
      return;
    }

    const departmentStillValid = availableDepartments.some(
      (department) => department.id === form.departmentId
    );

    if (!departmentStillValid && form.departmentId) {
      setForm((prev) => ({ ...prev, departmentId: "" }));
    }
  }, [form.workplaceId, form.departmentId, availableDepartments]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [wpRes, depRes] = await Promise.all([
        fetch("/api/workplaces", { cache: "no-store" }),
        fetch("/api/departments", { cache: "no-store" }),
      ]);

      const wpData = await wpRes.json();
      const depData = await depRes.json();

      if (!wpRes.ok) {
        throw new Error(wpData.error || "No se pudieron cargar los centros.");
      }

      if (!depRes.ok) {
        throw new Error(
          depData.error || "No se pudieron cargar los departamentos."
        );
      }

      setWorkplaces(
        (wpData as Workplace[])
          .filter((workplace) => workplace.isActive !== false)
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );

      setDepartments(
        (depData as Department[])
          .filter((department) => department.isActive !== false)
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos.");
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm({
      code: "",
      name: "",
      description: "",
      workplaceId: "",
      departmentId: "",
      type: "GENERAL",
      startHour: "08:00",
      endHour: "16:00",
      crossesMidnight: false,
      isPartial: false,
      coversBreakfast: false,
      coversLunch: false,
      coversDinner: false,
      countsForRoomAssignment: false,
    });
    setError(null);
    setIsSubmitting(false);
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function timeToMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        workplaceId: form.workplaceId,
        departmentId: form.departmentId,
        type: form.type,
        startMinute: timeToMinutes(form.startHour),
        endMinute: timeToMinutes(form.endHour),
        crossesMidnight: form.crossesMidnight,
        isPartial: form.isPartial,
        coversBreakfast: form.coversBreakfast,
        coversLunch: form.coversLunch,
        coversDinner: form.coversDinner,
        countsForRoomAssignment: form.countsForRoomAssignment,
      };

      const response = await fetch(
        isEditMode && shiftMaster
          ? `/api/shift-masters/${shiftMaster.id}`
          : "/api/shift-masters",
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (isEditMode
              ? "No se pudo actualizar el maestro de turno."
              : "No se pudo crear el maestro de turno.")
        );
      }

      await onSuccess();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="overlay" onClick={handleClose} />

      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-master-form-title"
      >
        <div className="modal-header">
          <h2 id="shift-master-form-title">
            {isEditMode ? "Editar maestro de turno" : "Nuevo maestro de turno"}
          </h2>
          <p className="modal-subtitle">
            El color se asigna automáticamente según la hora de salida.
          </p>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Cargando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <div className="grid">
              <input
                placeholder="Código"
                value={form.code}
                onChange={(e) => updateField("code", e.target.value)}
                required
              />

              <input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />

              <select
                value={form.workplaceId}
                onChange={(e) => updateField("workplaceId", e.target.value)}
                required
              >
                <option value="">Centro</option>
                {workplaces.map((workplace) => (
                  <option key={workplace.id} value={workplace.id}>
                    {workplace.name}
                  </option>
                ))}
              </select>

              <select
                value={form.departmentId}
                onChange={(e) => updateField("departmentId", e.target.value)}
                required
                disabled={!form.workplaceId}
              >
                <option value="">Departamento</option>
                {availableDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>

              <select
                value={form.type}
                onChange={(e) =>
                  updateField("type", e.target.value as ShiftMasterType)
                }
              >
                <option value="GENERAL">General</option>
                <option value="RESTAURANTE">Restaurante</option>
                <option value="PISOS">Pisos</option>
              </select>

              <div className="color-preview-field">
                <span className="color-preview-label">Color automático</span>
                <div
                  className="color-preview-badge"
                  style={{
                    backgroundColor: resolvedColor,
                    color: resolvedTextColor,
                  }}
                >
                  <span>{resolvedColorLabel}</span>
                  <strong>{resolvedColor}</strong>
                </div>
              </div>
            </div>

            <div className="grid">
              <input
                type="time"
                value={form.startHour}
                onChange={(e) => updateField("startHour", e.target.value)}
                required
              />
              <input
                type="time"
                value={form.endHour}
                onChange={(e) => updateField("endHour", e.target.value)}
                required
              />
            </div>

            <div className="schedule-hint">
              <span>
                Salida hasta 12:00 → mañana · de 12:00 a 17:59 → tarde · desde
                18:00 → noche
              </span>
            </div>

            <div className="toggles">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.crossesMidnight}
                  onChange={(e) =>
                    updateField("crossesMidnight", e.target.checked)
                  }
                />
                Cruza medianoche
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.isPartial}
                  onChange={(e) => updateField("isPartial", e.target.checked)}
                />
                Turno parcial
              </label>
            </div>

            {form.type === "RESTAURANTE" ? (
              <div className="flags">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.coversBreakfast}
                    onChange={(e) =>
                      updateField("coversBreakfast", e.target.checked)
                    }
                  />
                  Desayuno
                </label>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.coversLunch}
                    onChange={(e) =>
                      updateField("coversLunch", e.target.checked)
                    }
                  />
                  Almuerzo
                </label>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.coversDinner}
                    onChange={(e) =>
                      updateField("coversDinner", e.target.checked)
                    }
                  />
                  Cena
                </label>
              </div>
            ) : null}

            {form.type === "PISOS" ? (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.countsForRoomAssignment}
                  onChange={(e) =>
                    updateField("countsForRoomAssignment", e.target.checked)
                  }
                />
                Cuenta para habitaciones
              </label>
            ) : null}

            {error ? <p className="error">{error}</p> : null}

            <div className="actions">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="primary"
              >
                {isSubmitting
                  ? isEditMode
                    ? "Guardando..."
                    : "Creando..."
                  : isEditMode
                  ? "Guardar cambios"
                  : "Crear"}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          z-index: 1000;
        }

        .modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(680px, calc(100vw - 32px));
          max-height: calc(100vh - 32px);
          overflow: auto;
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
          z-index: 1001;
        }

        .modal-header {
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 800;
          color: #0f172a;
        }

        .modal-subtitle {
          margin: 8px 0 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .loading-state {
          padding: 8px 0;
          color: #475569;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        input,
        select {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #dbe4f0;
          background: white;
          color: #0f172a;
          font-size: 14px;
        }

        .color-preview-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .color-preview-label {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }

        .color-preview-badge {
          min-height: 48px;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .schedule-hint {
          padding: 12px 14px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 13px;
        }

        .toggles,
        .flags {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #334155;
        }

        .checkbox input {
          width: auto;
          margin: 0;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }

        .actions button {
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .actions .secondary {
          background: #e2e8f0;
          color: #0f172a;
        }

        .actions .primary {
          background: #b7791f;
          color: white;
        }

        .error {
          margin: 0;
          color: #dc2626;
          font-size: 14px;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .modal {
            padding: 18px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column-reverse;
          }

          .actions button {
            width: 100%;
          }

          .color-preview-badge {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}

function getAutoColor(endHour: string) {
  const [hours] = endHour.split(":").map(Number);

  if (hours < 12) {
    return MORNING_COLOR;
  }

  if (hours < 18) {
    return AFTERNOON_COLOR;
  }

  return NIGHT_COLOR;
}

function getColorLabel(endHour: string) {
  const [hours] = endHour.split(":").map(Number);

  if (hours < 12) {
    return "Turno de mañana";
  }

  if (hours < 18) {
    return "Turno de tarde";
  }

  return "Turno de noche";
}

function minuteToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}