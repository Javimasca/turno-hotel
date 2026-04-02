"use client";

type DeleteDepartmentFormProps = {
  action: string;
};

export default function DeleteDepartmentForm({
  action,
}: DeleteDepartmentFormProps) {
  return (
    <form
      action={action}
      method="post"
      className="danger-zone"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "¿Seguro que quieres eliminar este departamento? Esta acción no se puede deshacer."
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="_method" value="DELETE" />

      <button type="submit" className="button button-danger">
        Eliminar departamento
      </button>
    </form>
  );
}