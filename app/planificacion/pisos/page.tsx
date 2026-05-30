"use client";

import { useEffect, useMemo, useState } from "react";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
type Workplace = { id: string; name: string };
type Department = { id: string; name: string };
type RoomType = {
  id: string;
  name: string;
  stayoverCleaningMinutes: number;
  departureCleaningMinutes: number;
  isActive: boolean;
};
type ShiftMaster = {
  id: string;
  name: string;
  startMinute: number;
  endMinute: number;
  crossesMidnight: boolean;
  effectiveCleaningMinutes: number | null;
  type: string;
  countsForRoomAssignment: boolean;
  isActive: boolean;
};
type ForecastLine = Record<DayKey, { stayovers: number; departures: number }>;
type SavedForecastLine = {
  roomTypeId: string;
  date: string;
  stayovers: number;
  departures: number;
};
type StaffingProposalLine = {
  id: string;
  date: string;
  requiredMinutes: number;
  shiftEffectiveMinutes: number;
  requiredStaff: number;
  coveredMinutes: number;
  shiftMaster: {
    name: string;
  };
};
type ShiftNeedLine = {
  id: string;
  date: string;
  requiredStaff: number;
  assignedStaff: number;
  requiredMinutes: number;
  coveredMinutes: number;
  status: "DRAFT" | "READY" | "ASSIGNED";
  shiftMaster: {
    name: string;
  };
};
type AssignmentPreviewLine = {
  needId: string;
  date: string;
  shiftName: string;
  requiredStaff: number;
  candidates: Array<{
    order: number;
    employeeId: string;
    code: string;
    name: string;
    jobCategory: string | null;
    seniorityDate: string | null;
    contractStartDate: string;
    dailyHours: number | null;
    weeklyHours: number | null;
    selected: boolean;
    excludedReason: string | null;
  }>;
};

const dayKeys: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const dayLabels: Record<DayKey, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mie",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sab",
  sunday: "Dom",
};

