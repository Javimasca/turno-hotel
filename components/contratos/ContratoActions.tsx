"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  employeeId: string;
  contractId: string;
};

export default function ContratoActions({
  employeeId,
  contractId,
}: Props) {
  const router = useRouter();

  async function handleDelete() {
    const ok = window.confirm("¿Eliminar contrato?");
    if (!ok) return;

    const res = await fetch(
      `/api/maestros/empleados/${employeeId}/contratos/${contractId}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      alert("No se pudo eliminar el contrato");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/maestros/empleados/${employeeId}/contratos/${contractId}/editar`}
        className="text-blue-600 underline"
      >
        Editar
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        className="text-red-600 underline"
      >
        Eliminar
      </button>
    </div>
  );
}