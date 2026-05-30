"use client";

import { useEffect, useState } from "react";

type Workplace = { id: string; name: string };
type RoomType = {
  id: string;
  workplaceId: string;
  code: string;
  name: string;
  stayoverCleaningMinutes: number;
  departureCleaningMinutes: number;
  displayOrder: number;
  isActive: boolean;
  workplace?: Workplace;
};

const emptyForm = {
  workplaceId: "",
  code: "",
  name: "",
  stayoverCleaningMinutes: 20,
  departureCleaningMinutes: 35,
  displayOrder: 0,
  isActive: true,
};

export default function RoomTypesPage() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [workplacesRes, roomsRes] = await Promise.all([
        fetch("/api/workplaces", { cache: "no-store" }),
        fetch("/api/room-types", { cache: "no-store" }),
      ]);
      const workplacesData = await workplacesRes.json();
      const roomsData = await roomsRes.json();
      if (!workplacesRes.ok) throw new Error(workplacesData.error);
      if (!roomsRes.ok) throw new Error(roomsData.error);
      setWorkplaces(Array.isArray(workplacesData) ? workplacesData : []);
      setRoomTypes(Array.isArray(roomsData) ? roomsData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setError(null);
      const response = await fetch(
        editingId ? `/api/room-types/${editingId}` : "/api/room-types",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar.");
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Eliminar este tipo de habitacion?")) return;
    const response = await fetch(`/api/room-types/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "No se pudo eliminar.");
      return;
    }
    await loadData();
  }

  function edit(item: RoomType) {
    setEditingId(item.id);
    setForm({
      workplaceId: item.workplaceId,
      code: item.code,
      name: item.name,
      stayoverCleaningMinutes: item.stayoverCleaningMinutes,
      departureCleaningMinutes: item.departureCleaningMinutes,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    });
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Maestros</p>
          <h1>Habitaciones</h1>
          <p className="page-description">
            Tiempos de limpieza por tipo de habitacion para previsiones de Pisos.
          </p>
        </div>
      </section>

      {error ? <div className="state-card error">{error}</div> : null}

      <section className="layout-grid">
        <form className="panel" onSubmit={handleSubmit}>
          <h2>{editingId ? "Editar tipo" : "Nuevo tipo"}</h2>
          <label>Centro</label>
          <select
            value={form.workplaceId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, workplaceId: event.target.value }))
            }
          >
            <option value="">Selecciona centro</option>
            {workplaces.map((workplace) => (
              <option key={workplace.id} value={workplace.id}>
                {workplace.name}
              </option>
            ))}
          </select>
          <label>Codigo</label>
          <input
            value={form.code}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, code: event.target.value }))
            }
          />
          <label>Nombre</label>
          <input
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <div className="two">
            <div>
              <label>Min. cliente</label>
              <input
                type="number"
                min={0}
                value={form.stayoverCleaningMinutes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    stayoverCleaningMinutes: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label>Min. salida</label>
              <input
                type="number"
                min={0}
                value={form.departureCleaningMinutes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    departureCleaningMinutes: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>
          <label>Orden</label>
          <input
            type="number"
            value={form.displayOrder}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                displayOrder: Number(event.target.value),
              }))
            }
          />
          <label className="check">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            Activo
          </label>
          <div className="actions">
            {editingId ? (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </button>
            ) : null}
            <button type="submit">Guardar</button>
          </div>
        </form>

        <section className="panel">
          <h2>Tipos creados</h2>
          {loading ? <p>Cargando...</p> : null}
          <div className="list">
            {roomTypes.map((item) => (
              <article key={item.id} className="row">
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.workplace?.name} - {item.code} - Cliente{" "}
                    {item.stayoverCleaningMinutes} min - Salida{" "}
                    {item.departureCleaningMinutes} min
                  </p>
                </div>
                <div className="row-actions">
                  <span>{item.isActive ? "Activo" : "Inactivo"}</span>
                  <button type="button" onClick={() => edit(item)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    Borrar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <style jsx>{`
        .page-shell { padding: 16px; background: #f6f8fc; min-height: 100%; }
        .eyebrow { margin: 0 0 4px; font-size: 11px; font-weight: 800; color: #b7791f; text-transform: uppercase; }
        h1 { margin: 0; font-size: 26px; color: #0f172a; }
        h2 { margin: 0 0 14px; font-size: 18px; color: #0f172a; }
        .page-description { margin: 6px 0 0; color: #64748b; font-size: 13px; }
        .layout-grid { margin-top: 16px; display: grid; grid-template-columns: 360px 1fr; gap: 16px; align-items: start; }
        .panel, .state-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
        .state-card.error { margin-top: 16px; border-color: #fecaca; background: #fff7f7; color: #991b1b; }
        label { display: block; margin: 10px 0 6px; font-size: 12px; font-weight: 800; color: #334155; }
        input, select { width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 9px 10px; font-size: 13px; }
        .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .check { display: flex; align-items: center; gap: 8px; }
        .check input { width: auto; }
        .actions, .row-actions { display: flex; gap: 8px; justify-content: flex-end; align-items: center; }
        .actions { margin-top: 14px; }
        button { border: 0; border-radius: 10px; padding: 9px 12px; background: #b7791f; color: white; font-weight: 800; cursor: pointer; }
        button.secondary { background: #f1f5f9; color: #334155; }
        button.danger { background: #fee2e2; color: #991b1b; }
        .list { display: grid; gap: 10px; }
        .row { display: flex; justify-content: space-between; gap: 12px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
        .row p { margin: 5px 0 0; color: #64748b; font-size: 12px; }
        .row-actions span { font-size: 12px; color: #64748b; }
        @media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
