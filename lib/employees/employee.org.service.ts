import { employeeRepository } from "@/lib/employees/employee.repository";

export type OrgNode = {
  id: string;
  name: string;
  photoUrl: string | null;
  role: string | null;
  workplaceName: string | null;
  directManagerEmployeeId: string | null;
  children: OrgNode[];
};

export const employeeOrgService = {
  async getTree(): Promise<OrgNode[]> {
    const employees = await employeeRepository.findMany({});

    const map = new Map<string, OrgNode>();

    employees.forEach((employee) => {
      const currentContract = employee.employeeContracts.find((contract) => {
        const today = new Date();
        const startsOk = contract.startDate <= today;
        const endsOk =
          contract.endDate === null || contract.endDate >= today;

        return startsOk && endsOk;
      });

      const role = currentContract
        ? currentContract.jobCategory.shortName ||
          currentContract.jobCategory.name
        : null;

      const workplaceName =
        employee.employeeWorkplaces[0]?.workplace?.name ?? null;

      map.set(employee.id, {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        photoUrl: employee.photoUrl ?? null,
        role,
        workplaceName,
        directManagerEmployeeId: employee.directManagerEmployeeId ?? null,
        children: [],
      });
    });

    const roots: OrgNode[] = [];

    employees.forEach((employee) => {
      const node = map.get(employee.id);

      if (!node) {
        return;
      }

      if (employee.directManagerEmployeeId) {
        const parent = map.get(employee.directManagerEmployeeId);

        if (parent) {
          parent.children.push(node);
          return;
        }
      }

      roots.push(node);
    });

    function sortTree(nodes: OrgNode[]) {
      nodes.sort((a, b) => a.name.localeCompare(b.name, "es"));

      nodes.forEach((node) => {
        if (node.children.length > 0) {
          sortTree(node.children);
        }
      });
    }

    sortTree(roots);

    return roots;
  },
};