"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@prisma/client";

type CurrentUser = {
  userId: string;
  role: UserRole;
  employeeId: string | null;
  isActive: boolean;
  email: string;
  name: string | null;
};

type UseCurrentUserResult = {
  user: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
};

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (response.status === 401) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudo cargar el usuario actual.");
        }

        const data = (await response.json()) as CurrentUser;

        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Error al cargar el usuario actual."
          );
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, isLoading, error };
}