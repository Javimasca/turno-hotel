"use client";

import { useEffect, useState } from "react";

type Absence = {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
  };
  absenceType: {
    name: string;
    color: string | null;
  };
  unit: "FULL_DAY" | "HOURLY";
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  notes: string | null;
};

export default function AbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadAbsences();
  }, []);

  async function loadAbsences() {
    try {
      setLoading(true);

      const res = await fetch("/api/absences", { cache: "no-store" });

      if (!res.ok) {
        throw new Error("Error cargando ausencias");
      }

      const data = await res.json();
      setAbsences(data);
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: string) {
    await fetch(`/api/absences/${id}/approve`, {
      method: "PATCH",
    });

    await loadAbsences();
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Ausencias</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {absences.map((a) => (
            <div
              key={a.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>
                  {a.employee.firstName} {a.employee.lastName}
                </strong>

                <div style={{ fontSize: 12 }}>
                  {a.absenceType.name}
                </div>

                <div style={{ fontSize: 12 }}>
                  {new Date(a.startDate).toLocaleDateString()} -{" "}
                  {new Date(a.endDate).toLocaleDateString()}
                </div>

                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {a.unit}
                </div>

                <div style={{ fontSize: 11 }}>
                  Estado: <strong>{a.status}</strong>
                </div>
              </div>

              {a.status === "PENDING" && (
                <button onClick={() => approve(a.id)}>
                  Aprobar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}