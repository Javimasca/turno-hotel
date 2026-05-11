import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const envPath = path.join(root, ".env");
const tempDbName = "turnohotel_backup_inspect_auto";

function readDatabaseUrl() {
  const content = fs.readFileSync(envPath, "utf8");
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));

  if (!line) {
    throw new Error("No DATABASE_URL found in .env");
  }

  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^"/, "")
    .replace(/"$/, "");
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
  execFileSync(command, args, { env, stdio: "pipe" });
}

function output(command, args, env) {
  return execFileSync(command, args, { env, stdio: "pipe" }).toString("utf8");
}

function firstErrorLine(error) {
  const stderr = error.stderr?.toString("utf8").trim();
  if (stderr) {
    return stderr.split(/\r?\n/)[0];
  }

  return error.message.split(/\r?\n/)[0];
}

function sqlEscape(value) {
  return value.replaceAll('"', '""');
}

function redact(value) {
  return value.replace(/postgresql:\/\/([^:]+):[^@]+@/g, "postgresql://$1:***@");
}

const localUrl = new URL(readDatabaseUrl());
localUrl.search = "";

const host = localUrl.hostname;
const port = localUrl.port || "5432";
const user = decodeURIComponent(localUrl.username);
const password = decodeURIComponent(localUrl.password);
const env = { ...process.env, PGPASSWORD: password };

const dropdb = findTool("dropdb");
const createdb = findTool("createdb");
const pgRestore = findTool("pg_restore");
const psql = findTool("psql");

const backups = fs
  .readdirSync(root)
  .filter((name) => /^backup-.*\.dump$/i.test(name))
  .map((name) => ({
    name,
    fullPath: path.join(root, name),
    size: fs.statSync(path.join(root, name)).size,
  }))
  .filter((backup) => backup.size > 0)
  .sort((a, b) => b.size - a.size);

const interestingTables = [
  "employees",
  "shifts",
  "shift_masters",
  "workplaces",
  "departments",
  "User",
  "Session",
  "RestaurantCoverageRule",
];

for (const backup of backups) {
  run(dropdb, ["-h", host, "-p", port, "-U", user, "--if-exists", tempDbName], env);
  run(createdb, ["-h", host, "-p", port, "-U", user, tempDbName], env);

  const tempUrl = new URL(localUrl.toString());
  tempUrl.pathname = `/${tempDbName}`;

  try {
    const restoreListPath = path.join(os.tmpdir(), `${tempDbName}-${backup.name}.list`);
    const restoreList = output(pgRestore, ["--list", backup.fullPath], env)
      .split(/\r?\n/)
      .filter((line) => !line.includes("EXTENSION - prisma_postgres"))
      .filter((line) => !line.includes("COMMENT - EXTENSION prisma_postgres"))
      .join("\n");
    fs.writeFileSync(restoreListPath, restoreList, "utf8");

    run(
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

    run(
      pgRestore,
      [
        "--exit-on-error",
        "--no-owner",
        "--no-privileges",
        `--use-list=${restoreListPath}`,
        `--dbname=${tempUrl.toString()}`,
        backup.fullPath,
      ],
      env
    );

    const prisma = new PrismaClient({
      datasources: { db: { url: tempUrl.toString() } },
    });

    const counts = {};
    for (const table of interestingTables) {
      const exists = await prisma.$queryRawUnsafe(
        "select to_regclass($1)::text as table_name",
        `public."${sqlEscape(table)}"`
      );

      if (!exists[0].table_name) {
        counts[table] = "missing";
        continue;
      }

      const rows = await prisma.$queryRawUnsafe(
        `select count(*)::int as count from public."${sqlEscape(table)}"`
      );
      counts[table] = rows[0].count;
    }

    await prisma.$disconnect();
    console.log(JSON.stringify({ backup: backup.name, size: backup.size, counts }));
  } catch (error) {
    console.log(
      JSON.stringify({
        backup: backup.name,
        size: backup.size,
        error: redact(firstErrorLine(error)),
      })
    );
  }
}

run(dropdb, ["-h", host, "-p", port, "-U", user, "--if-exists", tempDbName], env);
