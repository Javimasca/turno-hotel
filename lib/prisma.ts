import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

function readLocalDatabaseUrlFromEnvFile() {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const envPath = path.join(process.cwd(), '.env')

  if (!fs.existsSync(envPath)) {
    return null
  }

  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((item) => /^\s*DATABASE_URL\s*=/.test(item))

  if (!line) {
    return null
  }

  let value = line.replace(/^\s*DATABASE_URL\s*=\s*/, '').trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return value.trim()
}

const databaseUrl = readLocalDatabaseUrlFromEnvFile() ?? process.env.DATABASE_URL

if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl.trim()
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
