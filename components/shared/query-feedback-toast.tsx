"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function QueryFeedbackToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    // 👇 FORZAMOS lectura inmediata
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    // 👇 DEBUG
    console.log("TOAST CHECK:", { success, error });

    if (!success && !error) return;

    handledRef.current = true;

    // 👇 usamos setTimeout para evitar que Next limpie antes
    setTimeout(() => {
      if (success === "updated") {
        toast.success("Departamento actualizado correctamente");
      }

      if (success === "deleted") {
        toast.success("Departamento eliminado correctamente");
      }

      if (success === "created") {
        toast.success("Departamento creado correctamente");
      }

      if (error === "save_failed") {
        toast.error("No se pudo guardar el departamento");
      }

      if (error === "delete_failed") {
        toast.error("No se pudo eliminar el departamento");
      }

      if (error === "validation_failed") {
        toast.error("Revisa los datos del formulario");
      }
    }, 50);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("success");
    params.delete("error");

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  return null;
}