export default function HousekeepingPlanningPage() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [shiftMasters, setShiftMasters] = useState<ShiftMaster[]>([]);
  const [workplaceId, setWorkplaceId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [weekStart, setWeekStart] = useState(() =>
    toInputDate(getStartOfWeek(new Date()))
  );
  const [forecast, setForecast] = useState<Record<string, ForecastLine>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [isSavingForecast, setIsSavingForecast] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [isCreatingNeeds, setIsCreatingNeeds] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isAssigningShifts, setIsAssigningShifts] = useState(false);
  const [staffingProposal, setStaffingProposal] = useState<StaffingProposalLine[]>([]);
  const [shiftNeeds, setShiftNeeds] = useState<ShiftNeedLine[]>([]);
  const [assignmentPreview, setAssignmentPreview] = useState<AssignmentPreviewLine[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadWorkplaces();
  }, []);

  useEffect(() => {
    if (!workplaceId) return;
    void loadDepartments();
    void loadRoomTypes();
  }, [workplaceId]);

  useEffect(() => {
    if (!departmentId) return;
    void loadShiftMasters();
    void loadStaffingProposal();
    void loadShiftNeeds();
  }, [departmentId]);

  useEffect(() => {
    if (!workplaceId) return;
    void loadForecast();
    if (departmentId) void loadStaffingProposal();
    if (departmentId) void loadShiftNeeds();
  }, [workplaceId, weekStart]);

  const totals = useMemo(() => {
    const result = emptyTotals();
    for (const room of roomTypes) {
      const line = forecast[room.id];
      for (const day of dayKeys) {
        const values = line?.[day] ?? { stayovers: 0, departures: 0 };
        result[day] +=
          values.stayovers * room.stayoverCleaningMinutes +
          values.departures * room.departureCleaningMinutes;
      }
    }
    return result;
  }, [forecast, roomTypes]);

  const activeRoomShifts = shiftMasters.filter(
    (shift) =>
      shift.type === "PISOS" &&
      shift.isActive &&
      shift.countsForRoomAssignment
  );
  const inactiveRoomAssignmentShifts = shiftMasters.filter(
    (shift) =>
      shift.type === "PISOS" &&
      shift.isActive &&
      !shift.countsForRoomAssignment
  );

  async function loadWorkplaces() {
    const [workplacesResponse, roomsResponse] = await Promise.all([
      fetch("/api/workplaces", { cache: "no-store" }),
      fetch("/api/room-types", { cache: "no-store" }),
    ]);
    const workplacesData = await workplacesResponse.json();
    const roomsData = await roomsResponse.json();
    if (!workplacesResponse.ok) {
      setError(workplacesData.error || "No se pudieron cargar centros.");
      return;
    }
    if (!roomsResponse.ok) {
      setError(roomsData.error || "No se pudieron cargar habitaciones.");
      return;
    }

    setWorkplaces(workplacesData);

    const activeRoomWorkplaceIds = new Set(
      (Array.isArray(roomsData) ? roomsData : [])
        .filter((room: RoomType) => room.isActive)
        .map((room: RoomType & { workplaceId?: string }) => room.workplaceId)
    );
    const workplaceWithRooms = workplacesData.find((workplace: Workplace) =>
      activeRoomWorkplaceIds.has(workplace.id)
    );

    if (workplaceWithRooms) {
      setWorkplaceId(workplaceWithRooms.id);
    } else if (workplacesData[0]) {
      setWorkplaceId(workplacesData[0].id);
    }
  }

  async function loadDepartments() {
    const response = await fetch(
      `/api/departments?workplaceId=${workplaceId}`,
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se pudieron cargar departamentos.");
      return;
    }
    setDepartments(data);
  }

  async function loadRoomTypes() {
    try {
      setIsLoadingRooms(true);
      const response = await fetch(`/api/room-types?workplaceId=${workplaceId}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "No se pudieron cargar habitaciones.");
        return;
      }
      setRoomTypes(data.filter((item: RoomType) => item.isActive));
    } finally {
      setIsLoadingRooms(false);
    }
  }

  async function loadShiftMasters() {
    const response = await fetch(
      `/api/shift-masters?departmentId=${departmentId}`,
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se pudieron cargar turnos.");
      return;
    }
    setShiftMasters(data);
  }

  async function loadForecast() {
    try {
      setIsLoadingForecast(true);
      setSaveMessage(null);
      const query = new URLSearchParams({ workplaceId, weekStart });
      const response = await fetch(`/api/housekeeping-forecast?${query}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "No se pudo cargar la prevision.");
        return;
      }
      setForecast(toForecastState(data));
    } finally {
      setIsLoadingForecast(false);
    }
  }

  async function saveForecast() {
    try {
      setIsSavingForecast(true);
      setSaveMessage(null);
      setError(null);
      const response = await fetch("/api/housekeeping-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workplaceId,
          weekStart,
          lines: toApiLines(forecast, weekStart),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "No se pudo guardar la prevision.");
        return;
      }
      setForecast(toForecastState(data));
      setSaveMessage("Prevision guardada.");
      setStaffingProposal([]);
    } finally {
      setIsSavingForecast(false);
    }
  }

  async function loadStaffingProposal() {
    const query = new URLSearchParams({ workplaceId, departmentId, weekStart });
    const response = await fetch(`/api/housekeeping-staffing-proposal?${query}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se pudo cargar la propuesta.");
      return;
    }
    setStaffingProposal(Array.isArray(data) ? data : []);
  }

  async function generateStaffingProposal() {
    try {
      setIsGeneratingProposal(true);
      setError(null);
      setSaveMessage(null);
      const response = await fetch("/api/housekeeping-staffing-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workplaceId, departmentId, weekStart }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "No se pudo generar la propuesta.");
        return;
      }
      setStaffingProposal(Array.isArray(data) ? data : []);
      setShiftNeeds([]);
      setSaveMessage("Propuesta generada.");
    } finally {
      setIsGeneratingProposal(false);
    }
  }

  async function loadShiftNeeds() {
    const query = new URLSearchParams({ workplaceId, departmentId, weekStart });
    const response = await fetch(`/api/housekeeping-shift-needs?${query}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "No se pudieron cargar las necesidades.");
      return;
    }
    setShiftNeeds(Array.isArray(data) ? data : []);
  }

  async function createShiftNeeds() {
    try {
      setIsCreatingNeeds(true);
      setError(null);
      setSaveMessage(null);
      const response = await fetch("/api/housekeeping-shift-needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workplaceId, departmentId, weekStart }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "No se pudieron crear las necesidades.");
        return;
      }
      setShiftNeeds(Array.isArray(data) ? data : []);
      setAssignmentPreview([]);
      setSaveMessage("Necesidades creadas.");
    } finally {
      setIsCreatingNeeds(false);
    }
  }

  async function loadAssignmentPreview() {
    try {
      setIsLoadingPreview(true);
      setError(null);
      const query = new URLSearchParams({ workplaceId, departmentId, weekStart });
      const response = await fetch(`/api/housekeeping-assignment-preview?${query}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "No se pudo cargar la vista previa.");
        return;
      }
      setAssignmentPreview(Array.isArray(data) ? data : []);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function assignShiftsFromPreview() {
    const confirmed = window.confirm(
      "Se crearan turnos reales en borrador desde la vista previa. Continuar?"
    );
    if (!confirmed) return;

    try {
      setIsAssigningShifts(true);
      setError(null);
      setSaveMessage(null);
      const response = await fetch("/api/housekeeping-assign-shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workplaceId, departmentId, weekStart }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "No se pudieron crear los turnos.");
        return;
      }
      setSaveMessage(
        `Turnos creados: ${data.created}. Omitidos: ${data.skipped}. Sin cubrir: ${data.uncovered}.`
      );
      await loadShiftNeeds();
      await loadAssignmentPreview();
    } finally {
      setIsAssigningShifts(false);
    }
  }

  function setValue(
    roomId: string,
    day: DayKey,
    key: "stayovers" | "departures",
    value: number
  ) {
    setForecast((prev) => ({
      ...prev,
      [roomId]: {
        ...emptyLine(),
        ...(prev[roomId] ?? {}),
        [day]: {
          ...((prev[roomId] ?? emptyLine())[day]),
          [key]: Math.max(0, value),
        },
      },
    }));
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Planificacion</p>
          <h1>Pisos</h1>
          <p className="page-description">
            Prevision semanal en minutos hombre por tipo de habitacion.
          </p>
        </div>
      </section>

      {error ? <div className="state-card error">{error}</div> : null}

      <section className="filters">
        <select
          value={workplaceId}
          onChange={(event) => setWorkplaceId(event.target.value)}
        >
          {workplaces.map((workplace) => (
            <option key={workplace.id} value={workplace.id}>
              {workplace.name}
            </option>
          ))}
        </select>
        <select
          value={departmentId}
          onChange={(event) => setDepartmentId(event.target.value)}
        >
          <option value="">Selecciona departamento de Pisos</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={weekStart}
          onChange={(event) => setWeekStart(event.target.value)}
        />
        <button
          type="button"
          onClick={saveForecast}
          disabled={!workplaceId || isSavingForecast}
        >
          {isSavingForecast ? "Guardando..." : "Guardar prevision"}
        </button>
      </section>

      {saveMessage ? <div className="state-card success">{saveMessage}</div> : null}

      <section className="panel table-wrap">
        <div className="grid header">
          <div>Habitacion</div>
          {dayKeys.map((day) => (
            <div key={day}>{dayLabels[day]}</div>
          ))}
        </div>
        {isLoadingRooms || isLoadingForecast ? (
          <p className="muted">Cargando prevision...</p>
        ) : null}
        {!isLoadingRooms && roomTypes.length === 0 ? (
          <p className="muted">
            No hay tipos de habitacion activos para el centro seleccionado.
          </p>
        ) : null}
        {roomTypes.map((room) => (
          <div className="grid" key={room.id}>
            <div className="room-name">
              <strong>{room.name}</strong>
              <span>
                Cliente {room.stayoverCleaningMinutes} min - Salida{" "}
                {room.departureCleaningMinutes} min
              </span>
            </div>
            {dayKeys.map((day) => {
              const values = forecast[room.id]?.[day] ?? {
                stayovers: 0,
                departures: 0,
              };
              return (
                <div className="day-cell" key={`${room.id}-${day}`}>
                  <span>Cliente</span>
                  <span>Salida</span>
                  <input
                    aria-label="cliente"
                    type="number"
                    min={0}
                    value={values.stayovers}
                    onChange={(event) =>
                      setValue(room.id, day, "stayovers", Number(event.target.value))
                    }
                  />
                  <input
                    aria-label="salida"
                    type="number"
                    min={0}
                    value={values.departures}
                    onChange={(event) =>
                      setValue(room.id, day, "departures", Number(event.target.value))
                    }
                  />
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <section className="panel table-wrap">
        <h2>Necesidad calculada</h2>
        <div className="grid header">
          <div>Turno</div>
          {dayKeys.map((day) => (
            <div key={day}>{dayLabels[day]}</div>
          ))}
        </div>
        <div className="grid result">
          <div>Horas necesarias</div>
          {dayKeys.map((day) => (
            <div key={day}>{formatHours(totals[day])}</div>
          ))}
        </div>
        {activeRoomShifts.map((shift) => {
          const capacity = shiftDuration(shift);
          return (
            <div className="grid result" key={shift.id}>
              <div>
                {shift.name} ({formatHours(capacity)})
              </div>
              {dayKeys.map((day) => (
                <div key={day}>
                  {capacity > 0
                    ? `${Math.ceil(totals[day] / capacity)} pers.`
                    : "0 pers."}
                </div>
              ))}
            </div>
          );
        })}
        {activeRoomShifts.length === 0 ? (
          <p className="muted">
            No hay turnos PISOS activos que cuenten para habitaciones en el
            departamento seleccionado. Revisa el maestro de turnos y marca
            "Cuenta para habitaciones".
          </p>
        ) : null}
        {inactiveRoomAssignmentShifts.length > 0 ? (
          <p className="muted">
            Turnos PISOS activos excluidos:{" "}
            {inactiveRoomAssignmentShifts.map((shift) => shift.name).join(", ")}.
          </p>
        ) : null}
      </section>

      <section className="panel table-wrap">
        <div className="section-header">
          <h2>Propuesta 8h</h2>
          <div className="action-row">
            <button
              type="button"
              onClick={generateStaffingProposal}
              disabled={!workplaceId || !departmentId || isGeneratingProposal}
            >
              {isGeneratingProposal ? "Generando..." : "Generar propuesta"}
            </button>
            <button
              type="button"
              onClick={createShiftNeeds}
              disabled={
                !workplaceId ||
                !departmentId ||
                staffingProposal.length === 0 ||
                isCreatingNeeds
              }
            >
              {isCreatingNeeds ? "Creando..." : "Crear necesidades"}
            </button>
          </div>
        </div>

        {staffingProposal.length === 0 ? (
          <p className="muted">No hay propuesta generada para esta semana.</p>
        ) : (
          <div className="grid proposal-grid header">
            <div>Dia</div>
            <div>Turno</div>
            <div>Necesidad</div>
            <div>Personas</div>
            <div>Cobertura</div>
          </div>
        )}

        {staffingProposal.map((line) => (
          <div className="grid proposal-grid result" key={line.id}>
            <div>{formatShortDate(line.date)}</div>
            <div>
              {line.shiftMaster.name} ({formatHours(line.shiftEffectiveMinutes)})
            </div>
            <div>{formatHours(line.requiredMinutes)}</div>
            <div>{line.requiredStaff} pers.</div>
            <div>{formatHours(line.coveredMinutes)}</div>
          </div>
        ))}
      </section>

      <section className="panel table-wrap">
        <div className="section-header">
          <h2>Necesidades pendientes</h2>
          <button
            type="button"
            onClick={loadAssignmentPreview}
            disabled={shiftNeeds.length === 0 || isLoadingPreview}
          >
            {isLoadingPreview ? "Cargando..." : "Vista previa"}
          </button>
        </div>
        {shiftNeeds.length === 0 ? (
          <p className="muted">No hay necesidades creadas para esta semana.</p>
        ) : (
          <div className="grid needs-grid header">
            <div>Dia</div>
            <div>Turno</div>
            <div>Necesarias</div>
            <div>Asignadas</div>
            <div>Estado</div>
          </div>
        )}
        {shiftNeeds.map((need) => (
          <div className="grid needs-grid result" key={need.id}>
            <div>{formatShortDate(need.date)}</div>
            <div>{need.shiftMaster.name}</div>
            <div>{need.requiredStaff} pers.</div>
            <div>{need.assignedStaff} pers.</div>
            <div>{formatNeedStatus(need.status)}</div>
          </div>
        ))}
      </section>

      <section className="panel table-wrap">
        <div className="section-header">
          <h2>Vista previa de asignacion</h2>
          <button
            type="button"
            onClick={assignShiftsFromPreview}
            disabled={assignmentPreview.length === 0 || isAssigningShifts}
          >
            {isAssigningShifts ? "Creando..." : "Crear turnos reales"}
          </button>
        </div>
        {assignmentPreview.length === 0 ? (
          <p className="muted">
            Genera la vista previa para ver candidatos por orden de llamamiento.
          </p>
        ) : null}
        <div className="preview-list">
          {assignmentPreview.map((line) => (
            <article className="preview-card" key={line.needId}>
              <div className="preview-card-header">
                <strong>
                  {formatShortDate(line.date)} - {line.shiftName}
                </strong>
                <span>{line.requiredStaff} pers. necesarias</span>
              </div>
              <div className="candidate-list">
                {line.candidates
                  .filter((candidate) => candidate.selected)
                  .map((candidate) => (
                    <div className="candidate-row" key={candidate.employeeId}>
                      <span>{candidate.order}</span>
                      <strong>
                        {candidate.code} - {candidate.name}
                      </strong>
                      <span>{candidate.jobCategory ?? "Sin categoria"}</span>
                      <span>
                        Orden:{" "}
                        {candidate.seniorityDate || candidate.contractStartDate
                          ? formatShortDate(
                              candidate.seniorityDate ??
                                candidate.contractStartDate
                            )
                          : "Sin fecha"}
                      </span>
                    </div>
                  ))}
              </div>
              {line.candidates.filter((candidate) => candidate.selected).length <
              line.requiredStaff ? (
                <p className="muted">
                  Faltan{" "}
                  {line.requiredStaff -
                    line.candidates.filter((candidate) => candidate.selected).length}{" "}
                  candidatos disponibles.
                </p>
              ) : null}
              {line.candidates.some((candidate) => candidate.excludedReason) ? (
                <details className="excluded-details">
                  <summary>Candidatos excluidos</summary>
                  <div className="candidate-list">
                    {line.candidates
                      .filter((candidate) => candidate.excludedReason)
                      .map((candidate) => (
                        <div
                          className="candidate-row excluded"
                          key={candidate.employeeId}
                        >
                          <span>{candidate.order}</span>
                          <strong>
                            {candidate.code} - {candidate.name}
                          </strong>
                          <span>{candidate.jobCategory ?? "Sin categoria"}</span>
                          <span>{candidate.excludedReason}</span>
                        </div>
                      ))}
                  </div>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .page-shell { padding: 16px; background: #f6f8fc; min-height: 100%; display: grid; gap: 16px; }
        .eyebrow { margin: 0 0 4px; font-size: 11px; font-weight: 800; color: #0891b2; text-transform: uppercase; }
        h1, h2 { margin: 0; color: #0f172a; }
        h1 { font-size: 26px; }
        h2 { font-size: 18px; margin-bottom: 12px; }
        .section-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .section-header h2 { margin: 0; }
        .action-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .page-description { margin: 6px 0 0; color: #64748b; font-size: 13px; }
        .filters, .panel, .state-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
        .filters { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 10px; }
        select, input { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; font-size: 12px; }
        button { border: 0; border-radius: 8px; background: #0891b2; color: white; font-weight: 800; cursor: pointer; padding: 9px 12px; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .table-wrap { overflow-x: auto; }
        .grid { display: grid; grid-template-columns: 220px repeat(7, minmax(118px, 1fr)); min-width: 1046px; border-bottom: 1px solid #e2e8f0; }
        .proposal-grid { grid-template-columns: 120px minmax(180px, 1fr) 140px 120px 140px; min-width: 720px; }
        .needs-grid { grid-template-columns: 120px minmax(180px, 1fr) 130px 130px 120px; min-width: 680px; }
        .preview-list { display: grid; gap: 10px; min-width: 680px; }
        .preview-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #ffffff; }
        .preview-card-header { display: flex; justify-content: space-between; gap: 12px; color: #0f172a; margin-bottom: 8px; }
        .preview-card-header span { color: #64748b; font-size: 12px; }
        .candidate-list { display: grid; gap: 6px; }
        .candidate-row { display: grid; grid-template-columns: 40px minmax(180px, 1fr) 140px 130px; gap: 8px; align-items: center; padding: 8px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #334155; }
        .candidate-row.excluded { background: #fff7ed; color: #9a3412; }
        .excluded-details { margin-top: 10px; }
        .excluded-details summary { cursor: pointer; color: #64748b; font-size: 12px; font-weight: 800; margin-bottom: 8px; }
        .grid > div { padding: 10px; border-left: 1px solid #e2e8f0; }
        .grid > div:first-child { border-left: 0; }
        .header { background: #0f172a; color: white; font-weight: 800; font-size: 12px; }
        .room-name span { display: block; margin-top: 4px; color: #64748b; font-size: 11px; }
        .day-cell { display: grid; grid-template-columns: minmax(48px, 1fr) minmax(48px, 1fr); gap: 4px 8px; }
        .day-cell span { color: #475569; font-size: 12px; font-weight: 800; text-align: center; }
        .day-cell input { text-align: center; min-width: 48px; padding-left: 6px; padding-right: 6px; }
        .result { font-weight: 800; color: #0f172a; }
        .muted { color: #64748b; font-size: 13px; }
        .state-card.error { border-color: #fecaca; background: #fff7f7; color: #991b1b; }
        .state-card.success { border-color: #bbf7d0; background: #f0fdf4; color: #047857; }
        @media (max-width: 800px) { .filters { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}

function emptyLine(): ForecastLine {
  return {
    monday: { stayovers: 0, departures: 0 },
    tuesday: { stayovers: 0, departures: 0 },
    wednesday: { stayovers: 0, departures: 0 },
    thursday: { stayovers: 0, departures: 0 },
    friday: { stayovers: 0, departures: 0 },
    saturday: { stayovers: 0, departures: 0 },
    sunday: { stayovers: 0, departures: 0 },
  };
}

function emptyTotals(): Record<DayKey, number> {
  return {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  };
}

function shiftDuration(shift: ShiftMaster) {
  if (shift.effectiveCleaningMinutes && shift.effectiveCleaningMinutes > 0) {
    return shift.effectiveCleaningMinutes;
  }
  if (shift.crossesMidnight) return 1440 - shift.startMinute + shift.endMinute;
  return Math.max(shift.endMinute - shift.startMinute, 0);
}

function getStartOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  return result;
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours.toLocaleString("es-ES", {
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1,
    maximumFractionDigits: 1,
  })} h`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatNeedStatus(status: ShiftNeedLine["status"]) {
  if (status === "DRAFT") return "Borrador";
  if (status === "READY") return "Lista";
  return "Asignada";
}

function toApiLines(forecast: Record<string, ForecastLine>, weekStart: string) {
  const result: Array<{
    roomTypeId: string;
    date: string;
    stayovers: number;
    departures: number;
  }> = [];
  const start = new Date(`${weekStart}T00:00:00`);

  for (const [roomTypeId, line] of Object.entries(forecast)) {
    dayKeys.forEach((day, index) => {
      const values = line[day];
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      result.push({
        roomTypeId,
        date: toInputDate(date),
        stayovers: values?.stayovers ?? 0,
        departures: values?.departures ?? 0,
      });
    });
  }

  return result;
}

function toForecastState(lines: SavedForecastLine[]) {
  const result: Record<string, ForecastLine> = {};

  for (const line of lines) {
    const day = getDayKey(line.date);
    result[line.roomTypeId] = {
      ...emptyLine(),
      ...(result[line.roomTypeId] ?? {}),
      [day]: {
        stayovers: line.stayovers,
        departures: line.departures,
      },
    };
  }

  return result;
}

function getDayKey(value: string): DayKey {
  const date = new Date(value);
  const day = date.getUTCDay();

  if (day === 1) return "monday";
  if (day === 2) return "tuesday";
  if (day === 3) return "wednesday";
  if (day === 4) return "thursday";
  if (day === 5) return "friday";
  if (day === 6) return "saturday";
  return "sunday";
}
