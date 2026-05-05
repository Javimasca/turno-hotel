"use client";

import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";
import ShiftForm from "@/components/shifts/shift-form";
import AbsenceForm from "@/components/absences/absence-form";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  canCreateAbsenceForEmployeeFrontend,
  canInteractWithEmployeeRowFrontend,
  canManageShiftsForEmployeeFrontend,
  type FrontendPermissionUser,
} from "@/lib/permissions/canManageEmployeeFrontend";
import {
  formatDateOnly,
  isDateOnlyInRange,
  type DateOnly,
} from "@/lib/date-only";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  isActive: boolean;
  directManagerEmployeeId: string | null;
  employeeContracts?: {
    id: string;
    startDate: DateOnly;
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
type RestaurantServiceType = "BREAKFAST" | "LUNCH" | "DINNER";
type PlanningDayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

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
    coversBreakfast: boolean;
    coversLunch: boolean;
    coversDinner: boolean;
  } | null;
};

type RestaurantPlanningWeekStorage = {
  breakfastCovers?: Partial<Record<PlanningDayKey, number>>;
  lunchCovers?: Partial<Record<PlanningDayKey, number>>;
  dinnerCovers?: Partial<Record<PlanningDayKey, number>>;
};

type Absence = {
  id: string;
  employeeId: string;
  absenceTypeId: string;
  unit: "FULL_DAY" | "HOURLY";
  startDate: DateOnly;
  endDate: DateOnly;
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

type EmployeeAvailabilityBlock = {
  id: string;
  employeeId: string;
  date: DateOnly;
  startAt: string | null;
  endAt: string | null;
  type: "DAY_OFF" | "UNAVAILABLE";
  reason: string | null;
};


type ShiftsApiResponse = {
  shifts: Shift[];
  absences: Absence[];
};

type CellSelection = {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  shiftId?: string;
  absenceId?: string;
  availabilityBlockId?: string;
};

type CurrentUser = FrontendPermissionUser;

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function TurnosPage() {
  const { user, isLoading: isUserLoading, error: userError } = useCurrentUser();

  const canManageShifts =
    user?.isActive === true &&
    (user.role === "ADMIN" || user.role === "MANAGER");

  const canCreateAbsences =
    user?.isActive === true &&
    (user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      user.role === "EMPLOYEE");

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getStartOfWeek(new Date())
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<EmployeeAvailabilityBlock[]>([]);

  const [workplaces, setWorkplaces] = useState<WorkplaceOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [workAreas, setWorkAreas] = useState<WorkAreaOption[]>([]);
  const [plannedCoversByService, setPlannedCoversByService] = useState<
    Record<RestaurantServiceType, Partial<Record<DateOnly, number>>>
  >(createEmptyRestaurantServiceDayMap());

  const [isLoading, setIsLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [editingAbsenceId, setEditingAbsenceId] = useState<string | null>(null);
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

  const selectedCellEmployee = useMemo(() => {
    if (!selectedCell) return null;

    return employees.find((employee) => employee.id === selectedCell.employeeId) ?? null;
  }, [selectedCell, employees]);

  const selectedCellCanManageShifts =
  selectedCellEmployee != null &&
  canManageShiftsForEmployeeFrontend(user, selectedCellEmployee);

const selectedCellCanCreateAbsences =
  selectedCellEmployee != null &&
  canCreateAbsenceForEmployeeFrontend(user, selectedCellEmployee);

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
    setPlannedCoversByService(
      loadPlannedCoversByServiceFromStorage(currentWeekStart)
    );
  }, [currentWeekStart]);

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

     const availabilityParams = new URLSearchParams({
       startDate: toInputDate(startAt),
       endDate: toInputDate(endAt),
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

      const [employeesResponse, shiftsResponse, availabilityResponse] = await Promise.all([
  fetch("/api/employees", { cache: "no-store" }),
  fetch(`/api/shifts?${shiftParams.toString()}`, {
    cache: "no-store",
  }),
  fetch(`/api/employee-availability-blocks?${availabilityParams.toString()}`, {
    cache: "no-store",
  }),
]);

 

      if (!employeesResponse.ok) {
        throw new Error("No se pudieron cargar los empleados.");
      }

      if (!shiftsResponse.ok) {
        throw new Error("No se pudo cargar el cuadrante.");
      }

      if (!availabilityResponse.ok) {
        throw new Error("No se pudieron cargar los días libres.");
      }

      const employeesData = (await employeesResponse.json()) as Employee[];
      const shiftsData = (await shiftsResponse.json()) as ShiftsApiResponse | {
  shifts?: Shift[];
  absences?: Absence[];
  error?: string;
};
      const availabilityData =
  (await availabilityResponse.json()) as EmployeeAvailabilityBlock[];

const normalizedAvailabilityBlocks = Array.isArray(availabilityData)
  ? availabilityData.map(normalizeAvailabilityBlock)
  : [];
const normalizedShifts = Array.isArray(shiftsData?.shifts) ? shiftsData.shifts : [];
const normalizedAbsences = Array.isArray(shiftsData?.absences)
  ? shiftsData.absences.map(normalizeAbsence)
  : [];

setAvailabilityBlocks(normalizedAvailabilityBlocks);
setShifts(normalizedShifts);
setAbsences(normalizedAbsences);

      setEmployees(
        employeesData
          .map(normalizeEmployee)
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
                  x.startDate.localeCompare(y.startDate)
              )[0]?.startDate;

            const bOldestContractDate = [...(b.employeeContracts ?? [])]
              .sort(
                (x, y) =>
                  x.startDate.localeCompare(y.startDate)
              )[0]?.startDate;

            const aSeniority = aOldestContractDate
              ? aOldestContractDate
              : Number.MAX_SAFE_INTEGER;

            const bSeniority = bOldestContractDate
              ? bOldestContractDate
              : Number.MAX_SAFE_INTEGER;

            if (aSeniority !== bSeniority) {
              return String(aSeniority).localeCompare(String(bSeniority));
            }

            const lastNameCompare = a.lastName.localeCompare(b.lastName, "es");
            if (lastNameCompare !== 0) {
              return lastNameCompare;
            }

            return a.firstName.localeCompare(b.firstName, "es");
          })
      );

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
    const safeShifts = Array.isArray(shifts) ? shifts : [];

    if (selectedStatus === "all") {
      return safeShifts;
    }

    return safeShifts.filter((shift) => shift.status === selectedStatus);
  }, [shifts, selectedStatus]);

  const restaurantShifts = useMemo(
    () => filteredShifts.filter((shift) => shift.shiftMaster?.type === "RESTAURANTE"),
    [filteredShifts]
  );

  const restaurantCoverageByService = useMemo(
    () => buildRestaurantCoverageByService(restaurantShifts),
    [restaurantShifts]
  );

  const restaurantServicesByDay = useMemo(
    () => plannedCoversByService,
    [plannedCoversByService]
  );

  const restaurantRatioByService = useMemo(
    () =>
      buildRestaurantRatioByService({
        coversByService: restaurantServicesByDay,
        peopleByService: restaurantCoverageByService,
      }),
    [restaurantServicesByDay, restaurantCoverageByService]
  );

  const hasPlannedRestaurantCovers = useMemo(() => {
    return (["BREAKFAST", "LUNCH", "DINNER"] as const).some((serviceType) =>
      Object.values(restaurantServicesByDay[serviceType] ?? {}).some(
        (covers) => Number(covers ?? 0) > 0
      )
    );
  }, [restaurantServicesByDay]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = employeeSearch.trim().toLocaleLowerCase("es");
    const employeeIdsWithVisibleShifts = new Set(
  (Array.isArray(filteredShifts) ? filteredShifts : []).map(
    (shift) => shift.employeeId
  )
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

  function handleOpenShiftForm(
  employeeId?: string,
  date?: Date,
  shiftId?: string
) {
  if (!canManageShifts) return;

  if (employeeId) {
    const employee = employees.find((item) => item.id === employeeId);
    if (!employee || !canManageShiftsForEmployeeFrontend(user, employee)) {
      return;
    }
  }

  setPrefillEmployeeId(employeeId ?? "");
  setPrefillDate(date ? toInputDate(date) : "");
  setEditingShiftId(shiftId ?? null);
  setShowForm(true);
}

  function handleCloseShiftForm() {
  setShowForm(false);
  setEditingShiftId(null);
  setPrefillEmployeeId("");
  setPrefillDate("");
  setPrefillEndDate("");
}

  function handleOpenAbsenceForm(employeeId?: string, date?: Date) {
    if (!canCreateAbsences) return;

    if (employeeId) {
      const employee = employees.find((item) => item.id === employeeId);
      if (!employee || !canCreateAbsenceForEmployeeFrontend(user, employee)) {
        return;
      }
    }

  setPrefillEmployeeId(employeeId ?? "");
  setPrefillDate(date ? toInputDate(date) : "");
  setPrefillEndDate(date ? toInputDate(date) : "");
  setEditingAbsenceId(null);
  setShowAbsenceForm(true);
  }

  function handleCloseAbsenceForm() {
    setShowAbsenceForm(false);
    setEditingAbsenceId(null);
    setPrefillEmployeeId("");
    setPrefillDate("");
    setPrefillEndDate("");
  }

  function handleCellClick(
  employee: Employee,
  date: Date,
  cellContent?: {
    shiftId?: string;
    absenceId?: string;
    availabilityBlockId?: string;
  }
) {
  if (!canInteractWithEmployeeRowFrontend(user, employee)) return;



  setSelectedCell({
    employeeId: employee.id,
    startDate: date,
    endDate: date,
    shiftId: cellContent?.shiftId,
    absenceId: cellContent?.absenceId,
    availabilityBlockId: cellContent?.availabilityBlockId,
  });

  setShowCellActionModal(true);
}

    function handleRangeSelect(employee: Employee, start: Date, end: Date) {
    if (!canInteractWithEmployeeRowFrontend(user, employee)) return;

    const normalizedStart = start <= end ? start : end;
    const normalizedEnd = start <= end ? end : start;

    setSelectedCell({
      employeeId: employee.id,
      startDate: normalizedStart,
      endDate: normalizedEnd,
    });

    setShowCellActionModal(true);
  }

  function handleCloseCellActionModal() {
    setShowCellActionModal(false);
    setSelectedCell(null);
  }

  function handleCreateShiftFromCell() {
  if (!selectedCell || !selectedCellEmployee || !selectedCellCanManageShifts) return;

  setShowCellActionModal(false);

  setPrefillEmployeeId(selectedCell.employeeId);
  setPrefillDate(toInputDate(selectedCell.startDate));
  setPrefillEndDate(toInputDate(selectedCell.endDate));
  setShowForm(true);

  setSelectedCell(null);
}

  function handleCreateAbsenceFromCell() {
    if (
      !selectedCell ||
      !selectedCellEmployee ||
      !selectedCellCanCreateAbsences
    ) {
      return;
    }

    setShowCellActionModal(false);
    setPrefillEmployeeId(selectedCell.employeeId);
    setPrefillDate(toInputDate(selectedCell.startDate));
    setPrefillEndDate(toInputDate(selectedCell.endDate));
    setEditingAbsenceId(null);
    setShowAbsenceForm(true);
    setSelectedCell(null);
  }

async function handleDeleteSelectedRangeRecords() {
  if (!selectedCell || !selectedCellEmployee || !selectedCellCanManageShifts) {
    return;
  }

  const rangeStart = startOfDay(selectedCell.startDate);
  const rangeEnd = endOfDay(selectedCell.endDate);
  const rangeStartDate = toInputDate(selectedCell.startDate);
  const rangeEndDate = toInputDate(selectedCell.endDate);

  const shiftsToDelete = shifts.filter((shift) => {
    if (shift.employeeId !== selectedCell.employeeId) return false;

    const shiftDate = new Date(shift.startAt);
    return shiftDate >= rangeStart && shiftDate <= rangeEnd;
  });

  const absencesToDelete = absences.filter((absence) => {
    if (absence.employeeId !== selectedCell.employeeId) return false;

    return absence.startDate <= rangeEndDate && absence.endDate >= rangeStartDate;
  });

  const availabilityBlocksToDelete = availabilityBlocks.filter((block) => {
    if (block.employeeId !== selectedCell.employeeId) return false;

    return isDateOnlyInRange(block.date, rangeStartDate, rangeEndDate);
  });

  const total =
    shiftsToDelete.length +
    absencesToDelete.length +
    availabilityBlocksToDelete.length;

  if (total === 0) {
    alert("No hay registros para eliminar en esta selección.");
    return;
  }

  const confirmed = window.confirm(
    `¿Seguro que quieres eliminar ${total} registro(s) de esta selección?`
  );

  if (!confirmed) return;

  const requests = [
    ...shiftsToDelete.map((shift) =>
      fetch(`/api/shifts/${shift.id}`, { method: "DELETE" })
    ),
    ...absencesToDelete.map((absence) =>
      fetch(`/api/absences/${absence.id}`, { method: "DELETE" })
    ),
    ...availabilityBlocksToDelete.map((block) =>
      fetch(`/api/employee-availability-blocks/${block.id}`, {
        method: "DELETE",
      })
    ),
  ];

  const results = await Promise.all(requests);
  const failed = results.filter((response) => !response.ok);

  if (failed.length > 0) {
    alert(`No se pudieron eliminar ${failed.length} registro(s).`);
    return;
  }

  setShowCellActionModal(false);
  setSelectedCell(null);

  await loadWeekData(currentWeekStart);
}

async function handleDeleteSelectedCellRecord() {
  if (!selectedCell || !selectedCellEmployee || !selectedCellCanManageShifts) {
    return;
  }

  const confirmed = window.confirm(
    "¿Seguro que quieres eliminar el registro de esta celda?"
  );

  if (!confirmed) return;

  const endpoint = selectedCell.availabilityBlockId
    ? `/api/employee-availability-blocks/${selectedCell.availabilityBlockId}`
    : selectedCell.absenceId
      ? `/api/absences/${selectedCell.absenceId}`
      : selectedCell.shiftId
        ? `/api/shifts/${selectedCell.shiftId}`
        : null;

  if (!endpoint) return;

  const response = await fetch(endpoint, {
    method: "DELETE",
  });

  if (!response.ok) {
    alert("No se pudo eliminar el registro.");
    return;
  }

  setShowCellActionModal(false);
  setSelectedCell(null);

  await loadWeekData(currentWeekStart);
}

function handleEditSelectedCell() {
  if (!selectedCell || !selectedCellEmployee) return;

  // EDITAR TURNO
  if (selectedCell.shiftId && selectedCellCanManageShifts) {
  handleOpenShiftForm(
    selectedCell.employeeId,
    selectedCell.startDate,
    selectedCell.shiftId
  );
    setShowCellActionModal(false);
    setSelectedCell(null);
    return;
  }

  // EDITAR AUSENCIA
  if (selectedCell.absenceId && selectedCellCanCreateAbsences) {
    setPrefillEmployeeId(selectedCell.employeeId);
    setPrefillDate(toInputDate(selectedCell.startDate));
    setPrefillEndDate(toInputDate(selectedCell.endDate));
    setEditingAbsenceId(selectedCell.absenceId);
    setShowAbsenceForm(true);
    setShowCellActionModal(false);
    setSelectedCell(null);
    return;
  }

  // EDITAR DÍA LIBRE (de momento lo tratamos como recrear)
  if (selectedCell.availabilityBlockId && selectedCellCanManageShifts) {
    alert("Edición de día libre próximamente");
    return;
  }
}

async function handleCreateDayOffFromCell() {
  if (!selectedCell || !selectedCellEmployee || !selectedCellCanManageShifts) {
    return;
  }

  const days = getDatesBetween(selectedCell.startDate, selectedCell.endDate);

  const results = await Promise.all(
    days.map((day) =>
      fetch("/api/employee-availability-blocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: selectedCell.employeeId,
          date: toInputDate(day),
          type: "DAY_OFF",
          reason: "Día libre",
        }),
      })
    )
  );

  const failed = results.filter((res) => !res.ok);

  if (failed.length > 0) {
    alert(`No se pudieron crear ${failed.length} días libres`);
    return;
  }

  setShowCellActionModal(false);
  setSelectedCell(null);

  await loadWeekData(currentWeekStart);
}
 
  async function handleCreated() {
    await loadWeekData(currentWeekStart);
  }

  return (
    <>
      <div className="page-shell">
        
        {userError ? (
          <div className="state-card error">
            <p>{userError}</p>
          </div>
        ) : null}

        {!isUserLoading && user?.role === "EMPLOYEE" ? (
          <div className="state-card info">
            <p>
              Estás viendo el cuadrante como empleado. Solo puedes registrar ausencias
              sobre tu propia fila.
            </p>
          </div>
        ) : null}

        {!isUserLoading && user?.role === "MANAGER" ? (
          <div className="state-card info">
            <p>
              Estás viendo el cuadrante como manager. Solo puedes gestionar tu propia
              fila y la de tus subordinados directos.
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

              {filteredEmployees.map((employee) => {
                const canInteract = canInteractWithEmployeeRowFrontend(user, employee);

                return (
                  <WeeklyEmployeeRow
  key={employee.id}
  employee={employee}
  weekDays={weekDays}
  shifts={filteredShifts.filter((shift) => shift.employeeId === employee.id)}
  absences={absences.filter((absence) => absence.employeeId === employee.id)}
  availabilityBlocks={availabilityBlocks.filter(
    (block) => block.employeeId === employee.id
  )}
  selectedCell={selectedCell}
  canInteract={canInteract}
  onDayClick={(day, cellContent) =>
    handleCellClick(employee, day, cellContent)
  }
  onRangeSelect={(start, end) => handleRangeSelect(employee, start, end)}
/>

                );
              })}
            </div>
          </div>
        )}

        {!isLoading &&
        (restaurantShifts.length > 0 || hasPlannedRestaurantCovers) ? (
          <div className="restaurant-summary-card">
            <div className="restaurant-summary-header">
              <h2 className="filters-title">Resumen restaurante</h2>
              <p className="filters-subtitle">
                Personas asignadas y ratio activo por servicio en la semana visible.
              </p>
            </div>

            <div className="restaurant-summary-grid">
              <div className="restaurant-summary-corner">Servicio</div>
              {weekDays.map((day, index) => (
                <div key={`restaurant-head-${day.toISOString()}`} className="restaurant-summary-day">
                  <span>{DAY_NAMES[index]}</span>
                  <strong>{formatDayNumber(day)}</strong>
                </div>
              ))}

              {(["BREAKFAST", "LUNCH", "DINNER"] as const).map((serviceType) => (
                <Fragment key={`service-row-${serviceType}`}>
                  <div className="restaurant-summary-service">
                    {formatRestaurantService(serviceType)}
                  </div>
                  {weekDays.map((day) => {
                    const dayKey = toInputDate(day);
                    const people = restaurantCoverageByService[serviceType][dayKey] ?? 0;
                    const covers = restaurantServicesByDay[serviceType][dayKey] ?? 0;
                    const ratio = restaurantRatioByService[serviceType][dayKey];

                    return (
                      <div
                        key={`service-${serviceType}-${dayKey}`}
                        className="restaurant-summary-cell"
                      >
                        <span className="restaurant-summary-assigned">
                          {people} personas
                        </span>
                        <span className="restaurant-summary-covers">
                          {covers} servicios
                        </span>
                        <span className="restaurant-summary-ratio">
                          {people > 0
                            ? `Ratio: ${covers}/${people} = ${ratio ?? "0.00"}`
                            : "Ratio: N/D"}
                        </span>
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        ) : null}

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
  initialEndDate={prefillEndDate}
  shiftId={editingShiftId ?? undefined}
/>
) : null}

      {showAbsenceForm ? (
        <AbsenceForm
  onClose={handleCloseAbsenceForm}
  onCreated={handleCreated}
  absenceId={editingAbsenceId ?? undefined}
  initialEmployeeId={prefillEmployeeId}
  initialDate={prefillDate || ""}
initialEndDate={prefillEndDate || ""}
/>
      ) : null}

      {showCellActionModal && selectedCell ? (
        <div className="cell-action-overlay" onClick={handleCloseCellActionModal}>
          <div
            className="cell-action-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cell-action-header">
              <h3 className="cell-action-title">
  {selectedCell.shiftId
    ? "Gestionar turno"
    : selectedCell.absenceId
    ? "Gestionar ausencia"
    : selectedCell.availabilityBlockId
    ? "Gestionar día libre"
    : "Crear desde cuadrante"}
</h3>
              <p className="cell-action-subtitle">
  {selectedCell.startDate.getTime() !== selectedCell.endDate.getTime()
    ? `Selección de ${getDatesBetween(
        selectedCell.startDate,
        selectedCell.endDate
      ).length} día(s).`
    : selectedCell.shiftId
    ? "Esta celda ya tiene un turno. Puedes editarlo o eliminarlo."
    : selectedCell.absenceId
    ? "Esta celda ya tiene una ausencia. Puedes editarla o eliminarla."
    : selectedCell.availabilityBlockId
    ? "Esta celda está marcada como día libre. Puedes eliminar el bloqueo."
    : "La celda está libre. Elige qué quieres crear."}
</p>
            </div>

            <div className="cell-action-body">
            {selectedCell.startDate.getTime() !== selectedCell.endDate.getTime() ? (
  <button
    type="button"
    className="cell-action-option danger"
    onClick={handleDeleteSelectedRangeRecords}
  >
    <span className="cell-action-option-title">
      Eliminar registros de la selección
    </span>
    <span className="cell-action-option-text">
      Borra turnos, ausencias y días libres dentro del rango seleccionado.
    </span>
  </button>
) : null}

         {selectedCell.shiftId || selectedCell.absenceId || selectedCell.availabilityBlockId ? (
  <button
    type="button"
    className="cell-action-option edit"
    onClick={handleEditSelectedCell}
  >
    <span className="cell-action-option-title">
  {selectedCell.shiftId
    ? "Editar turno"
    : selectedCell.absenceId
    ? "Editar ausencia"
    : "Gestionar día libre"}
</span>
    <span className="cell-action-option-text">
      Modifica el turno, ausencia o día libre de esta celda.
    </span>
  </button>
) : null}

            {selectedCell.shiftId ||
selectedCell.absenceId ||
selectedCell.availabilityBlockId ? (
  <button
    type="button"
    className="cell-action-option danger"
    onClick={handleDeleteSelectedCellRecord}
  >
    <span className="cell-action-option-title">
  {selectedCell.shiftId
    ? "Eliminar turno"
    : selectedCell.absenceId
    ? "Eliminar ausencia"
    : "Eliminar día libre"}
</span>
    <span className="cell-action-option-text">
      Borra el turno, ausencia o día libre de esta celda.
    </span>
  </button>
) : null}

{!selectedCell.shiftId &&
!selectedCell.absenceId &&
!selectedCell.availabilityBlockId &&
selectedCellCanManageShifts ? (
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
              
{!selectedCell.absenceId &&
!selectedCell.availabilityBlockId &&
selectedCellCanCreateAbsences ? (
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


{!selectedCell.shiftId &&
!selectedCell.absenceId &&
!selectedCell.availabilityBlockId &&
selectedCellCanManageShifts ? (
  <button
    type="button"
    className="cell-action-option"
    onClick={handleCreateDayOffFromCell}
  >
    <span className="cell-action-option-title">Marcar día libre</span>
    <span className="cell-action-option-text">
      Bloquea al empleado para que no sea asignado automáticamente ese día.
    </span>
  </button>
) : null}

              {!selectedCellCanManageShifts && !selectedCellCanCreateAbsences ? (
                <div className="cell-action-empty">
                  No tienes permisos para crear registros sobre esta fila.
                </div>
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
        .restaurant-summary-card,
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
          letter-spacing: 0;
          color: #cbd5e1;
        }

        .planner-day-date {
          font-size: 16px;
          font-weight: 800;
        }

        .restaurant-summary-card {
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          background: white;
        }

        .restaurant-summary-header {
          padding: 14px 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .restaurant-summary-grid {
          display: grid;
          grid-template-columns: 150px repeat(7, minmax(120px, 1fr));
          min-width: 960px;
        }

        .restaurant-summary-corner {
          position: sticky;
          left: 0;
          z-index: 2;
          background: #0f172a;
          color: white;
          padding: 10px 8px;
          font-size: 11px;
          font-weight: 700;
          border-right: 1px solid #1e293b;
        }

        .restaurant-summary-day {
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

        .restaurant-summary-day span {
          font-size: 10px;
          text-transform: uppercase;
          color: #cbd5e1;
          letter-spacing: 0;
        }

        .restaurant-summary-day strong {
          font-size: 15px;
          line-height: 1;
        }

        .restaurant-summary-service {
          position: sticky;
          left: 0;
          z-index: 1;
          background: white;
          border-top: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          padding: 12px 10px;
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
        }

        .restaurant-summary-cell {
          border-top: 1px solid #e2e8f0;
          border-left: 1px solid #e2e8f0;
          padding: 8px;
          min-height: 72px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .restaurant-summary-assigned {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }

        .restaurant-summary-covers {
          font-size: 11px;
          color: #334155;
        }

        .restaurant-summary-ratio {
          font-size: 11px;
          color: #64748b;
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

        .cell-action-option.edit {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.cell-action-option.edit:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
}

.cell-action-option.edit .cell-action-option-title {
  color: #1e3a8a;
}

.cell-action-option.edit .cell-action-option-text {
  color: #1d4ed8;
}

        .cell-action-option.danger {
  border-color: #fecaca;
  background: #fff7f7;
}

.cell-action-option.danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.12);
}

.cell-action-option.danger .cell-action-option-title {
  color: #991b1b;
}

.cell-action-option.danger .cell-action-option-text {
  color: #b91c1c;
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

        .cell-action-empty {
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
          padding: 14px;
          font-size: 12px;
          color: #64748b;
          background: #f8fafc;
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
  availabilityBlocks: EmployeeAvailabilityBlock[];
  selectedCell: CellSelection | null;
  canInteract: boolean;
  onDayClick: (
    day: Date,
    cellContent?: {
      shiftId?: string;
      absenceId?: string;
      availabilityBlockId?: string;
    }
  ) => void;
  onRangeSelect?: (start: Date, end: Date) => void;
};

function WeeklyEmployeeRow({
  employee,
  weekDays,
  shifts,
  absences,
  availabilityBlocks,
  selectedCell,
  canInteract,
  onDayClick,
  onRangeSelect,
}: WeeklyEmployeeRowProps) {

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);

  const employeeAbsences = useMemo(
    () =>
      absences.filter(
        (absence) =>
          absence.employeeId === employee.id &&
          absence.status !== "REJECTED" &&
          absence.status !== "CANCELLED"
      ),
    [absences, employee.id]
  );

  const employeeAvailabilityBlocks = useMemo(
    () => availabilityBlocks.filter((block) => block.employeeId === employee.id),
    [availabilityBlocks, employee.id]
  );

  function isInRange(day: Date) {
  // Selección mientras arrastras
  if (selectionStart && selectionEnd) {
    const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart > selectionEnd ? selectionStart : selectionEnd;

    if (day >= startOfDay(start) && day <= endOfDay(end)) {
      return true;
    }
  }

  // Selección ya confirmada (desde selectedCell)
  if (
    selectedCell &&
    selectedCell.employeeId === employee.id &&
    selectedCell.startDate &&
    selectedCell.endDate
  ) {
    const start = startOfDay(selectedCell.startDate);
    const end = endOfDay(selectedCell.endDate);

    if (day >= start && day <= end) {
      return true;
    }
  }

  return false;
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
        const dayDate = toInputDate(day);

        const dayShifts = shifts
          .filter((shift) => isSameDay(new Date(shift.startAt), day))
          .sort(
            (a, b) =>
              new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
          );

        const dayFullAbsence =
          employeeAbsences.find(
            (absence) =>
              absence.unit === "FULL_DAY" &&
              isDateOnlyInRange(dayDate, absence.startDate, absence.endDate)
          ) ?? null;

        const dayHourlyAbsence =
          employeeAbsences.find(
            (absence) => absence.unit === "HOURLY" && absence.startDate === dayDate
          ) ?? null;

        const dayOff =
          employeeAvailabilityBlocks.find(
            (block) =>
              (block.type === "DAY_OFF" || block.type === "UNAVAILABLE") &&
              block.date === dayDate
          ) ?? null;

const dayShift = dayShifts[0] ?? null;

const hasConflict = Boolean(
  (dayShift && dayFullAbsence) ||
    (dayShift && dayOff)
);

const hasWarning = Boolean(dayShift && dayHourlyAbsence);


        return (
          <div
  key={`${employee.id}-${day.toISOString()}`}
  role="button"
  tabIndex={canInteract ? 0 : -1}
 className={`day-cell 
  ${isInRange(day) ? "selecting" : ""} 
  ${canInteract ? "" : "readonly"} 
  ${hasConflict ? "conflict" : ""} 
  ${hasWarning ? "warning" : ""}`}

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
  onDayClick(day, {
    shiftId: dayShift?.id,
    absenceId: dayFullAbsence?.id ?? dayHourlyAbsence?.id,
    availabilityBlockId: dayOff?.id,
  });
} else {
  onRangeSelect?.(selectionStart, day);
}

              setSelectionStart(null);
              setSelectionEnd(null);
            }}
            title={canInteract ? "Crear turno o ausencia" : "Solo lectura"}
          >
{hasConflict ? (
  <div className="cell-alert conflict">Conflicto</div>
) : hasWarning ? (
  <div className="cell-alert warning">Aviso</div>
) : null}

{dayOff ? (
  <div className="day-off-card">
    <div className="day-off-label">Libre</div>
    <div className="day-off-name">
      {dayOff.reason || "Día libre"}
    </div>
  </div>
) : dayFullAbsence ? (
  <div
    className="absence-card"
    style={{ background: dayFullAbsence.absenceType.color || "#fee2e2" }}
  >
    <div className="absence-label">Ausencia</div>
    <div className="absence-name">{dayFullAbsence.absenceType.name}</div>
  </div>
) : (
  <div className="day-content">
    {dayShifts.length > 0 ? (
      <div className="shift-list">
        {dayShifts.map((shift) => (
          <div key={shift.id} className={`shift-card ${shift.status.toLowerCase()}`}>
            <div className="shift-card-top">
              <div className="shift-time">
                {formatTime(shift.startAt)} - {formatTime(shift.endAt)}
              </div>
              <span
                className={`shift-origin ${
                  isAutoAssignedShift(shift) ? "auto" : "manual"
                }`}
              >
                {isAutoAssignedShift(shift) ? "Propuesta" : "Usuario"}
              </span>
            </div>

            <div className="shift-code">
              {shift.shiftMaster?.code || "MANUAL"}
            </div>

            <div className="shift-description">
              {shift.shiftMaster?.name || "Turno manual"}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="empty-day">—</div>
    )}

    {dayHourlyAbsence ? (
      <div
        className="hourly-absence-badge"
        style={{
          background: dayHourlyAbsence.absenceType.color || "#fef3c7",
        }}
      >
        {dayHourlyAbsence.absenceType.name} ·{" "}
        {formatMinutes(dayHourlyAbsence.startMinutes)} -{" "}
        {formatMinutes(dayHourlyAbsence.endMinutes)}
      </div>
    ) : null}
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
          padding: 8px 6px;
        }

        .employee-info {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

         .day-cell.conflict {
  background: #fee2e2;
  outline: 2px solid #dc2626;
}

.day-cell.warning {
  background: #fef3c7;
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

         .day-off-card {
  min-height: 74px;
  border-radius: 10px;
  padding: 6px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.day-off-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  color: #1d4ed8;
  line-height: 1.1;
}

.day-off-name {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 800;
  color: #1e3a8a;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-alert {
  margin-bottom: 4px;
  border-radius: 999px;
  padding: 3px 6px;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  width: fit-content;
}

.cell-alert.conflict {
  background: #dc2626;
  color: white;
}

.cell-alert.warning {
  background: #f59e0b;
  color: #78350f;
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
  position: relative;
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

        .shift-origin {
          border-radius: 999px;
          padding: 1px 6px;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          border: 1px solid transparent;
          white-space: nowrap;
          line-height: 1.2;
        }

        .shift-origin.auto {
          color: #92400e;
          background: #fffbeb;
          border-color: #fcd34d;
        }

        .shift-origin.manual {
          color: #1e3a8a;
          background: #eff6ff;
          border-color: #bfdbfe;
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

        .shift-code,
        .shift-description {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .shift-code {
          margin-top: 4px;
          font-size: 9px;
          font-weight: 900;
          color: #1e3a8a;
          line-height: 1.1;
        }

        .shift-description {
          margin-top: 3px;
          font-size: 9px;
          color: #334155;
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

function getDatesBetween(start: Date, end: Date) {
  const normalizedStart = start <= end ? start : end;
  const normalizedEnd = start <= end ? end : start;

  const result: Date[] = [];
  let current = startOfDay(normalizedStart);

  while (current <= endOfDay(normalizedEnd)) {
    result.push(new Date(current));
    current = addDays(current, 1);
  }

  return result;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toInputDate(date: Date): DateOnly {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}` as DateOnly;
}

function normalizeAbsence(absence: Absence): Absence {
  return {
    ...absence,
    startDate: formatDateOnly(absence.startDate),
    endDate: formatDateOnly(absence.endDate),
  };
}

function normalizeAvailabilityBlock(
  block: EmployeeAvailabilityBlock
): EmployeeAvailabilityBlock {
  return {
    ...block,
    date: formatDateOnly(block.date),
  };
}

function normalizeEmployee(employee: Employee): Employee {
  return {
    ...employee,
    employeeContracts: employee.employeeContracts?.map((contract) => ({
      ...contract,
      startDate: formatDateOnly(contract.startDate),
    })),
  };
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
    hour12: false,
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

function isAutoAssignedShift(shift: Shift) {
  const notes = (shift.notes ?? "").toLocaleLowerCase("es");
  return (
    notes.includes("asignacion automatica") ||
    notes.includes("asignación automática")
  );
}

function createEmptyRestaurantServiceDayMap(): Record<
  RestaurantServiceType,
  Partial<Record<DateOnly, number>>
> {
  return {
    BREAKFAST: {},
    LUNCH: {},
    DINNER: {},
  };
}

function loadPlannedCoversByServiceFromStorage(weekStart: Date) {
  const empty = createEmptyRestaurantServiceDayMap();

  if (typeof window === "undefined") {
    return empty;
  }

  const raw = window.localStorage.getItem(getRestaurantWeekStorageKey(weekStart));
  if (!raw) return empty;

  try {
    const parsed = JSON.parse(raw) as RestaurantPlanningWeekStorage;
    const result = createEmptyRestaurantServiceDayMap();

    const dayMap: PlanningDayKey[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    dayMap.forEach((dayKey, index) => {
      const dayDate = addDays(weekStart, index);
      const dateKey = toInputDate(dayDate);

      const breakfast = Number(parsed.breakfastCovers?.[dayKey] ?? 0);
      const lunch = Number(parsed.lunchCovers?.[dayKey] ?? 0);
      const dinner = Number(parsed.dinnerCovers?.[dayKey] ?? 0);

      result.BREAKFAST[dateKey] =
        Number.isFinite(breakfast) && breakfast > 0 ? breakfast : 0;
      result.LUNCH[dateKey] = Number.isFinite(lunch) && lunch > 0 ? lunch : 0;
      result.DINNER[dateKey] = Number.isFinite(dinner) && dinner > 0 ? dinner : 0;
    });

    return result;
  } catch {
    return empty;
  }
}

function getRestaurantWeekStorageKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `turnohotel.restaurantPlanning.week.${year}-${month}-${day}`;
}

function getRestaurantServicesFromShift(
  shift: Shift
): RestaurantServiceType[] {
  if (!shift.shiftMaster || shift.shiftMaster.type !== "RESTAURANTE") {
    return [];
  }

  const explicitService = getAutoAssignedServiceFromNotes(shift.notes);
  if (explicitService) {
    return [explicitService];
  }

  const services: RestaurantServiceType[] = [];

  if (shift.shiftMaster.coversBreakfast) services.push("BREAKFAST");
  if (shift.shiftMaster.coversLunch) services.push("LUNCH");
  if (shift.shiftMaster.coversDinner) services.push("DINNER");

  return services;
}

function getAutoAssignedServiceFromNotes(
  notes: string | null
): RestaurantServiceType | null {
  if (!notes) return null;
  const normalized = notes.toLocaleLowerCase("es");

  if (
    !normalized.includes("asignación automática") &&
    !normalized.includes("asignacion automatica")
  ) {
    return null;
  }

  if (normalized.includes("servicio: desayuno")) return "BREAKFAST";
  if (normalized.includes("servicio: almuerzo")) return "LUNCH";
  if (normalized.includes("servicio: cena")) return "DINNER";

  return null;
}

function buildRestaurantCoverageByService(shifts: Shift[]) {
  const result: Record<
    RestaurantServiceType,
    Partial<Record<DateOnly, number>>
  > = {
    BREAKFAST: {},
    LUNCH: {},
    DINNER: {},
  };

  for (const shift of shifts) {
    const dayKey = toInputDate(new Date(shift.startAt));
    for (const serviceType of getRestaurantServicesFromShift(shift)) {
      result[serviceType][dayKey] = (result[serviceType][dayKey] ?? 0) + 1;
    }
  }

  return result;
}

function buildRestaurantRatioByService(params: {
  coversByService: Record<RestaurantServiceType, Partial<Record<DateOnly, number>>>;
  peopleByService: Record<RestaurantServiceType, Partial<Record<DateOnly, number>>>;
}) {
  const result: Record<
    RestaurantServiceType,
    Partial<Record<DateOnly, string>>
  > = {
    BREAKFAST: {},
    LUNCH: {},
    DINNER: {},
  };

  const services: RestaurantServiceType[] = ["BREAKFAST", "LUNCH", "DINNER"];

  for (const serviceType of services) {
    const dayKeys = new Set<DateOnly>([
      ...Object.keys(params.coversByService[serviceType] ?? {}),
      ...Object.keys(params.peopleByService[serviceType] ?? {}),
    ] as DateOnly[]);

    for (const dayKey of dayKeys) {
      const covers = params.coversByService[serviceType][dayKey] ?? 0;
      const people = params.peopleByService[serviceType][dayKey] ?? 0;

      if (people <= 0) {
        result[serviceType][dayKey] = covers > 0 ? "N/D" : "0.00";
        continue;
      }

      result[serviceType][dayKey] = (covers / people).toFixed(2);
    }
  }

  return result;
}

function formatRestaurantService(serviceType: RestaurantServiceType) {
  if (serviceType === "BREAKFAST") return "Desayunos";
  if (serviceType === "LUNCH") return "Almuerzos";
  return "Cenas";
}

