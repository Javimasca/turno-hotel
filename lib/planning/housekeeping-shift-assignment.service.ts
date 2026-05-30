import { prisma } from "@/lib/prisma";
import { housekeepingAssignmentPreviewService } from "@/lib/planning/housekeeping-assignment-preview.service";

type AssignmentResult = {
  created: number;
  skipped: number;
  uncovered: number;
  needsUpdated: number;
};

export const housekeepingShiftAssignmentService = {
  async assignWeek(input: {
    workplaceId: string;
    departmentId: string;
    weekStart: string;
  }): Promise<AssignmentResult> {
    const preview = await housekeepingAssignmentPreviewService.getWeek(input);
    const needs = await prisma.housekeepingShiftNeed.findMany({
      where: {
        id: {
          in: preview.map((line) => line.needId),
        },
        status: {
          not: "ASSIGNED",
        },
      },
      include: {
        shiftMaster: true,
      },
    });
    const needsById = new Map(needs.map((need) => [need.id, need]));

    let created = 0;
    let skipped = 0;
    let uncovered = 0;
    let needsUpdated = 0;

    for (const line of preview) {
      const need = needsById.get(line.needId);
      if (!need) {
        skipped += line.requiredStaff;
        continue;
      }

      const selectedCandidates = line.candidates.filter(
        (candidate) => candidate.selected && !candidate.excludedReason
      );
      let assignedForNeed = 0;

      for (const candidate of selectedCandidates) {
        const startAt = buildDateTime(need.date, need.shiftMaster.startMinute);
        const endAt = buildShiftEndDateTime(
          need.date,
          need.shiftMaster.endMinute,
          need.shiftMaster.crossesMidnight
        );

        const existingShift = await prisma.shift.findFirst({
          where: {
            employeeId: candidate.employeeId,
            startAt: {
              lt: endAt,
            },
            endAt: {
              gt: startAt,
            },
          },
          select: {
            id: true,
          },
        });

        if (existingShift) {
          skipped += 1;
          continue;
        }

        const activeContract = await prisma.employeeContract.findFirst({
          where: {
            employeeId: candidate.employeeId,
            startDate: {
              lte: need.date,
            },
            OR: [{ endDate: null }, { endDate: { gte: need.date } }],
          },
          orderBy: {
            startDate: "desc",
          },
          select: {
            jobCategoryId: true,
          },
        });

        await prisma.shift.create({
          data: {
            employeeId: candidate.employeeId,
            workplaceId: need.workplaceId,
            departmentId: need.departmentId,
            workAreaId: need.shiftMaster.workAreaId ?? null,
            jobCategoryId: activeContract?.jobCategoryId ?? null,
            shiftMasterId: need.shiftMasterId,
            startAt,
            endAt,
            status: "BORRADOR",
            notes: [
              "Asignacion automatica Pisos",
              `Necesidad: ${need.id}`,
              `Orden llamamiento: ${candidate.order}`,
            ].join("\n"),
          },
        });

        created += 1;
        assignedForNeed += 1;
      }

      const nextAssignedStaff = need.assignedStaff + assignedForNeed;
      const nextStatus =
        nextAssignedStaff >= need.requiredStaff ? "ASSIGNED" : "READY";

      await prisma.housekeepingShiftNeed.update({
        where: {
          id: need.id,
        },
        data: {
          assignedStaff: nextAssignedStaff,
          status: nextStatus,
        },
      });

      needsUpdated += 1;
      uncovered += Math.max(need.requiredStaff - nextAssignedStaff, 0);
    }

    return {
      created,
      skipped,
      uncovered,
      needsUpdated,
    };
  },
};

function buildDateTime(baseDate: Date, minutes: number) {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);
  date.setMinutes(minutes);
  return date;
}

function buildShiftEndDateTime(
  baseDate: Date,
  endMinute: number,
  crossesMidnight: boolean
) {
  const endAt = buildDateTime(baseDate, endMinute);

  if (crossesMidnight) {
    endAt.setDate(endAt.getDate() + 1);
  }

  return endAt;
}
