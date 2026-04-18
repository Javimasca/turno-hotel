"use client";

import { useEffect, useMemo, useState } from "react";

type ServiceType = "BREAKFAST" | "LUNCH" | "DINNER";
type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type WeekDay = {
  key: DayKey;
  label: string;
  date: Date;
};

type CoversByDay = Record<DayKey, number>;

type WeeklyDemandDay = {
  date: string;
  serviceType: ServiceType;
  covers: number;
  ratioCoversPerEmployee: number;
  employeesNeeded: number;
};

type WeeklyProposalLine = {
  date: string;
  serviceType: ServiceType;
  startAt: string;
  endAt: string;
  employeesNeeded: number;
};

type WorkplaceOption = {
  id: string;
  name: string;
};

type DepartmentOption = {
  id: string;
  name: string;
};

const DAY_LABELS: Record<DayKey, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
};

const EMPTY_WEEK_VALUES: CoversByDay = {
  monday: 0,
  tuesday: 0,
  wednesday: 0,
  thursday: 0,
  friday: 0,
  saturday: 0,
  sunday: 0,
};

export default function RestaurantPlanningPage() {
  const [workplaceId, setWorkplaceId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getStartOfWeek(new Date())
  );

  const [workplaces, setWorkplaces] = useState<WorkplaceOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  const [breakfastCovers, setBreakfastCovers] =
    useState<CoversByDay>(EMPTY_WEEK_VALUES);
  const [lunchCovers, setLunchCovers] = useState<CoversByDay>(EMPTY_WEEK_VALUES);
  const [dinnerCovers, setDinnerCovers] = useState<CoversByDay>(EMPTY_WEEK_VALUES);

  const [demand, setDemand] = useState<WeeklyDemandDay[]>([]);
  const [proposal, setProposal] = useState<WeeklyProposalLine[]>([]);

  const [loadingDemand, setLoadingDemand] = useState(false);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekDays = useMemo<WeekDay[]>(
    () =>
      (Object.keys(DAY_LABELS) as DayKey[]).map((key, index) => ({
        key,
        label: DAY_LABELS[key],
        date: addDays(currentWeekStart, index),
      })),
    [currentWeekStart]
  );

  const canSubmit = useMemo(() => {
    return workplaceId.trim() && departmentId.trim();
  }, [workplaceId, departmentId]);

  const demandSummary = useMemo(() => {
    return groupWeeklyDemandByService(demand);
  }, [demand]);

  const proposalSummary = useMemo(() => {
    return groupWeeklyProposalByService(proposal);
  }, [proposal]);

  useEffect(() => {
    void loadWorkplaces();
  }, []);

  useEffect(() => {
    void loadDepartments(workplaceId);
  }, [workplaceId]);

  async function loadWorkplaces() {
    try {
      setIsCatalogLoading(true);
      setError(null);

      const response = await fetch("/api/workplaces", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los lugares de trabajo.");
      }

      const data = (await response.json()) as WorkplaceOption[];

      setWorkplaces(
        [...data]
          .filter((item) => item.id && item.name)
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ha ocurrido un error inesperado."
      );
      setWorkplaces([]);
    } finally {
      setIsCatalogLoading(false);
    }
  }

  async function loadDepartments(selectedWorkplaceId: string) {
    try {
      setError(null);

      if (!selectedWorkplaceId) {
        setDepartments([]);
        return;
      }

      const response = await fetch(
        `/api/departments?workplaceId=${encodeURIComponent(selectedWorkplaceId)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los departamentos.");
      }

      const data = (await response.json()) as DepartmentOption[];

      setDepartments(
        [...data]
          .filter((item) => item.id && item.name)
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ha ocurrido un error inesperado."
      );
      setDepartments([]);
    }
  }

  async function handleCalculateDemand() {
    setLoadingDemand(true);
    setError(null);
    setDemand([]);
    setProposal([]);

    try {
      const results = await Promise.all(
        weekDays.map(async (day) => {
          const res = await fetch("/api/restaurant-demand", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              workplaceId,
              date: toInputDate(day.date),
              breakfastCovers: breakfastCovers[day.key],
              lunchCovers: lunchCovers[day.key],
              dinnerCovers: dinnerCovers[day.key],
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Error calculating demand");
          }

          return (data as Omit<WeeklyDemandDay, "date">[]).map((line) => ({
            ...line,
            date: toInputDate(day.date),
          }));
        })
      );

      setDemand(results.flat());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoadingDemand(false);
    }
  }

  async function handleGenerateProposal() {
    setLoadingProposal(true);
    setError(null);
    setProposal([]);
    setDemand([]);

    try {
      const results = await Promise.all(
        weekDays.map(async (day) => {
          const res = await fetch("/api/restaurant-shift-proposal", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              workplaceId,
              departmentId,
              date: toInputDate(day.date),
              breakfastCovers: breakfastCovers[day.key],
              lunchCovers: lunchCovers[day.key],
              dinnerCovers: dinnerCovers[day.key],
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Error generating proposal");
          }

          return (data as WeeklyProposalLine[]).map((line) => ({
            ...line,
            date: toInputDate(day.date),
          }));
        })
      );

      setProposal(results.flat());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoadingProposal(false);
    }
  }

  function updateCovers(
    service: ServiceType,
    dayKey: DayKey,
    value: number
  ) {
    const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;

    if (service === "BREAKFAST") {
      setBreakfastCovers((prev) => ({ ...prev, [dayKey]: safeValue }));
      return;
    }

    if (service === "LUNCH") {
      setLunchCovers((prev) => ({ ...prev, [dayKey]: safeValue }));
      return;
    }

    setDinnerCovers((prev) => ({ ...prev, [dayKey]: safeValue }));
  }

  function resetWeekValues() {
    setBreakfastCovers(EMPTY_WEEK_VALUES);
    setLunchCovers(EMPTY_WEEK_VALUES);
    setDinnerCovers(EMPTY_WEEK_VALUES);
    setDemand([]);
    setProposal([]);
    setError(null);
  }

  function goToPreviousWeek() {
    setCurrentWeekStart((prev) => addDays(prev, -7));
    setDemand([]);
    setProposal([]);
    setError(null);
  }

  function goToNextWeek() {
    setCurrentWeekStart((prev) => addDays(prev, 7));
    setDemand([]);
    setProposal([]);
    setError(null);
  }

  function goToCurrentWeek() {
    setCurrentWeekStart(getStartOfWeek(new Date()));
    setDemand([]);
    setProposal([]);
    setError(null);
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">TURNOHOTEL</p>
          <h1 className="page-title">Planificación Restaurante</h1>
          <p className="page-subtitle">
            Introducimos la previsión semanal de desayunos, almuerzos y cenas
            para calcular demanda y generar propuesta de turnos.
          </p>
        </div>

        <div className="toolbar">
          <button
            type="button"
            className="toolbar-button secondary"
            onClick={goToPreviousWeek}
          >
            ← Semana anterior
          </button>

          <button
            type="button"
            className="toolbar-button ghost"
            onClick={goToCurrentWeek}
          >
            Semana actual
          </button>

          <button
            type="button"
            className="toolbar-button secondary"
            onClick={goToNextWeek}
          >
            Semana siguiente →
          </button>
        </div>
      </div>

      <div className="week-range-card">
        <div>
          <span className="week-range-label">Semana de planificación</span>
          <strong className="week-range-value">
            {formatLongDate(weekDays[0].date)} — {formatLongDate(weekDays[6].date)}
          </strong>
        </div>

        <div className="week-summary">
          <div className="summary-item">
            <span className="summary-value">
              {sumWeekValues(breakfastCovers) +
                sumWeekValues(lunchCovers) +
                sumWeekValues(dinnerCovers)}
            </span>
            <span className="summary-label">servicios previstos</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{weekDays.length}</span>
            <span className="summary-label">días</span>
          </div>
        </div>
      </div>

      <div className="filters-card">
        <div className="filters-header">
          <div>
            <h2 className="filters-title">Contexto operativo</h2>
            <p className="filters-subtitle">
              Indicamos el centro y el departamento para generar la propuesta semanal.
            </p>
          </div>

          <button
            type="button"
            className="toolbar-button ghost"
            onClick={resetWeekValues}
          >
            Limpiar previsión
          </button>
        </div>

        <div className="filters-grid filters-grid-two">
          <div className="filter-field">
            <label htmlFor="workplaceId">Lugar de trabajo</label>
            <select
              id="workplaceId"
              value={workplaceId}
              onChange={(event) => {
                setWorkplaceId(event.target.value);
                setDepartmentId("");
                setDepartments([]);
              }}
              disabled={isCatalogLoading}
            >
              <option value="">Selecciona un lugar de trabajo</option>
              {workplaces.map((workplace) => (
                <option key={workplace.id} value={workplace.id}>
                  {workplace.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="departmentId">Departamento</label>
            <select
              id="departmentId"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              disabled={!workplaceId}
            >
              <option value="">
                {workplaceId
                  ? "Selecciona un departamento"
                  : "Selecciona primero un lugar de trabajo"}
              </option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="planner-card">
        <div className="planner-grid planner-grid-services">
          <div className="planner-corner">Servicio</div>

          {weekDays.map((day) => (
            <div key={day.key} className="planner-day-header">
              <span className="planner-day-name">{day.label}</span>
              <span className="planner-day-date">{formatDayNumber(day.date)}</span>
            </div>
          ))}

          <ServiceRow
            title="Desayunos"
            values={breakfastCovers}
            weekDays={weekDays}
            onChange={(dayKey, value) =>
              updateCovers("BREAKFAST", dayKey, value)
            }
          />

          <ServiceRow
            title="Almuerzos"
            values={lunchCovers}
            weekDays={weekDays}
            onChange={(dayKey, value) => updateCovers("LUNCH", dayKey, value)}
          />

          <ServiceRow
            title="Cenas"
            values={dinnerCovers}
            weekDays={weekDays}
            onChange={(dayKey, value) => updateCovers("DINNER", dayKey, value)}
          />
        </div>
      </div>

      <div className="action-row">
        <button
          type="button"
          onClick={handleCalculateDemand}
          disabled={!canSubmit || loadingDemand}
          className="toolbar-button primary"
        >
          {loadingDemand ? "Calculando..." : "Calcular demanda semanal"}
        </button>

        <button
          type="button"
          onClick={handleGenerateProposal}
          disabled={!canSubmit || loadingProposal}
          className="toolbar-button secondary"
        >
          {loadingProposal ? "Generando..." : "Generar propuesta semanal"}
        </button>
      </div>

      {error ? (
        <div className="state-card error">
          <p>{error}</p>
        </div>
      ) : null}

      {demand.length > 0 ? (
        <div className="planner-card">
          <div className="section-header">
            <div>
              <h2 className="filters-title">Demanda semanal</h2>
              <p className="filters-subtitle">
                Resumen de personal necesario por servicio y día.
              </p>
            </div>
          </div>

          <div className="planner-grid planner-grid-results">
            <div className="planner-corner">Servicio</div>

            {weekDays.map((day) => (
              <div key={`demand-${day.key}`} className="planner-day-header">
                <span className="planner-day-name">{day.label}</span>
                <span className="planner-day-date">{formatDayNumber(day.date)}</span>
              </div>
            ))}

            <ResultRow
              title="Desayunos"
              weekDays={weekDays}
              values={proposalOrDemandValues(demandSummary.BREAKFAST)}
            />

            <ResultRow
              title="Almuerzos"
              weekDays={weekDays}
              values={proposalOrDemandValues(demandSummary.LUNCH)}
            />

            <ResultRow
              title="Cenas"
              weekDays={weekDays}
              values={proposalOrDemandValues(demandSummary.DINNER)}
            />
          </div>
        </div>
      ) : null}

      {proposal.length > 0 ? (
        <div className="planner-card">
          <div className="section-header">
            <div>
              <h2 className="filters-title">Propuesta semanal de turnos</h2>
              <p className="filters-subtitle">
                Propuesta generada por servicio con personas necesarias por día.
              </p>
            </div>
          </div>

          <div className="planner-grid planner-grid-results">
            <div className="planner-corner">Servicio</div>

            {weekDays.map((day) => (
              <div key={`proposal-${day.key}`} className="planner-day-header">
                <span className="planner-day-name">{day.label}</span>
                <span className="planner-day-date">{formatDayNumber(day.date)}</span>
              </div>
            ))}

            <ResultRow
              title="Desayunos"
              weekDays={weekDays}
              values={proposalOrDemandValues(proposalSummary.BREAKFAST)}
            />

            <ResultRow
              title="Almuerzos"
              weekDays={weekDays}
              values={proposalOrDemandValues(proposalSummary.LUNCH)}
            />

            <ResultRow
              title="Cenas"
              weekDays={weekDays}
              values={proposalOrDemandValues(proposalSummary.DINNER)}
            />
          </div>
        </div>
      ) : null}

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

        .toolbar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .toolbar-button {
          border: none;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
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

        .toolbar-button.ghost {
          background: #e2e8f0;
          color: #0f172a;
        }

        .toolbar-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .week-range-card,
        .planner-card,
        .state-card,
        .filters-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .week-range-card {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .week-range-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 4px;
        }

        .week-range-value {
          font-size: 14px;
          color: #0f172a;
        }

        .week-summary {
          display: flex;
          gap: 8px;
        }

        .summary-item {
          min-width: 92px;
          padding: 8px 10px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .summary-value {
          display: block;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .summary-label {
          display: block;
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }

        .filters-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .filters-header,
        .section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filters-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .filters-subtitle {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .filters-grid {
          display: grid;
          gap: 10px;
        }

        .filters-grid-two {
          grid-template-columns: repeat(2, minmax(180px, 1fr));
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .filter-field label {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
        }

        .filter-field input,
        .filter-field select {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          color: #0f172a;
          background: white;
          outline: none;
          min-width: 0;
        }

        .filter-field input:focus,
        .filter-field select:focus {
          border-color: #b7791f;
          box-shadow: 0 0 0 3px rgba(183, 121, 31, 0.12);
        }

        .filter-field select:disabled {
          background: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .planner-card {
          overflow-x: auto;
        }

        .planner-grid {
          display: grid;
          width: 100%;
        }

        .planner-grid-services,
        .planner-grid-results {
          grid-template-columns: 150px repeat(7, minmax(110px, 1fr));
          min-width: 920px;
        }

        .planner-corner {
          position: sticky;
          left: 0;
          z-index: 3;
          background: #0f172a;
          color: white;
          padding: 10px 8px;
          font-size: 11px;
          font-weight: 700;
          border-right: 1px solid #1e293b;
        }

        .planner-day-header {
          background: #0f172a;
          color: white;
          padding: 10px 6px;
          border-left: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: center;
          text-align: center;
        }

        .planner-day-name {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #cbd5e1;
        }

        .planner-day-date {
          font-size: 16px;
          font-weight: 800;
        }

        .action-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .state-card {
          padding: 18px;
        }

        .state-card.error {
          border-color: #fecaca;
          background: #fff7f7;
          color: #991b1b;
        }

        @media (max-width: 900px) {
          .filters-grid-two {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

type ServiceRowProps = {
  title: string;
  values: CoversByDay;
  weekDays: WeekDay[];
  onChange: (dayKey: DayKey, value: number) => void;
};

function ServiceRow({ title, values, weekDays, onChange }: ServiceRowProps) {
  return (
    <>
      <div className="service-cell">
        <strong>{title}</strong>
      </div>

      {weekDays.map((day) => (
        <div key={`${title}-${day.key}`} className="input-cell">
          <input
            type="number"
            min={0}
            value={values[day.key]}
            onChange={(event) => onChange(day.key, Number(event.target.value))}
          />
        </div>
      ))}

      <style jsx>{`
        .service-cell {
          position: sticky;
          left: 0;
          z-index: 2;
          background: white;
          border-top: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          padding: 14px 10px;
          display: flex;
          align-items: center;
          color: #0f172a;
          font-size: 13px;
        }

        .input-cell {
          border-top: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          padding: 8px;
          background: #ffffff;
        }

        .input-cell input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px;
          font-size: 13px;
          color: #0f172a;
          background: white;
          outline: none;
          text-align: center;
        }

        .input-cell input:focus {
          border-color: #b7791f;
          box-shadow: 0 0 0 3px rgba(183, 121, 31, 0.12);
        }
      `}</style>
    </>
  );
}

type ResultRowProps = {
  title: string;
  weekDays: WeekDay[];
  values: Partial<Record<DayKey, number>>;
};

function ResultRow({ title, weekDays, values }: ResultRowProps) {
  return (
    <>
      <div className="service-cell">
        <strong>{title}</strong>
      </div>

      {weekDays.map((day) => (
        <div key={`${title}-${day.key}`} className="result-cell">
          <span className="result-value">{values[day.key] ?? 0}</span>
          <span className="result-label">personas</span>
        </div>
      ))}

      <style jsx>{`
        .service-cell {
          position: sticky;
          left: 0;
          z-index: 2;
          background: white;
          border-top: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          padding: 14px 10px;
          display: flex;
          align-items: center;
          color: #0f172a;
          font-size: 13px;
        }

        .result-cell {
          min-height: 86px;
          border-top: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px;
        }

        .result-value {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }

        .result-label {
          font-size: 11px;
          color: #64748b;
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

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function sumWeekValues(values: CoversByDay) {
  return Object.values(values).reduce((acc, value) => acc + value, 0);
}

function groupWeeklyDemandByService(lines: WeeklyDemandDay[]) {
  return {
    BREAKFAST: toDayMap(
      lines.filter((line) => line.serviceType === "BREAKFAST")
    ),
    LUNCH: toDayMap(lines.filter((line) => line.serviceType === "LUNCH")),
    DINNER: toDayMap(lines.filter((line) => line.serviceType === "DINNER")),
  };
}

function groupWeeklyProposalByService(lines: WeeklyProposalLine[]) {
  return {
    BREAKFAST: toDayMap(
      lines
        .filter((line) => line.serviceType === "BREAKFAST")
        .map((line) => ({
          date: line.date,
          employeesNeeded: line.employeesNeeded,
        }))
    ),
    LUNCH: toDayMap(
      lines
        .filter((line) => line.serviceType === "LUNCH")
        .map((line) => ({
          date: line.date,
          employeesNeeded: line.employeesNeeded,
        }))
    ),
    DINNER: toDayMap(
      lines
        .filter((line) => line.serviceType === "DINNER")
        .map((line) => ({
          date: line.date,
          employeesNeeded: line.employeesNeeded,
        }))
    ),
  };
}

function toDayMap(
  lines: Array<{ date: string; employeesNeeded: number }>
): Partial<Record<DayKey, number>> {
  const result: Partial<Record<DayKey, number>> = {};

  for (const line of lines) {
    const dayKey = getDayKeyFromIsoDate(line.date);
    result[dayKey] = line.employeesNeeded;
  }

  return result;
}

function getDayKeyFromIsoDate(value: string): DayKey {
  const date = new Date(`${value}T00:00:00`);
  const day = date.getDay();

  switch (day) {
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    case 6:
      return "saturday";
    case 0:
      return "sunday";
    default:
      return "monday";
  }
}

function proposalOrDemandValues(values: Partial<Record<DayKey, number>>) {
  return values;
}