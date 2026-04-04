"use client";

import { useEffect, useMemo, useState } from "react";

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
};

type AbsenceTypeOption = {
  id: string;
  code: string;
  name: string;
  durationMode: "FULL_DAY" | "HOURLY" | "BOTH";
  color: string | null;
};

type AbsencePayload = {
  employeeId: string;
  absenceTypeId: string;
  unit: "FULL_DAY" | "HOURLY";
  startDate: string;
  endDate: string;
  startMinutes?: number | null;
  endMinutes?: number | null;
  notes?: string;
};

type AbsenceFormProps = {
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  initialEmployeeId?: string;
  initialDate?: string;
};

export default function AbsenceForm({
  onClose,
  onCreated,
  initialEmployeeId = "",
  initialDate = "",
}: AbsenceFormProps) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceTypeOption[]>([]);

  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [absenceTypeId, setAbsenceTypeId] = useState("");
  const [unit, setUnit] = useState<"FULL_DAY" | "HOURLY">("FULL_DAY");
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadCatalogs();
  }, []);

  const selectedAbsenceType = useMemo(
    () => absenceTypes.find((item) => item.id === absenceTypeId) ?? null,
    [absenceTypeId, absenceTypes]
  );

  useEffect(() => {
    if (!selectedAbsenceType) return;

    if (selectedAbsenceType.durationMode === "FULL_DAY" && unit !== "FULL_DAY") {
      setUnit("FULL_DAY");
    }

    if (selectedAbsenceType.durationMode === "HOURLY" && unit !== "HOURLY") {
      setUnit("HOURLY");
    }
  }, [selectedAbsenceType, unit]);

  useEffect(() => {
    if (unit === "FULL_DAY") {
      setStartTime("");
      setEndTime("");
    } else if (startDate && endDate && startDate !== endDate) {
      setEndDate(startDate);
    }
  }, [unit, startDate, endDate]);

  async function loadCatalogs() {
    try {
      setIsLoadingCatalogs(true);
      setError(null);

      const [employeesResponse, absenceTypesResponse] = await Promise.all([
        fetch("/api/employees", { cache: "no-store" }),
        fetch("/api/absence-types", { cache: "no-store" }),
      ]);

      if (!employeesResponse.ok) {
        throw new Error("No se pudieron cargar los empleados.");
      }

      if (!absenceTypesResponse.ok) {
        throw new Error("No se pudieron cargar los tipos de ausencia.");
      }

      const employeesData = (await employeesResponse.json()) as EmployeeOption[];
      const absenceTypesData = (await absenceTypesResponse.json()) as AbsenceTypeOption[];

      setEmployees(
        employeesData
          .filter((employee) => employee.isActive)
          .sort((a, b) =>
            `${a.lastName ?? ""} ${a.firstName}`.localeCompare(
              `${b.lastName ?? ""} ${b.firstName}`,
              "es"
            )
          )
      );

      setAbsenceTypes(
        [...absenceTypesData].sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ha ocurrido un error inesperado."
      );
    } finally {
      setIsLoadingCatalogs(false);
    }
  }

  function toMinutes(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      if (!employeeId) {
        throw new Error("Debes seleccionar un empleado.");
      }

      if (!absenceTypeId) {
        throw new Error("Debes seleccionar un tipo de ausencia.");
      }

      if (!startDate) {
        throw new Error("Debes indicar la fecha de inicio.");
      }

      if (!endDate) {
        throw new Error("Debes indicar la fecha de fin.");
      }

      const payload: AbsencePayload = {
        employeeId,
        absenceTypeId,
        unit,
        startDate,
        endDate,
        notes: notes.trim() || undefined,
      };

      if (unit === "HOURLY") {
        if (!startTime || !endTime) {
          throw new Error("Debes indicar hora de inicio y hora de fin.");
        }

        if (startDate !== endDate) {
          throw new Error("Una ausencia por horas debe ser de un solo día.");
        }

        const startMinutes = toMinutes(startTime);
        const endMinutes = toMinutes(endTime);

        if (endMinutes <= startMinutes) {
          throw new Error("La hora de fin debe ser posterior a la hora de inicio.");
        }

        payload.startMinutes = startMinutes;
        payload.endMinutes = endMinutes;
      }

      const response = await fetch("/api/absences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(responseData?.error || "No se pudo crear la ausencia.");
      }

      await onCreated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ha ocurrido un error inesperado."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const hourlyDisabled = selectedAbsenceType?.durationMode === "FULL_DAY";
  const fullDayDisabled = selectedAbsenceType?.durationMode === "HOURLY";

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="header">
          <div>
            <p className="eyebrow">TURNOHOTEL</p>
            <h2 className="title">Nueva ausencia</h2>
            <p className="subtitle">
              Registra una ausencia individual desde el cuadrante.
            </p>
          </div>

          <button type="button" className="closeButton" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {error ? (
          <div className="errorBox">
            <p>{error}</p>
          </div>
        ) : null}

        <form className="form" onSubmit={handleSubmit}>
          <div className="grid">
            <div className="field">
              <label htmlFor="employeeId">Empleado</label>
              <select
                id="employeeId"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                disabled={isLoadingCatalogs || isSubmitting}
              >
                <option value="">Selecciona un empleado</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="absenceTypeId">Tipo de ausencia</label>
              <select
                id="absenceTypeId"
                value={absenceTypeId}
                onChange={(event) => setAbsenceTypeId(event.target.value)}
                disabled={isLoadingCatalogs || isSubmitting}
              >
                <option value="">Selecciona un tipo</option>
                {absenceTypes.map((absenceType) => (
                  <option key={absenceType.id} value={absenceType.id}>
                    {absenceType.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="unit">Unidad</label>
              <select
                id="unit"
                value={unit}
                onChange={(event) =>
                  setUnit(event.target.value as "FULL_DAY" | "HOURLY")
                }
                disabled={isSubmitting}
              >
                <option value="FULL_DAY" disabled={fullDayDisabled}>
                  Día completo
                </option>
                <option value="HOURLY" disabled={hourlyDisabled}>
                  Por horas
                </option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="startDate">Fecha inicio</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setStartDate(value);
                  if (unit === "HOURLY") {
                    setEndDate(value);
                  }
                }}
                disabled={isSubmitting}
              />
            </div>

            <div className="field">
              <label htmlFor="endDate">Fecha fin</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                disabled={isSubmitting || unit === "HOURLY"}
              />
            </div>

            {unit === "HOURLY" ? (
              <>
                <div className="field">
                  <label htmlFor="startTime">Hora inicio</label>
                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="field">
                  <label htmlFor="endTime">Hora fin</label>
                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </>
            ) : null}

            <div className="field fieldFull">
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Añade una observación si aplica"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="actions">
            <button
              type="button"
              className="secondaryButton"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primaryButton"
              disabled={isLoadingCatalogs || isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Crear ausencia"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          background: rgba(15, 23, 42, 0.48);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .modal {
          width: 100%;
          max-width: 820px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.2);
          overflow: hidden;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .eyebrow {
          margin: 0 0 4px 0;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b7791f;
        }

        .title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
        }

        .subtitle {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .closeButton {
          border: none;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: #e2e8f0;
          color: #0f172a;
        }

        .errorBox {
          margin: 16px 20px 0 20px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #fecaca;
          background: #fff7f7;
          color: #991b1b;
          font-size: 13px;
        }

        .form {
          padding: 20px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fieldFull {
          grid-column: 1 / -1;
        }

        .field label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .field select,
        .field input,
        .field textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          color: #0f172a;
          background: white;
          outline: none;
        }

        .field select:focus,
        .field input:focus,
        .field textarea:focus {
          border-color: #b7791f;
          box-shadow: 0 0 0 3px rgba(183, 121, 31, 0.12);
        }

        .field textarea {
          resize: vertical;
          min-height: 96px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .primaryButton,
        .secondaryButton {
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .primaryButton {
          background: #b7791f;
          color: white;
        }

        .secondaryButton {
          background: #e2e8f0;
          color: #0f172a;
        }

        .primaryButton:disabled,
        .secondaryButton:disabled,
        .closeButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .header {
            flex-direction: column;
          }

          .actions {
            flex-direction: column-reverse;
          }

          .primaryButton,
          .secondaryButton,
          .closeButton {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}