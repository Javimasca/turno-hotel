import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const interestingTables = new Set([
  "employees",
  "shifts",
  "shift_masters",
  "Employee",
  "Shift",
  "ShiftMaster",
  "User",
  "Session",
  "workplaces",
  "RestaurantCoverageRule",
]);

try {
  const tables = await prisma.$queryRaw`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `;

  for (const { table_name: tableName } of tables) {
    if (!interestingTables.has(tableName)) {
      continue;
    }

    const escapedTableName = tableName.replaceAll('"', '""');
    const rows = await prisma.$queryRawUnsafe(
      `select count(*)::int as count from public."${escapedTableName}"`
    );
    console.log(`${tableName}=${rows[0].count}`);
  }
} finally {
  await prisma.$disconnect();
}
