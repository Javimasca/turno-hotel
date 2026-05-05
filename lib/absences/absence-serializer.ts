import { formatDateOnly } from "@/lib/date-only";

type AbsenceWithDates = {
  startDate: Date | string;
  endDate: Date | string;
};

export function serializeAbsence<T extends AbsenceWithDates>(absence: T) {
  return {
    ...absence,
    startDate: formatDateOnly(absence.startDate),
    endDate: formatDateOnly(absence.endDate),
  };
}

export function serializeAbsences<T extends AbsenceWithDates>(absences: T[]) {
  return absences.map(serializeAbsence);
}
