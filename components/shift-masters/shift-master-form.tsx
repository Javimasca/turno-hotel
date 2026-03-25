"use client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
};

export default function ShiftMasterForm({
  open,
  onOpenChange,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div
        onClick={() => onOpenChange(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 1000,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#fff",
          padding: 24,
          borderRadius: 16,
          zIndex: 1001,
          minWidth: 320,
        }}
      >
        <h2>ShiftMasterForm temporal</h2>
        <button onClick={() => onOpenChange(false)}>Cerrar</button>
      </div>
    </>
  );
}