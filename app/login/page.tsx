"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextUrl = searchParams.get("next") || "/turnos";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      if (!email.trim()) {
        throw new Error("Debes indicar el email.");
      }

      if (!password) {
        throw new Error("Debes indicar la contraseña.");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; ok?: boolean }
        | null;

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo iniciar sesión.");
      }

      router.replace(nextUrl);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error inesperado."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="login-shell">
        <div className="login-card">
          <div className="login-header">
            <p className="login-eyebrow">TURNOHOTEL</p>
            <h1 className="login-title">Iniciar sesión</h1>
            <p className="login-subtitle">
              Accede con tu usuario real para gestionar turnos y ausencias.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Introduce tu contraseña"
                disabled={isSubmitting}
              />
            </div>

            {error ? (
              <div className="error-box">
                <p>{error}</p>
              </div>
            ) : null}

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Accediendo..." : "Entrar"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Si todavía estás usando usuarios iniciales, recuerda cambiar la
              contraseña temporal más adelante.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at top, rgba(183, 121, 31, 0.12), transparent 28%),
            linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
        }

        .login-card {
          width: 100%;
          max-width: 460px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.14);
          padding: 28px;
        }

        .login-header {
          margin-bottom: 22px;
        }

        .login-eyebrow {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b7791f;
        }

        .login-title {
          margin: 0;
          font-size: 32px;
          line-height: 1.05;
          font-weight: 900;
          color: #0f172a;
        }

        .login-subtitle {
          margin: 10px 0 0 0;
          font-size: 14px;
          line-height: 1.5;
          color: #64748b;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }

        .field input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 14px;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .field input:focus {
          border-color: #b7791f;
          box-shadow: 0 0 0 3px rgba(183, 121, 31, 0.12);
        }

        .field input:disabled {
          background: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
        }

        .error-box {
          border: 1px solid #fecaca;
          background: #fff7f7;
          color: #991b1b;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 13px;
        }

        .submit-button {
          margin-top: 4px;
          border: none;
          border-radius: 14px;
          padding: 13px 16px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          background: #b7791f;
          color: #ffffff;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        .submit-button:hover {
          transform: translateY(-1px);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .login-footer {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .login-footer p {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: #64748b;
        }

        @media (max-width: 640px) {
          .login-shell {
            padding: 16px;
          }

          .login-card {
            padding: 22px 18px;
            border-radius: 20px;
          }

          .login-title {
            font-size: 28px;
          }
        }
      `}</style>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}