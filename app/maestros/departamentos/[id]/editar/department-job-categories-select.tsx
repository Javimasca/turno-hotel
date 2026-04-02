"use client";

import { useMemo, useState } from "react";

type JobCategoryOption = {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  textColor: string | null;
};

type DepartmentJobCategoriesSelectProps = {
  jobCategories: JobCategoryOption[];
  initialSelectedIds: string[];
};

export default function DepartmentJobCategoriesSelect({
  jobCategories,
  initialSelectedIds,
}: DepartmentJobCategoriesSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return jobCategories;
    }

    return jobCategories.filter((category) => {
      const haystack = [
        category.name,
        category.shortName ?? "",
        category.code,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [jobCategories, query]);

  const selectedCategories = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return jobCategories.filter((category) => selectedSet.has(category.id));
  }, [jobCategories, selectedIds]);

  function toggleCategory(categoryId: string) {
    setSelectedIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }

      return [...current, categoryId];
    });
  }

  function removeCategory(categoryId: string) {
    setSelectedIds((current) => current.filter((id) => id !== categoryId));
  }

  return (
    <div className="form-field form-field-full">
      <label htmlFor="department-job-categories-toggle">
        Categorías profesionales
      </label>

      {/* Fuente de verdad para el submit del formulario */}
      <select
        name="jobCategoryIds"
        multiple
        value={selectedIds}
        onChange={() => {}}
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "absolute",
          left: "-99999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        {jobCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: "0.5rem" }}>
        <button
          id="department-job-categories-toggle"
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          style={{
            width: "100%",
            minHeight: "44px",
            border: "1px solid #d6c7a8",
            borderRadius: "0.75rem",
            backgroundColor: "#ffffff",
            padding: "0.75rem 1rem",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <span
            style={{
              color: selectedIds.length > 0 ? "#111827" : "#6b7280",
              fontSize: "0.95rem",
            }}
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} categoría${
                  selectedIds.length === 1 ? "" : "s"
                } seleccionada${selectedIds.length === 1 ? "" : "s"}`
              : "Seleccionar categorías"}
          </span>

          <span
            aria-hidden="true"
            style={{
              fontSize: "0.85rem",
              color: "#6b7280",
              flexShrink: 0,
            }}
          >
            {isOpen ? "▲" : "▼"}
          </span>
        </button>
      </div>

      {selectedCategories.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "0.75rem",
          }}
        >
          {selectedCategories.map((category) => (
            <span
              key={category.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.35rem 0.65rem",
                border: "1px solid #e5e7eb",
                borderRadius: "999px",
                backgroundColor: "#fffaf0",
                fontSize: "0.85rem",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "999px",
                  backgroundColor: category.textColor || "#9ca3af",
                  flexShrink: 0,
                }}
              />
              <span>{category.name}</span>
              <button
                type="button"
                onClick={() => removeCategory(category.id)}
                aria-label={`Quitar ${category.name}`}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                  color: "#6b7280",
                  fontSize: "0.9rem",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p
          style={{
            marginTop: "0.75rem",
            fontSize: "0.9rem",
            color: "#6b7280",
          }}
        >
          No hay categorías seleccionadas.
        </p>
      )}

      {isOpen ? (
        <div
          style={{
            marginTop: "0.75rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.85rem",
            backgroundColor: "#ffffff",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.85rem 1rem",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar categoría por nombre, código o abreviatura"
              style={{
                width: "100%",
                minHeight: "42px",
                border: "1px solid #d6c7a8",
                borderRadius: "0.65rem",
                padding: "0.65rem 0.8rem",
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              maxHeight: "280px",
              overflowY: "auto",
            }}
          >
            {filteredCategories.length === 0 ? (
              <div
                style={{
                  padding: "1rem",
                  color: "#6b7280",
                  fontSize: "0.9rem",
                }}
              >
                No hay categorías que coincidan con la búsqueda.
              </div>
            ) : (
              filteredCategories.map((category, index) => {
                const checked = selectedIds.includes(category.id);

                return (
                  <label
                    key={category.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.8rem 1rem",
                      cursor: "pointer",
                      backgroundColor: checked ? "#fffaf0" : "#ffffff",
                      borderBottom:
                        index < filteredCategories.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(category.id)}
                      style={{
                        width: "16px",
                        minWidth: "16px",
                        maxWidth: "16px",
                        height: "16px",
                        margin: 0,
                        flex: "0 0 16px",
                        display: "block",
                      }}
                    />

                    <span
                      aria-hidden="true"
                      style={{
                        width: "8px",
                        height: "8px",
                        minWidth: "8px",
                        borderRadius: "999px",
                        backgroundColor: category.textColor || "#9ca3af",
                        flex: "0 0 8px",
                      }}
                    />

                    <span
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.1rem",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#111827",
                          lineHeight: 1.2,
                        }}
                      >
                        {category.name}
                      </span>

                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          lineHeight: 1.2,
                        }}
                      >
                        {category.shortName || category.code}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}