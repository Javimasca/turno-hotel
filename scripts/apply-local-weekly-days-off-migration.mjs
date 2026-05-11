import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationPath = path.join(
  root,
  "prisma",
  "migrations",
  "20260509113000_add_employee_weekly_days_off",
  "migration.sql"
);

function readDatabaseUrl() {
  const line = fs
    .readFileSync(path.join(root, ".env"), "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));

  if (!line) {
    throw new Error("No DATABASE_URL found in .env");
  }

  return line.slice(line.indexOf("=") + 1).trim().replace(/^"/, "").replace(/"$/, "");
}

function findPsql() {
  const candidates = [
    "psql",
    "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe",
  ];

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["--version"], { stdio: "ignore" });
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  throw new Error("No encuentro psql.");
}

const databaseUrl = new URL(readDatabaseUrl());
databaseUrl.search = "";

execFileSync(
  findPsql(),
  [databaseUrl.toString(), "-v", "ON_ERROR_STOP=1", "-f", migrationPath],
  {
    env: {
      ...process.env,
      PGPASSWORD: decodeURIComponent(databaseUrl.password),
    },
    stdio: "inherit",
  }
);
