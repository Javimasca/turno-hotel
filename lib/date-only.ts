export type DateOnly = `${number}-${number}-${number}`;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getDateOnlyParts(value: string) {
  const [yearText, monthText, dayText] = value.split("-");

  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  };
}

export function isDateOnly(value: unknown): value is DateOnly {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (!DATE_ONLY_PATTERN.test(trimmed)) return false;

  const { year, month, day } = getDateOnlyParts(trimmed);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseDateOnly(value: unknown, fieldName = "fecha"): DateOnly {
  if (typeof value !== "string" || !isDateOnly(value)) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD.`);
  }

  return value.trim() as DateOnly;
}

export function formatDateOnly(value: Date | string): DateOnly {
  if (typeof value === "string" && isDateOnly(value)) {
    return value.trim() as DateOnly;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha invalida.");
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}` as DateOnly;
}

export function formatLocalDateOnly(value: Date): DateOnly {
  if (Number.isNaN(value.getTime())) {
    throw new Error("Fecha invalida.");
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}` as DateOnly;
}

export function dateOnlyToUtcNoonDate(value: DateOnly): Date {
  const { year, month, day } = getDateOnlyParts(value);

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function dateOnlyToLocalStartOfDay(value: DateOnly): Date {
  const { year, month, day } = getDateOnlyParts(value);

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function dateOnlyToLocalEndOfDay(value: DateOnly): Date {
  const { year, month, day } = getDateOnlyParts(value);

  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function isDateOnlyInRange(
  value: DateOnly,
  startDate: DateOnly,
  endDate: DateOnly
) {
  return value >= startDate && value <= endDate;
}
