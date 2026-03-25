"use client";

import { useEffect, useMemo, useState } from "react";
// Ajusta esta ruta según la ubicación real del componente en tu proyecto
import ShiftMasterForm from "@/components/shift-masters/shift-master-form";
type ShiftMasterType = "GENERAL" | "RESTAURANTE" | "PISOS";

type ShiftMaster = {
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
  workplace: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
};

type Workplace = {
  id: string;
  name: string;
  isActive: boolean;
};

type Department = {
  id: string;
  name: string;
  workplaceId: string;
  isActive: boolean;
};

export default function ShiftMastersPage() {
  const [shiftMasters, setShiftMasters] = useState<ShiftMaster[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedType, setSelectedType] = useState<"" | ShiftMasterType>("");

  const [isShiftMasterFormOpen, setIsShiftMasterFormOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const availableDepartments = useMemo(() => {
    if (!selectedWorkplaceId) {
      return departments;
    }

    return departments.filter(
      (department) => department.workplaceId === selectedWorkplaceId
    );
  }, [departments, selectedWorkplaceId]);

  const filteredShiftMasters = useMemo(() => {
    return shiftMasters.filter((item) => {
      const matchesWorkplace = selectedWorkplaceId
        ? item.workplaceId === selectedWorkplaceId
        : true;

      const matchesDepartment = selectedDepartmentId
        ? item.departmentId === selectedDepartmentId
        : true;

      const matchesType = selectedType ? item.type === selectedType : true;

      return matchesWorkplace && matchesDepartment && matchesType;
    });
  }, [shiftMasters, selectedWorkplaceId, selectedDepartmentId, selectedType]);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedWorkplaceId) {
      return;
    }

    const departmentStillValid = availableDepartments.some(
      (department) => department.id === selectedDepartmentId
    );

    if (!departmentStillValid) {
      setSelectedDepartmentId("");
    }
  }, [selectedWorkplaceId, selectedDepartmentId, availableDepartments]);

  async function loadInitialData() {
    try {
      setIsLoading(true);
      setIsLoadingFilters(true);
      setError(null);

      const [shiftMastersResponse, workplacesResponse, departmentsResponse] =
        await Promise.all([
          fetch("/api/shift-masters", { cache: "no-store" }),
          fetch("/api/workplaces", { cache: "no-store" }),
          fetch("/api/departments", { cache: "no-store" }),
        ]);

      const shiftMastersData = await shiftMastersResponse.json();
      const workplacesData = await workplacesResponse.json();
      const departmentsData = await departmentsResponse.json();

      if (!shiftMastersResponse.ok) {
        throw new Error(
          shiftMastersData.error ||
            "No se pudieron cargar los maestros de turnos."
        );
      }

      if (!workplacesResponse.ok) {
        throw new Error(
          workplacesData.error || "No se pudieron cargar los centros."
        );
      }

      if (!departmentsResponse.ok) {
        throw new Error(
          departmentsData.error || "No se pudieron cargar los departamentos."
        );
      }

      setShiftMasters(shiftMastersData as ShiftMaster[]);
      setWorkplaces(
        (workplacesData as Workplace[])
          .filter((workplace) => workplace.isActive)
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
      setDepartments(
        (departmentsData as Department[])
          .filter((department) => department.isActive)
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ha ocurrido un error inesperado."
      );
    } finally {
      setIsLoading(false);
      setIsLoadingFilters(false);
    }
  }

  async function handleShiftMasterCreated() {
    setIsShiftMasterFormOpen(false);
    await loadInitialData();
  }

  function resetFilters() {
    setSelectedWorkplaceId("");
    setSelectedDepartmentId("");
    setSelectedType("");
  }

  return (
    <>
      <div className="page-shell">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">HORION</p>
            <h1 className="page-title">Maestro de turnos</h1>
            <p className="page-subtitle">
              Catálogo base de turnos reutilizables por centro y departamento
            </p>
          </div>

          <div className="header-actions">
            <button className="action-button secondary" onClick={loadInitialData}>
              Recargar
            </button>
            <button
              className="action-button primary"
              onClick={() => setIsShiftMasterFormOpen(true)}
            >
              + Nuevo maestro
            </button>
          </div>
        </div>

        <div className="filters-card">
          <div className="filters-grid">
            <div className="field">
              <label htmlFor="workplaceId">Centro</label>
              <select
                id="workplaceId"
                value={selectedWorkplaceId}
                onChange={(event) => setSelectedWorkplaceId(event.target.value)}
                disabled={isLoadingFilters}
              >
                <option value="">Todos los centros</option>
                {workplaces.map((workplace) => (
                  <option key={workplace.id} value={workplace.id}>
                    {workplace.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="departmentId">Departamento</label>
              <select
                id="departmentId"
                value={selectedDepartmentId}
                onChange={(event) => setSelectedDepartmentId(event.target.value)}
                disabled={isLoadingFilters}
              >
                <option value="">Todos los departamentos</option>
                {availableDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="type">Tipo</label>
              <select
                id="type"
                value={selectedType}
                onChange={(event) =>
                  setSelectedType(event.target.value as "" | ShiftMasterType)
                }
                disabled={isLoadingFilters}
              >
                <option value="">Todos los tipos</option>
                <option value="GENERAL">General</option>
                <option value="RESTAURANTE">Restaurante</option>
                <option value="PISOS">Pisos</option>
              </select>
            </div>

            <div className="field actions-field">
              <label>&nbsp;</label>
              <button className="reset-button" onClick={resetFilters}>
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-item">
            <span className="summary-value">{shiftMasters.length}</span>
            <span className="summary-label">total</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{filteredShiftMasters.length}</span>
            <span className="summary-label">visibles</span>
          </div>
        </div>

        {error ? (
          <div className="state-card error">
            <p>{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="state-card">
            <p>Cargando maestros de turnos...</p>
          </div>
        ) : filteredShiftMasters.length === 0 ? (
          <div className="state-card">
            <p>No hay maestros de turnos para mostrar.</p>
          </div>
        ) : (
          <div className="table-card">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Centro</th>
                    <th>Departamento</th>
                    <th>Tipo</th>
                    <th>Horario</th>
                    <th>Parcial</th>
                    <th>Restaurante</th>
                    <th>Pisos</th>
                    <th>Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShiftMasters.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="code-badge">{item.code}</span>
                      </td>

                      <td>
                        <div className="name-cell">
                          <strong>{item.name}</strong>
                          {item.description ? (
                            <span>{item.description}</span>
                          ) : null}
                        </div>
                      </td>

                      <td>{item.workplace.name}</td>
                      <td>{item.department.name}</td>

                      <td>
                        <span className={`type-badge ${item.type.toLowerCase()}`}>
                          {formatType(item.type)}
                        </span>
                      </td>

                      <td>
                        <div className="schedule-cell">
                          <strong>
                            {formatMinute(item.startMinute)} -{" "}
                            {formatMinute(item.endMinute)}
                          </strong>
                          {item.crossesMidnight ? (
                            <span>Cruza medianoche</span>
                          ) : null}
                        </div>
                      </td>

                      <td>
                        <BooleanBadge
                          value={item.isPartial}
                          trueLabel="Sí"
                          falseLabel="No"
                        />
                      </td>

                      <td>
                        {item.type === "RESTAURANTE" ? (
                          <div className="flag-stack">
                            <MiniFlag
                              active={item.coversBreakfast}
                              label="Desayuno"
                            />
                            <MiniFlag active={item.coversLunch} label="Almuerzo" />
                            <MiniFlag active={item.coversDinner} label="Cena" />
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>

                      <td>
                        {item.type === "PISOS" ? (
                          <BooleanBadge
                            value={item.countsForRoomAssignment}
                            trueLabel="Cuenta"
                            falseLabel="No cuenta"
                          />
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>

                      <td>
                        <BooleanBadge
                          value={item.isActive}
                          trueLabel="Activo"
                          falseLabel="Inactivo"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ShiftMasterForm
        open={isShiftMasterFormOpen}
        onOpenChange={setIsShiftMasterFormOpen}
        onSuccess={handleShiftMasterCreated}
      />

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

        .header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .action-button {
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .action-button:hover {
          transform: translateY(-1px);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .action-button.primary {
          background: #b7791f;
          color: white;
        }

        .action-button.secondary {
          background: #0f172a;
          color: white;
        }

        .filters-card,
        .summary-card,
        .table-card,
        .state-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        .filters-card {
          padding: 18px 20px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .actions-field {
          justify-content: flex-end;
        }

        label {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }

        select,
        .reset-button {
          width: 100%;
          border: 1px solid #dbe4f0;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          background: white;
          color: #0f172a;
        }

        .reset-button {
          background: #f8fafc;
          font-weight: 700;
          cursor: pointer;
        }

        .summary-card {
          padding: 16px 20px;
          display: flex;
          gap: 12px;
        }

        .summary-item {
          min-width: 100px;
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
          margin-top: 4px;
          font-size: 12px;
          color: #64748b;
        }

        .state-card {
          padding: 24px;
        }

        .state-card.error {
          border-color: #fecaca;
          background: #fff7f7;
          color: #991b1b;
        }

        .table-card {
          overflow: hidden;
        }

        .table-scroll {
          overflow: auto;
        }

        .table {
          width: 100%;
          min-width: 1280px;
          border-collapse: collapse;
        }

        .table th,
        .table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }

        .table th {
          background: #0f172a;
          color: white;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
        }

        .name-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .name-cell strong {
          color: #0f172a;
          font-size: 14px;
        }

        .name-cell span {
          color: #64748b;
          font-size: 12px;
        }

        .code-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 800;
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

        .schedule-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .schedule-cell strong {
          color: #0f172a;
          font-size: 14px;
        }

        .schedule-cell span {
          color: #64748b;
          font-size: 12px;
        }

        .flag-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .muted {
          color: #94a3b8;
        }

        @media (max-width: 1100px) {
          .filters-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .page-shell {
            padding: 16px;
          }

          .page-title {
            font-size: 26px;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

function BooleanBadge({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <>
      <span className={`badge ${value ? "true" : "false"}`}>
        {value ? trueLabel : falseLabel}
      </span>

      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .badge.true {
          background: #ecfdf5;
          border-color: #86efac;
          color: #166534;
        }

        .badge.false {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #475569;
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