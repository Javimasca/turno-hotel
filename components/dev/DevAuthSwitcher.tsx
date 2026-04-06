"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";

type Preset = {
  label: string;
  userId: string;
  role: UserRole;
  employeeId: string | null;
  isActive: boolean;
};

const presets: Preset[] = [
  {
    label: "Admin",
    userId: "dev-admin",
    role: "ADMIN",
    employeeId: null,
    isActive: true,
  },
  {
    label: "Manager",
    userId: "dev-manager",
    role: "MANAGER",
    employeeId: null,
    isActive: true,
  },
  {
    label: "Employee activo",
    userId: "dev-employee",
    role: "EMPLOYEE",
    employeeId: "EMPLOYEE_ID_AQUI",
    isActive: true,
  },
  {
    label: "Employee inactivo",
    userId: "dev-employee-inactive",
    role: "EMPLOYEE",
    employeeId: "EMPLOYEE_ID_AQUI",
    isActive: false,
  },
];

export function DevAuthSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(presets[0].label);

  async function applyPreset(label: string) {
    const preset = presets.find((item) => item.label === label);
    if (!preset) return;

    const response = await fetch("/api/dev-auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preset),
    });

    if (!response.ok) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function resetPreset() {
    const response = await fetch("/api/dev-auth", {
      method: "DELETE",
    });

    if (!response.ok) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="dev-auth-card">
      <div className="dev-auth-header">
        <div>
          <p className="dev-auth-eyebrow">DESARROLLO</p>
          <h3 className="dev-auth-title">Usuario simulado</h3>
          <p className="dev-auth-subtitle">
            Cambia el rol actual para probar permisos en cuadrante y ausencias.
          </p>
        </div>
      </div>

      <div className="dev-auth-controls">
        <select
          className="dev-auth-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={isPending}
        >
          {presets.map((preset) => (
            <option key={preset.label} value={preset.label}>
              {preset.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="dev-auth-button primary"
          onClick={() => applyPreset(selected)}
          disabled={isPending}
        >
          Aplicar
        </button>

        <button
          type="button"
          className="dev-auth-button secondary"
          onClick={resetPreset}
          disabled={isPending}
        >
          Reset
        </button>
      </div>

      <p className="dev-auth-help">
        Sustituye <strong>EMPLOYEE_ID_AQUI</strong> por un <code>employeeId</code>{" "}
        real de tu base de datos para probar el rol EMPLOYEE correctamente.
      </p>

      <style jsx>{`
        .dev-auth-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dev-auth-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .dev-auth-eyebrow {
          margin: 0 0 4px 0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b7791f;
        }

        .dev-auth-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .dev-auth-subtitle {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .dev-auth-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .dev-auth-select {
          min-width: 220px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          color: #0f172a;
          background: white;
          outline: none;
        }

        .dev-auth-select:focus {
          border-color: #b7791f;
          box-shadow: 0 0 0 3px rgba(183, 121, 31, 0.12);
        }

        .dev-auth-button {
          border: none;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .dev-auth-button:hover {
          transform: translateY(-1px);
        }

        .dev-auth-button.primary {
          background: #b7791f;
          color: white;
        }

        .dev-auth-button.secondary {
          background: #e2e8f0;
          color: #0f172a;
        }

        .dev-auth-button:disabled,
        .dev-auth-select:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .dev-auth-help {
          margin: 0;
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
        }

        .dev-auth-help code {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 1px 6px;
          font-size: 11px;
        }

        @media (max-width: 640px) {
          .dev-auth-controls {
            flex-direction: column;
          }

          .dev-auth-select {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}