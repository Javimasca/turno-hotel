import { prisma } from "@/lib/prisma";

export const housekeepingAssignmentPreviewService = {
  async getWeek(input: {
    workplaceId: string;
    departmentId: string;
    weekStart: string;
  }) {
    const weekStart = parseDate(input.weekStart);
    const weekEnd = addDays(weekStart, 7);

    const needs = await prisma.housekeepingShiftNeed.findMany({
      where: {
        workplaceId: input.workplaceId,
        departmentId: input.departmentId,
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      include: {
        shiftMaster: true,
      },
      orderBy: [{ date: "asc" }, { shiftMaster: { name: "asc" } }],
    });

    if (needs.length === 0) {
      return [];
    }

    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        employeeDepartments: {
          some: {
            departmentId: input.departmentId,
          },
        },
        employeeWorkplaces: {
          some: {
            workplaceId: input.workplaceId,
          },
        },
      },
      include: {
        shifts: {
          where: {
            startAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
          select: {
            id: true,
            startAt: true,
          },
        },
        absences: {
          where: {
            status: "APPROVED",
            startDate: {
              lt: weekEnd,
            },
            endDate: {
              gte: weekStart,
            },
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            absenceType: {
              select: {
                name: true,
              },
            },
          },
        },
        employeeContracts: {
          include: {
            jobCategory: true,
          },
          orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return needs.map((need) => {
      const candidates = employees
        .map((employee) => {
          const activeContract = employee.employeeContracts.find((contract) =>
            isContractActiveOnDate(contract.startDate, contract.endDate, need.date)
          );

          if (!activeContract) {
            return {
              employeeId: employee.id,
              code: employee.code,
              firstName: employee.firstName,
              lastName: employee.lastName,
              contractStartDate: null,
              seniorityDate: null,
              dailyHours: null,
              weeklyHours: null,
              jobCategory: null,
              orderDate: null,
              excludedReason: "Sin contrato vigente",
            };
          }

          const fixedDayOffReason = getFixedDayOffReason({
            weeklyDaysOffMode: employee.weeklyDaysOffMode,
            fixedDayOff1: employee.fixedDayOff1,
            fixedDayOff2: employee.fixedDayOff2,
            date: need.date,
          });
          const absenceReason = getAbsenceReason(employee.absences, need.date);
          const existingShiftReason = employee.shifts.some(
            (shift) => toDateKey(shift.startAt) === toDateKey(need.date)
          )
            ? "Ya tiene turno"
            : null;

          return {
            employeeId: employee.id,
            code: employee.code,
            firstName: employee.firstName,
            lastName: employee.lastName,
            contractStartDate: activeContract.startDate,
            seniorityDate: activeContract.seniorityDate,
            dailyHours: activeContract.dailyHours,
            weeklyHours: activeContract.weeklyHours,
            jobCategory: activeContract.jobCategory?.name ?? null,
            orderDate: activeContract.seniorityDate ?? activeContract.startDate,
            excludedReason:
              fixedDayOffReason ?? absenceReason ?? existingShiftReason,
          };
        })
        .sort((a, b) => {
          if (!a.orderDate && !b.orderDate) return 0;
          if (!a.orderDate) return 1;
          if (!b.orderDate) return -1;
          const dateDiff = a.orderDate.getTime() - b.orderDate.getTime();
          if (dateDiff !== 0) return dateDiff;
          return `${a.lastName} ${a.firstName}`.localeCompare(
            `${b.lastName} ${b.firstName}`,
            "es"
          );
        });

      return {
        needId: need.id,
        date: need.date,
        shiftName: need.shiftMaster.name,
        requiredStaff: need.requiredStaff,
        assignedStaff: need.assignedStaff,
        status: need.status,
        candidates: candidates.map((candidate, index) => {
          const availableOrder = candidates
            .slice(0, index + 1)
            .filter((item) => !item.excludedReason).length;

          return {
          order: index + 1,
          employeeId: candidate.employeeId,
          code: candidate.code,
          name: `${candidate.firstName} ${candidate.lastName}`,
          jobCategory: candidate.jobCategory,
          seniorityDate: candidate.seniorityDate,
          contractStartDate: candidate.contractStartDate,
          dailyHours: candidate.dailyHours,
          weeklyHours: candidate.weeklyHours,
          selected:
            !candidate.excludedReason && availableOrder <= need.requiredStaff,
          excludedReason: candidate.excludedReason,
        };
        }),
      };
    });
  },
};

function isContractActiveOnDate(startDate: Date, endDate: Date | null, date: Date) {
  return startDate <= date && (!endDate || endDate >= date);
}

function getAbsenceReason(
  absences: Array<{
    startDate: Date;
    endDate: Date;
    absenceType: { name: string };
  }>,
  date: Date
) {
  const absence = absences.find(
    (item) => item.startDate <= date && item.endDate >= date
  );

  return absence ? `Ausencia: ${absence.absenceType.name}` : null;
}

function getFixedDayOffReason(input: {
  weeklyDaysOffMode: string;
  fixedDayOff1: string | null;
  fixedDayOff2: string | null;
  date: Date;
}) {
  if (input.weeklyDaysOffMode !== "FIXED") {
    return null;
  }

  const weekday = getWeekday(input.date);

  return weekday === input.fixedDayOff1 || weekday === input.fixedDayOff2
    ? "Libranza fija"
    : null;
}

function getWeekday(date: Date) {
  const day = date.getUTCDay();

  if (day === 1) return "MONDAY";
  if (day === 2) return "TUESDAY";
  if (day === 3) return "WEDNESDAY";
  if (day === 4) return "THURSDAY";
  if (day === 5) return "FRIDAY";
  if (day === 6) return "SATURDAY";
  return "SUNDAY";
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("La fecha no es valida.");
  }
  return date;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
