"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import ShiftForm from "@/components/shifts/shift-form";
import AbsenceForm from "@/components/absences/absence-form";
import { DevAuthSwitcher } from "@/components/dev/DevAuthSwitcher";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  isActive: boolean;
  employeeContracts?: {
    id: string;
    startDate: string;
    createdAt: string;
    jobCategory: {
      id: string;
      code: string;
      name: string;
      shortName: string | null;
      isActive: boolean;
    } | null;
  }[];
};

type WorkplaceOption = {
  id: string;
  name: string;
};

type DepartmentOption = {
  id: string;
  name: string;
};

type WorkAreaOption = {
  id: string;
  name: string;
};

type ShiftStatus = "BORRADOR" | "PUBLICADO" | "CANCELADO";
type ShiftMasterType = "GENERAL" | "RESTAURANTE" | "PISOS";

type Shift = {
  id: string;
  employeeId: string;
  workplaceId: string;
  departmentId: string;
  workAreaId: string | null;
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
  workArea: {
    id: string;
    name: string;
  } | null;
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

type Absence = {
  id: string;
  employeeId: string;
  absenceTypeId: string;
  unit: "FULL_DAY" | "HOURLY";
  startDate: string;
  endDate: string;
  startMinutes: number | null;
  endMinutes: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  notes: string | null;
  documentUrl: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
  absenceType: {
    id: string;
    code: string;
    name: string;
    color: string | null;
  };
};

type ShiftsApiResponse = {
  shifts: Shift[];
  absences: Absence[];
};

type CellSelection = {
  employeeId: string;
  startDate: Date;
  endDate: Date;
};

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function TurnosPage() {
  const { user, isLoading: isUserLoading, error: userError } = useCurrentUser();

  const canManageShifts =
    user?.role === "ADMIN" || user?.role === "MANAGER";

  const canCreateAbsences =
    user?.role === "ADMIN" ||
    user?.role === "MANAGER" ||
    user?.role === "EMPLOYEE";

  const canOpenCellActions = canManageShifts || canCreateAbsences;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getStartOfWeek(new Date())
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);

  const [workplaces, setWorkplaces] = useState<WorkplaceOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [workAreas, setWorkAreas] = useState<WorkAreaOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [prefillEmployeeId, setPrefillEmployeeId] = useState<string>("");
  const [prefillDate, setPrefillDate] = useState<string>("");
  const [prefillEndDate, setPrefillEndDate] = useState<string>("");

  const [showCellActionModal, setShowCellActionModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);

  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState("all");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("all");
  const [selectedWorkAreaId, setSelectedWorkAreaId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [employeeSearch, setEmployeeSearch] = useState("");

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index)),
    [currentWeekStart]
  );

  useEffect(() => {
    void loadWorkplaces();
  }, []);

  useEffect(() => {
    void loadDepartments(selectedWorkplaceId);
  }, [selectedWorkplaceId]);

  useEffect(() => {
    void loadWorkAreas(selectedDepartmentId);
  }, [selectedDepartmentId]);

  useEffect(() => {
    void loadWeekData(currentWeekStart);
  }, [
    currentWeekStart,
    selectedWorkplaceId,
    selectedDepartmentId,
    selectedWorkAreaId,
  ]);

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

  async function loadDepartments(workplaceId: string) {
    try {
      setError(null);

      const query =
        workplaceId !== "all"
          ? `?workplaceId=${encodeURIComponent(workplaceId)}`
          : "";

      const response = await fetch(`/api/departments${query}`, {
        cache: "no-store",
      });

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

  async function loadWorkAreas(departmentId: string) {
    try {
      setError(null);

      if (departmentId === "all") {
        setWorkAreas([]);
        return;
      }

      const response = await fetch(
        `/api/work-areas?departmentId=${encodeURIComponent(departmentId)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar las zonas.");
      }

      const data = (await response.json()) as WorkAreaOption[];

      setWorkAreas(
        [...data]
          .filter((item) => item.id && item.name)
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ha ocurrido un error inesperado."
      );
      setWorkAreas([]);
    }
  }

  async function loadWeekData(weekStart: Date) {
    try {
      setIsLoading(true);
      setError(null);

      const startAt = startOfDay(weekStart);
      const endAt = endOfDay(addDays(weekStart, 6));

      const shiftParams = new URLSearchParams({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      });

      if (selectedWorkplaceId !== "all") {
        shiftParams.set("workplaceId", selectedWorkplaceId);
      }

      if (selectedDepartmentId !== "all") {
        shiftParams.set("departmentId", selectedDepartmentId);
      }

      if (selectedWorkAreaId !== "all") {
        shiftParams.set("workAreaId", selectedWorkAreaId);
      }

      const [employeesResponse, shiftsResponse] = await Promise.all([
        fetch("/api/employees", { cache: "no-store" }),
        fetch(`/api/shifts?${shiftParams.toString()}`, {
          cache: "no-store",
        }),
      ]);

      if (!employeesResponse.ok) {
        throw new Error("No se pudieron cargar los empleados.");
      }

      if (!shiftsResponse.ok) {
        throw new Error("No se pudo cargar el cuadrante.");
      }

      const employeesData = (await employeesResponse.json()) as Employee[];
      const shiftsData = (await shiftsResponse.json()) as ShiftsApiResponse;

      setEmployees(
        employeesData
          .filter((employee) => employee.isActive)
          .sort((a, b) => {
            const aCurrentContract = a.employeeContracts?.[0] ?? null;
            const bCurrentContract = b.employeeContracts?.[0] ?? null;

            const aCategoryName = aCurrentContract?.jobCategory?.name?.trim() || "ZZZ";
            const bCategoryName = bCurrentContract?.jobCategory?.name?.trim() || "ZZZ";

            const categoryCompare = aCategoryName.localeCompare(bCategoryName, "es");
            if (categoryCompare !== 0) {
              return categoryCompare;
            }

            const aOldestContractDate = [...(a.employeeContracts ?? [])]
              .sort(
                (x, y) =>
                  new Date(x.startDate).getTime() - new Date(y.startDate).getTime()
              )[0]?.startDate;

            const bOldestContractDate = [...(b.employeeContracts ?? [])]
              .sort(
                (x, y) =>
                  new Date(x.startDate).getTime() - new Date(y.startDate).getTime()
              )[0]?.startDate;

            const aSeniority = aOldestContractDate
              ? new Date(aOldestContractDate).getTime()
              : Number.MAX_SAFE_INTEGER;

            const bSeniority = bOldestContractDate
              ? new Date(bOldestContractDate).getTime()
              : Number.MAX_SAFE_INTEGER;

            if (aSeniority !== bSeniority) {
              return aSeniority - bSeniority;
            }

            const lastNameCompare = a.lastName.localeCompare(b.lastName, "es");
            if (lastNameCompare !== 0) {
              return lastNameCompare;
            }

            return a.firstName.localeCompare(b.firstName, "es");
          })
      );

      setShifts(shiftsData.shifts);
      setAbsences(shiftsData.absences);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ha ocurrido un error inesperado."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const workplaceOptions = useMemo(() => workplaces, [workplaces]);
  const departmentOptions = useMemo(() => departments, [departments]);
  const workAreaOptions = useMemo(() => workAreas, [workAreas]);

  const filteredShifts = useMemo(() => {
    if (selectedStatus === "all") {
      return shifts;
    }

    return shifts.filter((shift) => shift.status === selectedStatus);
  }, [shifts, selectedStatus]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = employeeSearch.trim().toLocaleLowerCase("es");
    const employeeIdsWithVisibleShifts = new Set(
      filteredShifts.map((shift) => shift.employeeId)
    );
    const employeeIdsWithVisibleAbsences = new Set(
      absences
        .filter((absence) => absence.status === "APPROVED")
        .map((absence) => absence.employeeId)
    );

    return employees.filter((employee) => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLocaleLowerCase("es");
      const matchesSearch =
        normalizedSearch === "" || fullName.includes(normalizedSearch);

      const hasVisibleShift = employeeIdsWithVisibleShifts.has(employee.id);
      const hasVisibleAbsence = employeeIdsWithVisibleAbsences.has(employee.id);

      if (
        selectedWorkplaceId === "all" &&
        selectedDepartmentId === "all" &&
        selectedWorkAreaId === "all" &&
        selectedStatus === "all"
      ) {
        return matchesSearch;
      }

      return matchesSearch && (hasVisibleShift || hasVisibleAbsence);
    });
  }, [
    employees,
    filteredShifts,
    absences,
    employeeSearch,
    selectedWorkplaceId,
    selectedDepartmentId,
    selectedWorkAreaId,
    selectedStatus,
  ]);

  function goToPreviousWeek() {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  }

  function goToNextWeek() {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  }

  function goToCurrentWeek() {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  }

  function resetFilters() {
    setSelectedWorkplaceId("all");
    setSelectedDepartmentId("all");
    setSelectedWorkAreaId("all");
    setSelectedStatus("all");
    setEmployeeSearch("");
  }

  function handleOpenShiftForm(employeeId?: string, date?: Date) {
    if (!canManageShifts) return;

    setPrefillEmployeeId(employeeId ?? "");
    setPrefillDate(date ? toInputDate(date) : "");
    setShowForm(true);
  }

  function handleCloseShiftForm() {
    setShowForm(false);
    setPrefillEmployeeId("");
    setPrefillDate("");
    setPrefillEndDate("");
  }

  function handleOpenAbsenceForm(employeeId?: string, date?: Date) {
    if (!canCreateAbsences) return;

    setPrefillEmployeeId(employeeId ?? "");
    setPrefillDate(date ? toInputDate(date) : "");
    setShowAbsenceForm(true);
  }

  function handleCloseAbsenceForm() {
    setShowAbsenceForm(false);
    setPrefillEmployeeId("");
    setPrefillDate("");
    setPrefillEndDate("");
  }

  function handleCellClick(employeeId: string, date: Date) {
    if (!canOpenCellActions) return;

    setSelectedCell({
      employeeId,
      startDate: date,
      endDate: date,
    });

    setShowCellActionModal(true);
  }

  function handleCloseCellActionModal() {
    setShowCellActionModal(false);
    setSelectedCell(null);
  }

  function handleCreateShiftFromCell() {
    if (!selectedCell || !canManageShifts) return;

    setShowCellActionModal(false);
    handleOpenShiftForm(selectedCell.employeeId, selectedCell.startDate);
    setSelectedCell(null);
  }

  function handleCreateAbsenceFromCell() {
    if (!selectedCell || !canCreateAbsences) return;

    setShowCellActionModal(false);
    setPrefillEmployeeId(selectedCell.employeeId);
    setPrefillDate(toInputDate(selectedCell.startDate));
    setPrefillEndDate(toInputDate(selectedCell.endDate));
    setShowAbsenceForm(true);
    setSelectedCell(null);
  }

  async function handleCreated() {
    await loadWeekData(currentWeekStart);
  }

  return (
    <>
      <div className="page-shell">
        {process.env.NODE_ENV === "development" && <DevAuthSwitcher />}

        {userError ? (
          <div className="state-card error">
            <p>{userError}</p>
          </div>
        ) : null}

        {!isUserLoading && user?.role === "EMPLOYEE" ? (
          <div className="state-card info">
            <p>
              Estás viendo el cuadrante como empleado. La creación de turnos no está disponible.
            </p>
          </div>
        ) : null}

        <div className="page-header">
          <div>
            <p className="page-eyebrow">TURNOHOTEL</p>
            <h1 className="page-title">Cuadrantes</h1>
            <p className="page-subtitle">
              Vista semanal operativa para organizar personal y turnos por día.
            </p>
          </div>

          <div className="toolbar">
            {canManageShifts ? (
              <button
                className="toolbar-button primary"
                onClick={() => handleOpenShiftForm()}
                disabled={isUserLoading}
              >
                + Nuevo registro
              </button>
            ) : null}

            <button className="toolbar-button secondary" onClick={goToPreviousWeek}>
              ← Semana anterior
            </button>

            <button className="toolbar-button secondary" onClick={goToCurrentWeek}>
              Semana actual
            </button>

            <button className="toolbar-button secondary" onClick={goToNextWeek}>
              Semana siguiente →
            </button>
          </div>
        </div>

        <div className="week-range-card">
          <div>
            <span className="week-range-label">Cuadrante semanal</span>
            <strong className="week-range-value">
              {formatLongDate(weekDays[0])} — {formatLongDate(weekDays[6])}
            </strong>
          </div>

          <div className="week-summary">
            <div className="summary-item">
              <span className="summary-value">{filteredEmployees.length}</span>
              <span className="summary-label">empleados</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{filteredShifts.length}</span>
              <span className="summary-label">registros</span>
            </div>
          </div>
        </div>

        <div className="filters-card">
          <div className="filters-header">
            <div>
              <h2 className="filters-title">Filtros del cuadrante</h2>
              <p className="filters-subtitle">
                Acota la vista por centro, departamento, zona, estado o empleado.
              </p>
            </div>

            <button
              type="button"
              className="toolbar-button ghost"
              onClick={resetFilters}
            >
              Limpiar filtros
            </button>
          </div>

          <div className="filters-grid">
            <div className="filter-field">
              <label htmlFor="workplaceFilter">Lugar de trabajo</label>
              <select
                id="workplaceFilter"
                value={selectedWorkplaceId}
                onChange={(event) => {
                  setSelectedWorkplaceId(event.target.value);
                  setSelectedDepartmentId("all");
                  setSelectedWorkAreaId("all");
                  setDepartments([]);
                  setWorkAreas([]);
                }}
                disabled={isCatalogLoading}
              >
                <option value="all">Todos</option>
                {workplaceOptions.map((workplace) => (
                  <option key={workplace.id} value={workplace.id}>
                    {workplace.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="departmentFilter">Departamento</label>
              <select
                id="departmentFilter"
                value={selectedDepartmentId}
                onChange={(event) => {
                  setSelectedDepartmentId(event.target.value);
                  setSelectedWorkAreaId("all");
                  setWorkAreas([]);
                }}
                disabled={isCatalogLoading}
              >
                <option value="all">Todos</option>
                {departmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="workAreaFilter">Zona</label>
              <select
                id="workAreaFilter"
                value={selectedWorkAreaId}
                onChange={(event) => setSelectedWorkAreaId(event.target.value)}
                disabled={selectedDepartmentId === "all"}
              >
                <option value="all">
                  {selectedDepartmentId === "all"
                    ? "Selecciona un departamento"
                    : "Todas"}
                </option>
                {workAreaOptions.map((workArea) => (
                  <option key={workArea.id} value={workArea.id}>
                    {workArea.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="statusFilter">Estado</label>
              <select
                id="statusFilter"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="BORRADOR">Borrador</option>
                <option value="PUBLICADO">Publicado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div className="filter-field employee-search-field">
              <label htmlFor="employeeSearch">Empleado</label>
              <input
                id="employeeSearch"
                type="text"
                placeholder="Buscar por nombre o apellidos"
                value={employeeSearch}
                onChange={(event) => setEmployeeSearch(event.target.value)}
              />
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
            <p>Cargando cuadrante semanal...</p>
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

              {filteredEmployees.map((employee) => (
                <WeeklyEmployeeRow
                  key={employee.id}
                  employee={employee}
                  weekDays={weekDays}
                  shifts={filteredShifts.filter((shift) => shift.employeeId === employee.id)}
                  absences={absences.filter((absence) => absence.employeeId === employee.id)}
                  canInteract={canOpenCellActions}
                  onDayClick={(day) => handleCellClick(employee.id, day)}
                  onRangeSelect={(start, end) => {
                    if (!canOpenCellActions) return;

                    const normalizedStart = start <= end ? start : end;
                    const normalizedEnd = start <= end ? end : start;

                    setSelectedCell({
                      employeeId: employee.id,
                      startDate: normalizedStart,
                      endDate: normalizedEnd,
                    });

                    setShowCellActionModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && filteredEmployees.length === 0 ? (
          <div className="state-card">
            <p>No hay resultados para los filtros seleccionados.</p>
          </div>
        ) : null}
      </div>

      {showForm ? (
        <ShiftForm
          onClose={handleCloseShiftForm}
          onCreated={handleCreated}
          initialEmployeeId={prefillEmployeeId}
          initialDate={prefillDate}
        />
      ) : null}

      {showAbsenceForm ? (
        <AbsenceForm
          onClose={handleCloseAbsenceForm}
          onCreated={handleCreated}
          initialEmployeeId={prefillEmployeeId}
          initialDate={prefillDate}
          initialEndDate={prefillEndDate}
        />
      ) : null}

      {showCellActionModal && selectedCell ? (
        <div className="cell-action-overlay" onClick={handleCloseCellActionModal}>
          <div
            className="cell-action-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cell-action-header">
              <h3 className="cell-action-title">Crear desde cuadrante</h3>
              <p className="cell-action-subtitle">
                Elige qué quieres crear para esta celda.
              </p>
            </div>

            <div className="cell-action-body">
              {canManageShifts ? (
                <button
                  type="button"
                  className="cell-action-option"
                  onClick={handleCreateShiftFromCell}
                >
                  <span className="cell-action-option-title">Crear turno</span>
                  <span className="cell-action-option-text">
                    Abrir el formulario de turno con empleado y fecha precargados.
                  </span>
                </button>
              ) : null}

              {canCreateAbsences ? (
                <button
                  type="button"
                  className="cell-action-option"
                  onClick={handleCreateAbsenceFromCell}
                >
                  <span className="cell-action-option-title">Crear ausencia</span>
                  <span className="cell-action-option-text">
                    Abrir el formulario de ausencia con empleado y fecha precargados.
                  </span>
                </button>
              ) : null}
            </div>

            <div className="cell-action-footer">
              <button
                type="button"
                className="toolbar-button ghost"
                onClick={handleCloseCellActionModal}
              >
                Cancelar
              </button>
            </div>
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
          min-width: 72px;
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

        .filters-header {
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
          grid-template-columns: repeat(5, minmax(110px, 1fr));
          gap: 10px;
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

        .filter-field select,
        .filter-field input {
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

        .filter-field select:focus,
        .filter-field input:focus {
          border-color: #b7791f;
          box-shadow: 0 0 0 3px rgba(183, 121, 31, 0.12);
        }

        .filter-field select:disabled {
          background: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .state-card {
          padding: 18px;
        }

        .state-card.error {
          border-color: #fecaca;
          background: #fff7f7;
          color: #991b1b;
        }

        .state-card.info {
          border-color: #cbd5e1;
          background: #f8fafc;
          color: #334155;
        }

        .planner-card {
          overflow-x: hidden;
          overflow-y: auto;
        }

        .planner-grid {
          display: grid;
          grid-template-columns: 110px repeat(7, minmax(0, 1fr));
          width: 100%;
        }

        .planner-corner,
        .planner-day-header,
        .employee-cell,
        .day-cell {
          min-width: 0;
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

        .cell-action-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15, 23, 42, 0.45);
        }

        .cell-action-modal {
          width: 100%;
          max-width: 420px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
          overflow: hidden;
        }

        .cell-action-header {
          padding: 18px 18px 12px 18px;
          border-bottom: 1px solid #e2e8f0;
        }

        .cell-action-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .cell-action-subtitle {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .cell-action-body {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cell-action-option {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: left;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }

        .cell-action-option:hover {
          transform: translateY(-1px);
          background: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }

        .cell-action-option-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .cell-action-option-text {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
        }

        .cell-action-footer {
          padding: 12px 18px 18px 18px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }

        @media (max-width: 1200px) {
          .planner-card {
            overflow-x: auto;
          }

          .planner-grid {
            min-width: 900px;
          }
        }

        @media (max-width: 900px) {
          .filters-grid {
            grid-template-columns: repeat(2, minmax(120px, 1fr));
          }

          .planner-grid {
            min-width: 840px;
          }
        }

        @media (max-width: 640px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }

          .week-summary {
            width: 100%;
          }

          .summary-item {
            flex: 1;
          }

          .cell-action-modal {
            max-width: 100%;
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
  absences: Absence[];
  canInteract: boolean;
  onDayClick: (day: Date) => void;
  onRangeSelect?: (start: Date, end: Date) => void;
};

function WeeklyEmployeeRow({
  employee,
  weekDays,
  shifts,
  absences,
  canInteract,
  onDayClick,
  onRangeSelect,
}: WeeklyEmployeeRowProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);

  function isInRange(day: Date) {
    if (!selectionStart || !selectionEnd) return false;

    const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart > selectionEnd ? selectionStart : selectionEnd;

    return day >= startOfDay(start) && day <= endOfDay(end);
  }

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
                sizes="28px"
              />
            ) : (
              <span>{getInitials(employee.firstName, employee.lastName)}</span>
            )}
          </div>

          <div className="employee-text">
            <strong title={`${employee.firstName} ${employee.lastName}`}>
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

        const dayAbsence = absences.find((absence) => {
          if (absence.status !== "APPROVED") {
            return false;
          }

          if (absence.unit !== "FULL_DAY") {
            return false;
          }

          const startDate = new Date(absence.startDate);
          const endDate = new Date(absence.endDate);

          return day >= startOfDay(startDate) && day <= endOfDay(endDate);
        });

        const dayHourlyAbsence = absences.find((absence) => {
          if (absence.status !== "APPROVED") {
            return false;
          }

          if (absence.unit !== "HOURLY") {
            return false;
          }

          return isSameDay(new Date(absence.startDate), day);
        });

        return (
          <button
            key={`${employee.id}-${day.toISOString()}`}
            type="button"
            className={`day-cell ${isInRange(day) ? "selecting" : ""} ${canInteract ? "" : "readonly"}`}
            onMouseDown={() => {
              if (!canInteract) return;
              setIsSelecting(true);
              setSelectionStart(day);
              setSelectionEnd(day);
            }}
            onMouseEnter={() => {
              if (isSelecting && canInteract) {
                setSelectionEnd(day);
              }
            }}
            onMouseUp={() => {
              if (!canInteract || !selectionStart) return;

              setIsSelecting(false);

              if (selectionStart.getTime() === day.getTime()) {
                onDayClick(day);
              } else {
                onRangeSelect?.(selectionStart, day);
              }

              setSelectionStart(null);
              setSelectionEnd(null);
            }}
            title={canInteract ? "Crear turno o ausencia" : "Solo lectura"}
          >
            {dayAbsence ? (
              <div
                className="absence-card"
                style={{ background: dayAbsence.absenceType.color || "#fee2e2" }}
              >
                <div className="absence-label">Ausencia</div>
                <div className="absence-name">{dayAbsence.absenceType.name}</div>
                {dayAbsence.notes ? (
                  <div className="absence-notes" title={dayAbsence.notes}>
                    {dayAbsence.notes}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="day-content">
                {dayHourlyAbsence ? (
                  <div
                    className="hourly-absence-badge"
                    style={{
                      background: dayHourlyAbsence.absenceType.color || "#fef3c7",
                    }}
                    title={`${dayHourlyAbsence.absenceType.name} · ${formatMinutes(dayHourlyAbsence.startMinutes)} - ${formatMinutes(dayHourlyAbsence.endMinutes)}`}
                  >
                    {dayHourlyAbsence.absenceType.name} ·{" "}
                    {formatMinutes(dayHourlyAbsence.startMinutes)} -{" "}
                    {formatMinutes(dayHourlyAbsence.endMinutes)}
                  </div>
                ) : null}

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

                        <div
                          className="shift-master-name"
                          title={shift.shiftMaster?.name || "Turno manual"}
                        >
                          {shift.shiftMaster?.name || "Turno manual"}
                        </div>

                        <div
                          className="shift-meta"
                          title={`${shift.department.name}${shift.workArea?.name ? ` · ${shift.workArea.name}` : ""}`}
                        >
                          {shift.department.name}
                          {shift.workArea?.name ? ` · ${shift.workArea.name}` : ""}
                        </div>

                        <div className="shift-workplace" title={shift.workplace.name}>
                          {shift.workplace.name}
                        </div>

                        {shift.notes ? (
                          <div className="shift-notes" title={shift.notes}>
                            {shift.notes}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </button>
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
          padding: 8px 6px;
        }

        .employee-info {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .employee-avatar {
          width: 28px;
          height: 28px;
          min-width: 28px;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
          background: #dbeafe;
          color: #1e3a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
        }

        .employee-text {
          min-width: 0;
          flex: 1;
        }

        .employee-text strong {
          display: block;
          font-size: 11px;
          color: #0f172a;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .day-cell {
          min-height: 84px;
          padding: 4px;
          border-top: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          background: #ffffff;
          text-align: left;
          border-right: none;
          border-bottom: none;
          cursor: pointer;
        }

        .day-cell:hover {
          background: #f8fafc;
        }

        .day-cell.readonly {
          cursor: default;
        }

        .day-cell.readonly:hover {
          background: #ffffff;
        }

        .day-cell.selecting {
          background: #fef3c7;
          outline: 2px solid #f59e0b;
          outline-offset: -2px;
        }

        .empty-day {
          height: 100%;
          min-height: 74px;
          border: 1px dashed #dbe4f0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 14px;
        }

        .day-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 74px;
        }

        .absence-card {
          min-height: 74px;
          border-radius: 10px;
          padding: 6px;
          border: 1px solid #fecaca;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        .absence-label {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          color: #991b1b;
          line-height: 1.1;
        }

        .absence-name {
          margin-top: 4px;
          font-size: 10px;
          font-weight: 800;
          color: #7f1d1d;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .absence-notes {
          margin-top: 4px;
          font-size: 9px;
          color: #7f1d1d;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hourly-absence-badge {
          border-radius: 8px;
          padding: 4px 6px;
          border: 1px solid #fcd34d;
          font-size: 9px;
          font-weight: 700;
          color: #92400e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .shift-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .shift-card {
          border-radius: 10px;
          padding: 5px 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          overflow: hidden;
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
          gap: 4px;
        }

        .shift-time {
          font-size: 10px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }

        .shift-type {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 5px;
          border-radius: 999px;
          font-size: 8px;
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

        .shift-master-name,
        .shift-meta,
        .shift-workplace,
        .shift-notes {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .shift-master-name {
          margin-top: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.1;
        }

        .shift-meta {
          margin-top: 3px;
          font-size: 9px;
          color: #334155;
          line-height: 1.1;
        }

        .shift-workplace {
          margin-top: 3px;
          font-size: 9px;
          color: #64748b;
          line-height: 1.1;
        }

        .shift-notes {
          margin-top: 3px;
          font-size: 9px;
          color: #475569;
          line-height: 1.1;
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

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMinutes(value: number | null) {
  if (value == null) return "";

  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
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