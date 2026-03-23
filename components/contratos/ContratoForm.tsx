"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  employeeId: string;
  mode: "create" | "edit";
  initialData?: any;
};

export default function ContratoForm({
  employeeId,
  mode,
  initialData,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    jobCategoryId: initialData?.jobCategoryId || "",
    contractType: initialData?.contractType || "INDEFINIDO",
    startDate: initialData?.startDate?.slice(0, 10) || "",
    endDate: initialData?.endDate?.slice(0, 10) || "",
    seniorityDate: initialData?.seniorityDate?.slice(0, 10) || "",
    weeklyHours: initialData?.weeklyHours ?? "",
    dailyHours: initialData?.dailyHours ?? "",
    employmentRate: initialData?.employmentRate ?? "",
    notes: initialData?.notes || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url =
        mode === "create"
          ? `/api/maestros/empleados/${employeeId}/contratos`
          : `/api/maestros/empleados/${employeeId}/contratos/${initialData.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          weeklyHours:
            form.weeklyHours === "" ? null : Number(form.weeklyHours),
          dailyHours: form.dailyHours === "" ? null : Number(form.dailyHours),
          employmentRate:
            form.employmentRate === "" ? null : Number(form.employmentRate),
          endDate: form.endDate || null,
          seniorityDate: form.seniorityDate || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        alert("Error guardando contrato");
        return;
      }

      router.push(`/maestros/empleados/${employeeId}/contratos`);
      router.refresh();
    } catch {
      alert("Error guardando contrato");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-layout">
      <div className="form-grid">
        <div className="form-field">
          <label>Categoría profesional</label>
          <input
            name="jobCategoryId"
            value={form.jobCategoryId}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="form-field">
          <label>Tipo de contrato</label>
          <select
            name="contractType"
            value={form.contractType}
            onChange={handleChange}
            className="select"
          >
            <option value="INDEFINIDO">Indefinido</option>
            <option value="TEMPORAL">Temporal</option>
          </select>
        </div>

        <div className="form-field">
          <label>Fecha de inicio</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="form-field">
          <label>Fecha de fin</label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="form-field">
          <label>Fecha de antigüedad</label>
          <input
            type="date"
            name="seniorityDate"
            value={form.seniorityDate}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="form-field">
          <label>Horas semanales</label>
          <input
            type="number"
            name="weeklyHours"
            value={form.weeklyHours}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="form-field">
          <label>Horas diarias</label>
          <input
            type="number"
            name="dailyHours"
            value={form.dailyHours}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="form-field">
          <label>% Jornada</label>
          <input
            type="number"
            name="employmentRate"
            value={form.employmentRate}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="form-field form-field-full">
          <label>Notas</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="textarea"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="button button-primary"
          >
            {isSubmitting
              ? "Guardando..."
              : mode === "create"
              ? "Crear contrato"
              : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  );
}