import { employeeAvailabilityBlockRepository } from "./employeeAvailabilityBlockRepository";

export const employeeAvailabilityBlockService = {
  async getBlocksForEmployees(params: {
    employeeIds: string[];
    startDate: Date;
    endDate: Date;
  }) {
    return employeeAvailabilityBlockRepository.findByEmployeesAndDateRange(
      params
    );
  },

  isEmployeeAvailableForShift(params: {
    employeeId: string;
    shiftStart: Date;
    shiftEnd: Date;
    blocks: any[];
  }) {
    const { employeeId, shiftStart, shiftEnd, blocks } = params;

    const employeeBlocks = blocks.filter(
      (block) => block.employeeId === employeeId
    );

    for (const block of employeeBlocks) {
      if (block.type === "DAY_OFF") {
        return false;
      }

      if (!block.startAt && !block.endAt) {
        return false;
      }

      if (block.startAt && block.endAt) {
        const overlaps =
          shiftStart < block.endAt && shiftEnd > block.startAt;

        if (overlaps) {
          return false;
        }
      }
    }

    return true;
  },
};