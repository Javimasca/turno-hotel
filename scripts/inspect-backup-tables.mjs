import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const backupName = process.argv[2];
if (!backupName) {
  console.error("Uso: node scripts/inspect-backup-tables.mjs backup.dump");
  process.exit(1);
}

const root = process.cwd();
const backupPath = path.join(root, backupName);
const tempDbName = "turnohotel_backup_tables_inspect";

function readDatabaseUrl() {
  const line = fs
    .readFileSync(path.join(root, ".env"), "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));
  if (!line) throw new Error("No DATABASE_URL found in .env");
  return line.slice(line.indexOf("=") + 1).trim().replace(/^"/, "").replace(/"$/, "");
}

function findTool(toolName) {
  const candidates = [
    toolName,
    `C:\\Program Files\\PostgreSQL\\18\\bin\\${toolName}.exe`,
    `C:\\Program Files\\PostgreSQL\\17\\bin\\${toolName}.exe`,
    `C:\\Program Files\\PostgreSQL\\16\\bin\\${toolName}.exe`,
    `C:\\Program Files\\PostgreSQL\\15\\bin\\${toolName}.exe`,
  ];

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["--version"], { stdio: "ignore" });
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(`No encuentro ${toolName}`);
}

function exec(command, args, env) {
  return execFileSync(command, args, { env, stdio: "pipe" }).toString("utf8");
}

function sqlEscape(value) {
  return value.replaceAll('"', '""');
}

const localUrl = new URL(readDatabaseUrl());
localUrl.search = "";
const env = { ...process.env, PGPASSWORD: decodeURIComponent(localUrl.password) };
const host = localUrl.hostname;
const port = localUrl.port || "5432";
const user = decodeURIComponent(localUrl.username);

const dropdb = findTool("dropdb");
const createdb = findTool("createdb");
const psql = findTool("psql");
const pgRestore = findTool("pg_restore");

exec(dropdb, ["-h", host, "-p", port, "-U", user, "--if-exists", tempDbName], env);
exec(createdb, ["-h", host, "-p", port, "-U", user, tempDbName], env);

const tempUrl = new URL(localUrl.toString());
tempUrl.pathname = `/${tempDbName}`;

try {
  exec(
    psql,
    [
      tempUrl.toString(),
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      "DROP SCHEMA IF EXISTS public CASCADE;",
      "-c",
      "CREATE SCHEMA public;",
    ],
    env
  );

  const listPath = path.join(os.tmpdir(), `${tempDbName}.list`);
  const restoreList = exec(pgRestore, ["--list", backupPath], env)
    .split(/\r?\n/)
    .filter((line) => !line.includes("EXTENSION - prisma_postgres"))
    .filter((line) => !line.includes("COMMENT - EXTENSION prisma_postgres"))
    .join("\n");
  fs.writeFileSync(listPath, restoreList, "utf8");

  exec(
    pgRestore,
    ["--exit-on-error", "--no-owner", "--no-privileges", `--use-list=${listPath}`, `--dbname=${tempUrl.toString()}`, backupPath],
    env
  );

  const prisma = new PrismaClient({ datasources: { db: { url: tempUrl.toString() } } });
  const tables = await prisma.$queryRaw`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
    order by table_name
  `;

  for (const { table_name: tableName } of tables) {
    const rows = await prisma.$queryRawUnsafe(
      `select count(*)::int as count from public."${sqlEscape(tableName)}"`
    );
    console.log(`${tableName}=${rows[0].count}`);
  }
  await prisma.$disconnect();
} finally {
  exec(dropdb, ["-h", host, "-p", port, "-U", user, "--if-exists", tempDbName], env);
}
