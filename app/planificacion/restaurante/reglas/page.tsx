"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ServiceType = "BREAKFAST" | "LUNCH" | "DINNER";

type WorkplaceOption = {
  id: string;
  name: string;
};

type RestaurantCoverageRule = {
  id: string;
  workplaceId: string;
  serviceType: ServiceType;
  ratioCoversPerEmployee: number;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
};

type RuleFormState = {
  serviceType: ServiceType;
  ratio: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
};

const EMPTY_FORM: RuleFormState = {
  serviceType: "BREAKFAST",
  ratio: 20,
  validFrom: "",
  validTo: "",
  isActive: true,
};

export default function RestaurantCoverageRulesPage() {
  const [workplaces, setWorkplaces] = useState<WorkplaceOption[]>([]);
  const [workplaceId, setWorkplaceId] = useState("");
  const [rules, setRules] = useState<RestaurantCoverageRule[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] =
    useState<RestaurantCoverageRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(EMPTY_FORM);

  useEffect(() => {
    void loadWorkplaces();
  }, []);

  useEffect(() => {
    void loadRules();
  }, [workplaceId]);

  async function loadWorkplaces() {
    try {
      setLoadingCatalog(true);
      setError(null);

      const res = await fetch("/api/workplaces", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar los centros");
      }

      const sorted = [...(data as WorkplaceOption[])]
        .filter((item) => item.id && item.name)
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

      setWorkplaces(sorted);

      if (!workplaceId && sorted.length > 0) {
        setWorkplaceId(sorted[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setWorkplaces([]);
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function loadRules() {
    try {
      setError(null);

      if (!workplaceId) {
        setRules([]);
        return;
      }

      setLoadingRules(true);

      const res = await fetch(
        `/api/restaurant-coverage-rules?workplaceId=${encodeURIComponent(
          workplaceId
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar las reglas");
      }

      setRules(data as RestaurantCoverageRule[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setRules([]);
    } finally {
      setLoadingRules(false);
    }
  }

  function openCreateModal() {
    setEditingRule(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(rule: RestaurantCoverageRule) {
    setEditingRule(rule);
    setForm({
      serviceType: rule.serviceType,
      ratio: rule.ratioCoversPerEmployee,
      validFrom: toDateInputValue(rule.validFrom),
      validTo: rule.validTo ? toDateInputValue(rule.validTo) : "",
      isActive: rule.isActive,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingRule(null);
    setForm(EMPTY_FORM);
  }

  async function handleSaveRule() {
    try {
      setError(null);

      const method = editingRule ? "PATCH" : "POST";

      const res = await fetch("/api/restaurant-coverage-rules", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingRule?.id,
          workplaceId,
          serviceType: form.serviceType,
          ratioCoversPerEmployee: Number(form.ratio),
          validFrom: form.validFrom,
          validTo: form.validTo || null,
          isActive: form.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar la regla");
      }

      closeModal();
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleDeleteRule(rule: RestaurantCoverageRule) {
    const confirmed = window.confirm(
      `¿Eliminar la regla de ${label(rule.serviceType)} con vigencia desde ${format(
        rule.validFrom
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      const res = await fetch(
        `/api/restaurant-coverage-rules?id=${encodeURIComponent(rule.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar la regla");
      }

      if (editingRule?.id === rule.id) {
        closeModal();
      }

      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  const grouped = useMemo(() => {
    return {
      BREAKFAST: rules.filter((r) => r.serviceType === "BREAKFAST"),
      LUNCH: rules.filter((r) => r.serviceType === "LUNCH"),
      DINNER: rules.filter((r) => r.serviceType === "DINNER"),
    };
  }, [rules]);

  return (
    <div className="page-shell">
      <div className="page-header">
  <div>
    <p className="page-eyebrow">TURNOHOTEL</p>
    <h1 className="page-title">Ratios restaurante</h1>
    <p className="page-subtitle">
      Configuración de cobertura para cálculo automático de demanda.
    </p>
  </div>

  <div className="toolbar">
    <Link
      href="/planificacion/restaurante"
      className="toolbar-button ghost"
    >
      ← Volver a planificación
    </Link>
  </div>
</div>

      <div className="filters-card">
        <div className="filter-field">
          <label htmlFor="workplaceId">Centro</label>
          <select
            id="workplaceId"
            value={workplaceId}
            onChange={(e) => setWorkplaceId(e.target.value)}
            disabled={loadingCatalog}
          >
            <option value="">Selecciona un centro</option>
            {workplaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="state-card error">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="planner-card">
        <div className="section-header">
          <div>
            <h2 className="filters-title">Reglas configuradas</h2>
            <p className="filters-subtitle">
              Cobertura por servicio y vigencia.
            </p>
          </div>

          <button className="toolbar-button primary" onClick={openCreateModal}>
            Nueva regla
          </button>
        </div>

        {loadingRules ? (
          <div className="empty">Cargando...</div>
        ) : rules.length === 0 ? (
          <div className="empty">
            No hay ratios configurados para este centro.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="rules-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Ratio</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Activa</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(["BREAKFAST", "LUNCH", "DINNER"] as ServiceType[]).flatMap(
                  (service) =>
                    grouped[service].map((rule) => (
                      <tr key={rule.id}>
                        <td>{label(service)}</td>
                        <td>{rule.ratioCoversPerEmployee}</td>
                        <td>{format(rule.validFrom)}</td>
                        <td>
                          {rule.validTo ? format(rule.validTo) : "Sin fin"}
                        </td>
                        <td>{rule.isActive ? "Sí" : "No"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="toolbar-button ghost"
                              onClick={() => openEditModal(rule)}
                            >
                              Editar
                            </button>

                            <button
                              className="toolbar-button danger"
                              onClick={() => handleDeleteRule(rule)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">
              {editingRule ? "Editar regla" : "Nueva regla"}
            </h3>

            <div className="form-grid">
              <div className="filter-field">
                <label htmlFor="serviceType">Servicio</label>
                <select
                  id="serviceType"
                  value={form.serviceType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      serviceType: e.target.value as ServiceType,
                    })
                  }
                >
                  <option value="BREAKFAST">Desayuno</option>
                  <option value="LUNCH">Almuerzo</option>
                  <option value="DINNER">Cena</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="ratio">Ratio</label>
                <input
                  id="ratio"
                  type="number"
                  min={1}
                  value={form.ratio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ratio: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="filter-field">
                <label htmlFor="validFrom">Válida desde</label>
                <input
                  id="validFrom"
                  type="date"
                  value={form.validFrom}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      validFrom: e.target.value,
                    })
                  }
                />
              </div>

              <div className="filter-field">
                <label htmlFor="validTo">Válida hasta</label>
                <input
                  id="validTo"
                  type="date"
                  value={form.validTo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      validTo: e.target.value,
                    })
                  }
                />
              </div>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isActive: e.target.checked,
                    })
                  }
                />
                Activa
              </label>
            </div>

            <div className="modal-actions">
              <button className="toolbar-button ghost" onClick={closeModal}>
                Cancelar
              </button>

              <button className="toolbar-button primary" onClick={handleSaveRule}>
                {editingRule ? "Guardar cambios" : "Crear regla"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .page-shell {
          padding: 16px;
          background: #f6f8fc;
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          font-size: 12px;
          color: #64748b;
        }

        .filters-card,
        .planner-card,
        .state-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
          padding: 16px;
        }

        .planner-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
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

        .toolbar-button {
          border: none;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .toolbar-button:hover {
          transform: translateY(-1px);
        }

        .toolbar-button.primary {
          background: #b7791f;
          color: white;
        }

        .toolbar-button.ghost {
          background: #e2e8f0;
          color: #0f172a;
        }

        .toolbar-button.danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .state-card.error {
          background: #fff7f7;
          border-color: #fecaca;
          color: #991b1b;
        }

        .state-card p {
          margin: 0;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .rules-table {
          width: 100%;
          border-collapse: collapse;
        }

        .rules-table th {
          background: #f8fafc;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
          padding: 10px;
          text-align: left;
        }

        .rules-table td {
          padding: 12px 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 13px;
          line-height: 1.4;
          color: #0f172a;
          background: white;
          text-align: left;
          vertical-align: middle;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .toolbar {
          display: flex;
          gap: 8px;
        }

        .empty {
          padding: 16px 4px;
          color: #64748b;
          font-size: 13px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 16px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          padding: 20px;
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
        }

        .modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #334155;
        }

        .checkbox input {
          margin: 0;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

function label(service: ServiceType) {
  return service === "BREAKFAST"
    ? "Desayuno"
    : service === "LUNCH"
    ? "Almuerzo"
    : "Cena";
}

function format(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}