"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function HeaderAuthActions() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoginPage = pathname === "/login";

  async function handleLogout() {
    try {
      setIsSubmitting(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      router.replace("/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoginPage) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="header-auth">
        <span className="header-auth-status">Cargando...</span>

        <style jsx>{`
          .header-auth {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .header-auth-status {
            font-size: 12px;
            color: #64748b;
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="header-auth">
        <Link href="/login" className="header-auth-link">
          Iniciar sesión
        </Link>

        <style jsx>{`
          .header-auth {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .header-auth-link {
            border-radius: 10px;
            padding: 8px 10px;
            font-size: 12px;
            font-weight: 700;
            text-decoration: none;
            background: #0f172a;
            color: #ffffff;
          }
        `}</style>
      </div>
    );
  }

  const displayName = user.name?.trim() || user.email;

  return (
    <div className="header-auth">
      <div className="header-auth-user">
        <span className="header-auth-name">{displayName}</span>
        <span className="header-auth-meta">
          {user.role} · {user.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      <button
        type="button"
        className="header-auth-button"
        onClick={handleLogout}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saliendo..." : "Cerrar sesión"}
      </button>

      <style jsx>{`
        .header-auth {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .header-auth-user {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 0;
        }

        .header-auth-name {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          max-width: 220px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-auth-meta {
          font-size: 11px;
          color: #64748b;
        }

        .header-auth-button {
          border: none;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          background: #e2e8f0;
          color: #0f172a;
        }

        .header-auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .header-auth-link {
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          background: #0f172a;
          color: #ffffff;
        }

        @media (max-width: 900px) {
          .header-auth {
            width: 100%;
            justify-content: flex-start;
          }

          .header-auth-user {
            align-items: flex-start;
          }

          .header-auth-name {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}