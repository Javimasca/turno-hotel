"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ContractRecord = Record<string, unknown>;

type FormValues = Record<string, string | number | boolean | null>;

const NON_EDITABLE_FIELDS = new Set([
  "id",
  "empleadoId",
  "employeeId",
  "createdAt",
  "updatedAt",
  "deletedAt",
]);

function isDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)
  );
}

function formatDateForInput(value: string): string {
  return value.slice(0, 10);
}

function prettifyLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildInitialFormValues(contract: ContractRecord): FormValues {
  const result: FormValues = {};

  for (const [key, value] of Object.entries(contract)) {
    if (NON_EDITABLE_FIELDS.has(key)) continue;
    if (value === undefined) continue;
    if (Array.isArray(value)) continue;
    if (value !== null && typeof value === "object") continue;

    if (isDateString(value)) {
      result[key] = formatDateForInput(value);
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      result[key] = value;
    }
  }

  return result;
}

function normalizeValueForSubmit(
  currentValue: string | number | boolean | null,
  originalValue: unknown,
): string | number | boolean | null {
  if (typeof originalValue === "boolean") {
    return Boolean(currentValue);
  }

  if (currentValue === "") {
    return null;
  }

  if (typeof originalValue === "number") {
    if (typeof currentValue === "number") return currentValue;
    const parsed = Number(currentValue);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (isDateString(originalValue)) {
    return typeof currentValue === "string" ? currentValue : null;
  }

  if (originalValue === null) {
    return currentValue;
  }

  return currentValue;
}

export default function EditarContratoPage() {
  const params = useParams<{ id: string; contractId: string }>();
  const router = useRouter();

  const empleadoId = params?.id;
  const contractId = params?.contractId;

  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadContract() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/maestros/empleados/${empleadoId}/contratos/${contractId}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error || data?.message || "No hemos podido cargar el contrato.",
          );
        }

        if (!active) return;

        setContract(data);
        setFormValues(buildInitialFormValues(data));
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Se ha producido un error al cargar el contrato.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (empleadoId && contractId) {
      void loadContract();
    }

    return () => {
      active = false;
    };
  }, [empleadoId, contractId]);

  const editableFields = useMemo(() => {
    return Object.entries(formValues);
  }, [formValues]);

  function handleChange(
    key: string,
    value: string | number | boolean | null,
  ) {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!contract) return;

    try {
      setSaving(true);
      setSubmitError(null);

      const payload: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(formValues)) {
        payload[key] = normalizeValueForSubmit(value, contract[key]);
      }

      const response = await fetch(
        `/api/maestros/empleados/${empleadoId}/contratos/${contractId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "No hemos podido guardar los cambios del contrato.",
        );
      }

      router.push(`/maestros/empleados/${empleadoId}/contratos`);
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Se ha producido un error al guardar los cambios.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!empleadoId || !contractId) return;

    const confirmed = window.confirm(
      "¿Seguro que queremos eliminar este contrato?",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setSubmitError(null);

      const response = await fetch(
        `/api/maestros/empleados/${empleadoId}/contratos/${contractId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "No hemos podido eliminar el contrato.",
        );
      }

      router.push(`/maestros/empleados/${empleadoId}/contratos`);
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Se ha producido un error al eliminar el contrato.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function renderField(key: string, value: string | number | boolean | null) {
    const originalValue = contract?.[key];
    const label = prettifyLabel(key);

    if (typeof originalValue === "boolean") {
      return (
        <label key={key} className="flex items-center gap-3 rounded-lg border p-4">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handleChange(key, event.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </label>
      );
    }

    if (typeof originalValue === "number") {
      const numberValue =
        typeof value === "number" || typeof value === "string"
          ? value
          : "";

      return (
        <div key={key} className="space-y-2">
          <label htmlFor={key} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
          <input
            id={key}
            name={key}
            type="number"
            value={numberValue}
            onChange={(event) => handleChange(key, event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-500"
          />
        </div>
      );
    }

    if (isDateString(originalValue)) {
      return (
        <div key={key} className="space-y-2">
          <label htmlFor={key} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
          <input
            id={key}
            name={key}
            type="date"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => handleChange(key, event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-500"
          />
        </div>
      );
    }

    const stringValue = typeof value === "string" ? value : "";

    const isTextarea =
      key.toLowerCase().includes("observ") ||
      key.toLowerCase().includes("coment") ||
      key.toLowerCase().includes("nota") ||
      stringValue.length > 120;

    if (isTextarea) {
      return (
        <div key={key} className="space-y-2 md:col-span-2">
          <label htmlFor={key} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
          <textarea
            id={key}
            name={key}
            value={stringValue}
            onChange={(event) => handleChange(key, event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-500"
          />
        </div>
      );
    }

    return (
      <div key={key} className="space-y-2">
        <label htmlFor={key} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <input
          id={key}
          name={key}
          type="text"
          value={stringValue}
          onChange={(event) => handleChange(key, event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-500"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Editar contrato
          </h1>
          <p className="text-sm text-slate-600">
            Estamos cargando la información del contrato.
          </p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Editar contrato
          </h1>
          <p className="text-sm text-slate-600">
            No hemos podido abrir la edición del contrato.
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Contrato no encontrado."}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/maestros/empleados/${empleadoId}/contratos`)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Editar contrato
        </h1>
        <p className="text-sm text-slate-600">
          Modificamos los datos del contrato y guardamos los cambios.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {editableFields.length > 0 ? (
            editableFields.map(([key, value]) => renderField(key, value))
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 md:col-span-2">
              No hay campos editables disponibles para este contrato.
            </div>
          )}
        </div>

        {submitError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/maestros/empleados/${empleadoId}/contratos`)}
            disabled={saving || deleting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving || deleting || editableFields.length === 0}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}