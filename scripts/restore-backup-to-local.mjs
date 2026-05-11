import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const backupName = process.argv[2];
if (!backupName) {
  console.error("Uso: node scripts/restore-backup-to-local.mjs backup.dump");
  process.exit(1);
}

const root = process.cwd();
const backupPath = path.join(root, backupName);
if (!fs.existsSync(backupPath)) {
  console.error(`No existe el backup: ${backupName}`);
  process.exit(1);
}

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

function run(command, args, env) {
  execFileSync(command, args, { env, stdio: "inherit" });
}

function output(command, args, env) {
  return execFileSync(command, args, { env, stdio: "pipe" }).toString("utf8");
}

const databaseUrl = new URL(readDatabaseUrl());
databaseUrl.search = "";

const password = decodeURIComponent(databaseUrl.password);
const env = { ...process.env, PGPASSWORD: password };

const pgDump = findTool("pg_dump");
const pgRestore = findTool("pg_restore");
const psql = findTool("psql");

const stamp = new Date()
  .toISOString()
  .replaceAll("-", "")
  .replaceAll(":", "")
  .replace(/\..+$/, "")
  .replace("T", "-");
const currentBackup = path.join(root, `backup-local-before-restore-${stamp}.dump`);
const listPath = path.join(os.tmpdir(), `restore-local-${stamp}.list`);

console.log("1/3 Backup de la base local actual...");
run(
  pgDump,
  [
    databaseUrl.toString(),
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    `--file=${currentBackup}`,
  ],
  env
);

console.log("2/3 Vaciando esquema public local...");
run(
  psql,
  [
    databaseUrl.toString(),
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "DROP SCHEMA IF EXISTS public CASCADE;",
    "-c",
    "CREATE SCHEMA public;",
  ],
  env
);

console.log("3/3 Restaurando backup en local...");
const restoreList = output(pgRestore, ["--list", backupPath], env)
  .split(/\r?\n/)
  .filter((line) => !line.includes("EXTENSION - prisma_postgres"))
  .filter((line) => !line.includes("COMMENT - EXTENSION prisma_postgres"))
  .join("\n");
fs.writeFileSync(listPath, restoreList, "utf8");

run(
  pgRestore,
  [
    "--exit-on-error",
    "--no-owner",
    "--no-privileges",
    `--use-list=${listPath}`,
    `--dbname=${databaseUrl.toString()}`,
    backupPath,
  ],
  env
);

console.log("");
console.log("Restauracion local completada.");
console.log(`Backup previo local: ${path.basename(currentBackup)}`);
