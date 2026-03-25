"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import ShiftForm from "@/components/shifts/shift-form";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  isActive: boolean;
};

type ShiftStatus = "BORRADOR" | "PUBLICADO" | "CANCELADO";
type ShiftMasterType = "GENERAL" | "RESTAURANTE" | "PISOS";

type Shift = {
  id: string;
  employeeId: string;
  workplaceId: string;
  departmentId: string;
  jobCategoryId: string | null;
  shiftMasterId: string | null;
  startAt: string;
  endAt: string;
  status: ShiftStatus;
  notes: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
  workplace: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
  jobCategory: {
    id: string;
    name: string;
    shortName: string | null;
    textColor: string | null;
  } | null;
  shiftMaster: {
    id: string;
    code: string;
    name: string;
    type: ShiftMasterType;
    backgroundColor: string | null;
  } | null;
};

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function TurnosPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getStartOfWeek(new Date())
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index)),
    [currentWeekStart]
  );

  useEffect(() => {
    void loadWeekData(currentWeekStart);
  }, [currentWeekStart]);

  async function loadWeekData(weekStart: Date) {
    try {
      setIsLoading(true);
      setError(null);

      const startAt = startOfDay(weekStart);
      const endAt = endOfDay(addDays(weekStart, 6));

      const [employeesResponse, shiftsResponse] = await Promise.all([
        fetch("/api/employees", { cache: "no-store" }),
        fetch(
          `/api/shifts?startAt=${encodeURIComponent(startAt.toISOString())}&endAt=${encodeURIComponent(
            endAt.toISOString()
          )}`,
          { cache: "no-store" }
        ),
      ]);

      if (!employeesResponse.ok) {
        throw new Error("No se pudieron cargar los empleados.");
      }

      if (!shiftsResponse.ok) {
        throw new Error("No se pudieron cargar los turnos.");
      }

      const employeesData = (await employeesResponse.json()) as Employee[];
      const shiftsData = (await shiftsResponse.json()) as Shift[];

      setEmployees(
        employeesData
          .filter((employee) => employee.isActive)
          .sort((a, b) =>
            `${a.lastName} ${a.firstName}`.localeCompare(
              `${b.lastName} ${b.firstName}`,
              "es"
            )
          )
      );
      setShifts(shiftsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ha ocurrido un error inesperado."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function goToPreviousWeek() {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  }

  function goToNextWeek() {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  }

  function goToCurrentWeek() {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  }

  async function handleCreated() {
    await loadWeekData(currentWeekStart);
  }

  return (
    <>
      <div className="page-shell">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">HORION</p>
            <h1 className="page-title">Turnos</h1>
            <p className="page-subtitle">
              Vista semanal inicial de planificación
            </p>
          </div>

          <div className="toolbar">
            <button className="toolbar-button primary" onClick={() => setShowForm(true)}>
              + Nuevo turno
            </button>

            <button className="toolbar-button secondary" onClick={goToPreviousWeek}>
              ← Semana anterior
            </button>

            <button className="toolbar-button secondary" onClick={goToCurrentWeek}>
              Hoy
            </button>

            <button className="toolbar-button secondary" onClick={goToNextWeek}>
              Semana siguiente →
            </button>
          </div>
        </div>

        <div className="week-range-card">
          <div>
            <span className="week-range-label">Semana</span>
            <strong className="week-range-value">
              {formatLongDate(weekDays[0])} — {formatLongDate(weekDays[6])}
            </strong>
          </div>

          <div className="week-summary">
            <div className="summary-item">
              <span className="summary-value">{employees.length}</span>
              <span className="summary-label">empleados</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{shifts.length}</span>
              <span className="summary-label">turnos</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="state-card error">
            <p>{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="state-card">
            <p>Cargando planificación semanal...</p>
          </div>
        ) : (
          <div className="planner-card">
            <div className="planner-grid">
              <div className="planner-corner">Empleado</div>

              {weekDays.map((day, index) => (
                <div key={day.toISOString()} className="planner-day-header">
                  <span className="planner-day-name">{DAY_NAMES[index]}</span>
                  <span className="planner-day-date">{formatDayNumber(day)}</span>
                </div>
              ))}

              {employees.map((employee) => (
                <WeeklyEmployeeRow
                  key={employee.id}
                  employee={employee}
                  weekDays={weekDays}
                  shifts={shifts.filter((shift) => shift.employeeId === employee.id)}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && employees.length === 0 ? (
          <div className="state-card">
            <p>No hay empleados activos para mostrar.</p>
          </div>
        ) : null}
      </div>

      {showForm ? (
        <ShiftForm
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      ) : null}

      <style jsx>{`
        .page-shell {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #f6f8fc;
          min-height: 100%;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .page-eyebrow {
          margin: 0 0 6px 0;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b7791f;
        }

        .page-title {
          margin: 0;
          font-size: 32px;
          line-height: 1.1;
          font-weight: 800;
          color: #0f172a;
        }

        .page-subtitle {
          margin: 8px 0 0 0;
          color: #475569;
          font-size: 14px;
        }

        .toolbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .toolbar-button {
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .toolbar-button:hover {
          transform: translateY(-1px);
        }

        .toolbar-button.primary {
          background: #b7791f;
          color: white;
        }

        .toolbar-button.secondary {
          background: #0f172a;
          color: white;
        }

        .week-range-card,
        .planner-card,
        .state-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .week-range-card {
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .week-range-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 6px;
        }

        .week-range-value {
          font-size: 16px;
          color: #0f172a;
        }

        .week-summary {
          display: flex;
          gap: 12px;
        }

        .summary-item {
          min-width: 92px;
          padding: 10px 12px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .summary-value {
          display: block;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }

        .summary-label {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }

        .state-card {
          padding: 24px;
        }

        .state-card.error {
          border-color: #fecaca;
          background: #fff7f7;
          color: #991b1b;
        }

        .planner-card {
          overflow: auto;
        }

        .planner-grid {
          display: grid;
          grid-template-columns: 260px repeat(7, minmax(180px, 1fr));
          min-width: 1520px;
        }

        .planner-corner {
          position: sticky;
          left: 0;
          z-index: 3;
          background: #0f172a;
          color: white;
          padding: 16px;
          font-size: 13px;
          font-weight: 700;
          border-right: 1px solid #1e293b;
        }

        .planner-day-header {
          background: #0f172a;
          color: white;
          padding: 16px;
          border-left: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .planner-day-name {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #cbd5e1;
        }

        .planner-day-date {
          font-size: 20px;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .page-shell {
            padding: 16px;
          }

          .page-title {
            font-size: 26px;
          }
        }
      `}</style>
    </>
  );
}

type WeeklyEmployeeRowProps = {
  employee: Employee;
  weekDays: Date[];
  shifts: Shift[];
};

function WeeklyEmployeeRow({
  employee,
  weekDays,
  shifts,
}: WeeklyEmployeeRowProps) {
  return (
    <>
      <div className="employee-cell">
        <div className="employee-info">
          <div className="employee-avatar">
            {employee.photoUrl ? (
              <Image
                src={employee.photoUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                fill
                sizes="40px"
              />
            ) : (
              <span>{getInitials(employee.firstName, employee.lastName)}</span>
            )}
          </div>

          <div className="employee-text">
            <strong>
              {employee.firstName} {employee.lastName}
            </strong>
          </div>
        </div>
      </div>

      {weekDays.map((day) => {
        const dayShifts = shifts
          .filter((shift) => isSameDay(new Date(shift.startAt), day))
          .sort(
            (a, b) =>
              new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
          );

        return (
          <div key={`${employee.id}-${day.toISOString()}`} className="day-cell">
            {dayShifts.length === 0 ? (
              <div className="empty-day">—</div>
            ) : (
              <div className="shift-list">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={`shift-card ${shift.status.toLowerCase()}`}
                    style={{
                      background:
                        shift.shiftMaster?.backgroundColor ||
                        getStatusBackground(shift.status),
                    }}
                  >
                    <div className="shift-card-top">
                      <div className="shift-time">
                        {formatTime(shift.startAt)} - {formatTime(shift.endAt)}
                      </div>

                      {shift.shiftMaster ? (
                        <span className={`shift-type ${shift.shiftMaster.type.toLowerCase()}`}>
                          {formatType(shift.shiftMaster.type)}
                        </span>
                      ) : null}
                    </div>

                    <div className="shift-master-name">
                      {shift.shiftMaster?.name || "Turno manual"}
                    </div>

                    <div className="shift-meta">
                      <span>{shift.department.name}</span>
                      {shift.jobCategory?.shortName || shift.jobCategory?.name ? (
                        <span
                          style={{
                            color: shift.jobCategory?.textColor || undefined,
                          }}
                        >
                          {" · "}
                          {shift.jobCategory.shortName || shift.jobCategory.name}
                        </span>
                      ) : null}
                    </div>

                    <div className="shift-workplace">{shift.workplace.name}</div>

                    {shift.notes ? (
                      <div className="shift-notes">{shift.notes}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <style jsx>{`
        .employee-cell {
          position: sticky;
          left: 0;
          z-index: 2;
          background: white;
          border-top: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          padding: 12px 14px;
        }

        .employee-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .employee-avatar {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
          background: #dbeafe;
          color: #1e3a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        .employee-text {
          min-width: 0;
        }

        .employee-text strong {
          display: block;
          font-size: 14px;
          color: #0f172a;
          line-height: 1.25;
        }

        .day-cell {
          min-height: 116px;
          padding: 10px;
          border-top: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .empty-day {
          height: 100%;
          min-height: 96px;
          border: 1px dashed #dbe4f0;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 18px;
        }

        .shift-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .shift-card {
          border-radius: 14px;
          padding: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .shift-card.borrador {
          border-color: #fcd34d;
        }

        .shift-card.publicado {
          border-color: #93c5fd;
        }

        .shift-card.cancelado {
          border-color: #fecaca;
          opacity: 0.8;
        }

        .shift-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }

        .shift-time {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }

        .shift-type {
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

        .shift-type.general {
          background: rgba(255, 255, 255, 0.7);
          border-color: #cbd5e1;
          color: #334155;
        }

        .shift-type.restaurante {
          background: rgba(255, 248, 230, 0.85);
          border-color: #fcd34d;
          color: #92400e;
        }

        .shift-type.pisos {
          background: rgba(236, 254, 255, 0.85);
          border-color: #a5f3fc;
          color: #155e75;
        }

        .shift-master-name {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        .shift-meta {
          margin-top: 4px;
          font-size: 12px;
          color: #334155;
        }

        .shift-workplace {
          margin-top: 4px;
          font-size: 12px;
          color: #64748b;
        }

        .shift-notes {
          margin-top: 6px;
          font-size: 12px;
          color: #475569;
        }
      `}</style>
    </>
  );
}

function getStartOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);

  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDayNumber(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getStatusBackground(status: ShiftStatus) {
  switch (status) {
    case "BORRADOR":
      return "#fff8e6";
    case "PUBLICADO":
      return "#eff6ff";
    case "CANCELADO":
      return "#fff1f2";
    default:
      return "#f8fafc";
  }
}