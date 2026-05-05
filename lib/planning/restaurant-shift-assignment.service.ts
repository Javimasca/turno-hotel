import { prisma } from "@/lib/prisma";
import { shiftService } from "@/lib/shifts/shift.service";
import { employeeAvailabilityBlockService } from "@/lib/employee-availability-blocks/employeeAvailabilityBlockService";

type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
type RestaurantServiceType = "BREAKFAST" | "LUNCH" | "DINNER";

type RequestContext = {
  userId: string;
  role: UserRole;
  employeeId: string | null;
  isActive: boolean;
};

type AssignRestaurantShiftsFromProposalInput = {
  workplaceId: string;
  departmentId: string;
  weekStart: string;
};

type PositionSlot = {
  id: string;
  name: string;
  assigned: number;
};

type ExistingShiftForCoverage = {
  employeeId: string;
  workAreaId: string | null;
  startAt: Date;
  endAt: Date;
  notes: string | null;
  shiftMaster: {
    type: string;
    coversBreakfast: boolean;
    coversLunch: boolean;
    coversDinner: boolean;
  } | null;
};

export const restaurantShiftAssignmentService = {
  async assignFromWeeklyProposal(
    input: AssignRestaurantShiftsFromProposalInput,
    ctx: RequestContext
  ) {
    const startDate = new Date(input.weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    const proposals = await prisma.restaurantShiftProposal.findMany({
      where: {
        workplaceId: input.workplaceId,
        departmentId: input.departmentId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: [{ date: "asc" }, { startAt: "asc" }],
    });

    await prisma.shift.deleteMany({
      where: {
        workplaceId: input.workplaceId,
        departmentId: input.departmentId,
        startAt: {
          gte: startDate,
          lt: endDate,
        },
        OR: [
          {
            notes: {
              contains: "asignación automática",
              mode: "insensitive",
            },
          },
          {
            notes: {
              contains: "asignacion automatica",
              mode: "insensitive",
            },
          },
        ],
      },
    });

    const grouped = new Map<
        string,
      {
        workplaceId: string;
        departmentId: string;
        workAreaId: string;
        serviceType: RestaurantServiceType;
        startAt: Date;
        endAt: Date;
        employeesNeeded: number;
      }
    >();

    for (const row of proposals) {
      if (!row.workAreaId || !row.startAt || !row.endAt) {
        continue;
      }

      const serviceType = row.service as RestaurantServiceType;

      const key = [
        row.workplaceId,
        row.departmentId,
        row.workAreaId,
        serviceType,
        row.startAt.toISOString(),
        row.endAt.toISOString(),
      ].join("|");

      const existing = grouped.get(key);

      if (existing) {
        existing.employeesNeeded += 1;
        continue;
      }

      grouped.set(key, {
        workplaceId: row.workplaceId,
        departmentId: row.departmentId,
        workAreaId: row.workAreaId,
        serviceType,
        startAt: row.startAt,
        endAt: row.endAt,
        employeesNeeded: 1,
      });
    }

    const existingShifts = await prisma.shift.findMany({
      where: {
        workplaceId: input.workplaceId,
        departmentId: input.departmentId,
        startAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        employeeId: true,
        workAreaId: true,
        startAt: true,
        endAt: true,
        notes: true,
        shiftMaster: {
          select: {
            type: true,
            coversBreakfast: true,
            coversLunch: true,
            coversDinner: true,
          },
        },
      },
    });

    const busyMap = new Map<string, Array<{ startAt: Date; endAt: Date }>>();
    const workloadMap = new Map<string, { count: number; minutes: number }>();

    for (const shift of existingShifts) {
      const list = busyMap.get(shift.employeeId) ?? [];
      list.push({ startAt: shift.startAt, endAt: shift.endAt });
      busyMap.set(shift.employeeId, list);

      const workload = workloadMap.get(shift.employeeId) ?? {
        count: 0,
        minutes: 0,
      };
      workload.count += 1;
      workload.minutes += minutesBetween(shift.startAt, shift.endAt);
      workloadMap.set(shift.employeeId, workload);
    }

    let created = 0;
    let skipped = 0;
    let unassigned = 0;
    let coveredByExisting = 0;
    const shiftMasters = await prisma.shiftMaster.findMany({
      where: {
        workplaceId: input.workplaceId,
        departmentId: input.departmentId,
        type: "RESTAURANTE",
        isActive: true,
      },
      orderBy: [{ startMinute: "asc" }, { name: "asc" }],
    });

    for (const proposal of grouped.values()) {
      const shiftMaster = findBestShiftMasterForService(
        shiftMasters,
        proposal.serviceType
      );

      if (!shiftMaster) {
        unassigned += proposal.employeesNeeded;
        continue;
      }

      const existingCoverage = countExistingCoverageForProposal(
        existingShifts,
        proposal
      );
      const remainingNeeded = Math.max(
        proposal.employeesNeeded - existingCoverage,
        0
      );
      coveredByExisting += Math.min(existingCoverage, proposal.employeesNeeded);

      if (remainingNeeded === 0) {
        continue;
      }

      const eligible = await prisma.employee.findMany({
        where: {
          isActive: true,
          employeeDepartments: {
            some: {
              departmentId: proposal.departmentId,
            },
          },
          employeeWorkAreas: {
            some: {
              workAreaId: proposal.workAreaId,
              isActive: true,
              validFrom: {
                lte: endOfDay(proposal.startAt),
              },
              OR: [
                { validTo: null },
                {
                  validTo: {
                    gte: startOfDay(proposal.endAt),
                  },
                },
              ],
            },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

     const availabilityBlocks =
  await employeeAvailabilityBlockService.getBlocksForEmployees({
    employeeIds: eligible.map((employee) => employee.id),
    startDate: startOfDay(proposal.startAt),
    endDate: endOfDay(proposal.startAt),
  });

      const positions = await prisma.workAreaPosition.findMany({
        where: {
          workAreaId: proposal.workAreaId,
          isActive: true,
        },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
        },
      });

      const positionSlots: PositionSlot[] = positions.map((position) => ({
        id: position.id,
        name: position.name,
        assigned: 0,
      }));

      let assignedForThisProposal = 0;
      const sortedEligible = [...eligible].sort((a, b) =>
        compareCandidateWorkload(a, b, workloadMap)
      );

      for (const candidate of sortedEligible) {
        if (assignedForThisProposal >= remainingNeeded) break;

        const employeeId = candidate.id;
        const busySlots = busyMap.get(employeeId) ?? [];

        const hasConflict = busySlots.some((slot) =>
          rangesOverlap(
            proposal.startAt,
            proposal.endAt,
            slot.startAt,
            slot.endAt
          )
        );

        if (hasConflict) {
          skipped += 1;
          continue;
        }

        const isAvailable =
  employeeAvailabilityBlockService.isEmployeeAvailableForShift({
    employeeId,
    shiftStart: proposal.startAt,
    shiftEnd: proposal.endAt,
    blocks: availabilityBlocks,
  });

if (!isAvailable) {
  skipped += 1;
  continue;
}

        const selectedPosition = pickNextPosition(positionSlots);

        const serviceLabel = formatServiceLabel(proposal.serviceType);
        const notes = selectedPosition
          ? `Asignación automática · Servicio: ${serviceLabel} · Posición: ${selectedPosition.name}`
          : `Asignación automática · Servicio: ${serviceLabel}`;

        try {
          await shiftService.create(
  {
    employeeId,
    workplaceId: proposal.workplaceId,
    departmentId: proposal.departmentId,
    workAreaId: proposal.workAreaId,
    shiftMasterId: shiftMaster.id,
    date: proposal.startAt,
    startAt: proposal.startAt,
    endAt: proposal.endAt,
    status: "BORRADOR",
    notes,
  },
  ctx
);
          if (selectedPosition) {
            selectedPosition.assigned += 1;
          }

          busySlots.push({
            startAt: proposal.startAt,
            endAt: proposal.endAt,
          });
          busyMap.set(employeeId, busySlots);

          const workload = workloadMap.get(employeeId) ?? {
            count: 0,
            minutes: 0,
          };
          workload.count += 1;
          workload.minutes += minutesBetween(proposal.startAt, proposal.endAt);
          workloadMap.set(employeeId, workload);

          assignedForThisProposal += 1;
          created += 1;
        } catch (error) {
          console.error("[restaurant assignment] Error creating shift", error);
          skipped += 1;
        }
      }

      if (assignedForThisProposal < remainingNeeded) {
        unassigned += remainingNeeded - assignedForThisProposal;
      }
    }

    return {
      created,
      coveredByExisting,
      skipped,
      unassigned,
    };
  },
};

function countExistingCoverageForProposal(
  existingShifts: ExistingShiftForCoverage[],
  proposal: {
    workAreaId: string;
    serviceType: RestaurantServiceType;
    startAt: Date;
  }
) {
  return existingShifts.filter((shift) => {
    if (shift.workAreaId !== proposal.workAreaId) return false;
    if (shift.shiftMaster?.type !== "RESTAURANTE") return false;
    if (!isSameLocalDay(shift.startAt, proposal.startAt)) return false;

    return shiftCountsForService(shift, proposal.serviceType);
  }).length;
}

function findBestShiftMasterForService(
  shiftMasters: Array<{
    id: string;
    coversBreakfast: boolean;
    coversLunch: boolean;
    coversDinner: boolean;
  }>,
  serviceType: RestaurantServiceType
) {
  const candidates = shiftMasters.filter((item) =>
    shiftMasterCoversService(item, serviceType)
  );

  const exclusive = candidates.find((item) =>
    shiftMasterCoversOnlyService(item, serviceType)
  );

  return exclusive ?? candidates[0] ?? null;
}

function shiftMasterCoversOnlyService(
  shiftMaster: {
    coversBreakfast: boolean;
    coversLunch: boolean;
    coversDinner: boolean;
  },
  serviceType: RestaurantServiceType
) {
  if (serviceType === "BREAKFAST") {
    return (
      shiftMaster.coversBreakfast &&
      !shiftMaster.coversLunch &&
      !shiftMaster.coversDinner
    );
  }

  if (serviceType === "LUNCH") {
    return (
      shiftMaster.coversLunch &&
      !shiftMaster.coversBreakfast &&
      !shiftMaster.coversDinner
    );
  }

  return (
    shiftMaster.coversDinner &&
    !shiftMaster.coversBreakfast &&
    !shiftMaster.coversLunch
  );
}

function shiftMasterCoversService(
  shiftMaster: {
    coversBreakfast: boolean;
    coversLunch: boolean;
    coversDinner: boolean;
  },
  serviceType: RestaurantServiceType
) {
  if (serviceType === "BREAKFAST") return shiftMaster.coversBreakfast;
  if (serviceType === "LUNCH") return shiftMaster.coversLunch;
  return shiftMaster.coversDinner;
}

function getServiceFromAutoAssignmentNote(
  notes: string | null
): RestaurantServiceType | null {
  if (!notes) return null;
  const normalized = notes.toLocaleLowerCase("es");
  if (normalized.includes("servicio: desayuno")) return "BREAKFAST";
  if (normalized.includes("servicio: almuerzo")) return "LUNCH";
  if (normalized.includes("servicio: cena")) return "DINNER";

  if (
    !normalized.includes("asignación automática") &&
    !normalized.includes("asignacion automatica")
  ) {
    return null;
  }

  if (normalized.includes("servicio: desayuno")) return "BREAKFAST";
  if (normalized.includes("servicio: almuerzo")) return "LUNCH";
  if (normalized.includes("servicio: cena")) return "DINNER";

  return null;
}

function shiftCountsForService(
  shift: ExistingShiftForCoverage,
  serviceType: RestaurantServiceType
) {
  const explicitService = getServiceFromAutoAssignmentNote(shift.notes);
  if (explicitService) {
    return explicitService === serviceType;
  }

  if (!shift.shiftMaster) {
    return false;
  }

  return shiftMasterCoversService(shift.shiftMaster, serviceType);
}

function formatServiceLabel(serviceType: RestaurantServiceType) {
  if (serviceType === "BREAKFAST") return "Desayuno";
  if (serviceType === "LUNCH") return "Almuerzo";
  return "Cena";
}

function compareCandidateWorkload(
  a: { id: string; lastName: string; firstName: string },
  b: { id: string; lastName: string; firstName: string },
  workloadMap: Map<string, { count: number; minutes: number }>
) {
  const aWorkload = workloadMap.get(a.id) ?? { count: 0, minutes: 0 };
  const bWorkload = workloadMap.get(b.id) ?? { count: 0, minutes: 0 };

  if (aWorkload.count !== bWorkload.count) {
    return aWorkload.count - bWorkload.count;
  }

  if (aWorkload.minutes !== bWorkload.minutes) {
    return aWorkload.minutes - bWorkload.minutes;
  }

  const lastNameCompare = a.lastName.localeCompare(b.lastName, "es");
  if (lastNameCompare !== 0) return lastNameCompare;

  return a.firstName.localeCompare(b.firstName, "es");
}

function pickNextPosition(positions: PositionSlot[]): PositionSlot | null {
  if (!positions.length) {
    return null;
  }

  positions.sort((a, b) => a.assigned - b.assigned);
  return positions[0];
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
) {
  return aStart < bEnd && bStart < aEnd;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function minutesBetween(startAt: Date, endAt: Date) {
  return Math.max(
    0,
    Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60))
  );
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
