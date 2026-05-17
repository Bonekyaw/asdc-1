import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

function isAccelerateUrl(url: string): boolean {
  return url.startsWith("prisma+postgres://") || url.startsWith("prisma://");
}

function normalizeTcpUrl(url: string): string {
  let normalized = url;

  if (
    normalized.includes("@db.prisma.io") &&
    !normalized.includes("pooled.db.prisma.io")
  ) {
    normalized = normalized.replace("@db.prisma.io", "@pooled.db.prisma.io");
  }

  try {
    const parsed = new URL(normalized);
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    if (!parsed.searchParams.has("uselibpqcompat")) {
      parsed.searchParams.set("uselibpqcompat", "true");
    }
    return parsed.toString();
  } catch {
    return normalized;
  }
}

/**
 * TCP URL for `@prisma/adapter-pg` (postgres:// or postgresql://).
 * Checks POSTGRES_URL, then DIRECT_URL, then DATABASE_URL if it is not an Accelerate URL.
 */
export function resolveRuntimeDatabaseUrl(): string | undefined {
  for (const key of ["POSTGRES_URL", "DIRECT_URL", "DATABASE_URL"] as const) {
    const raw = process.env[key]?.trim();
    if (!raw || isAccelerateUrl(raw)) {
      continue;
    }
    return normalizeTcpUrl(raw);
  }
  return undefined;
}

function resolveAccelerateUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw && isAccelerateUrl(raw)) {
    return raw;
  }
  return undefined;
}

function createPrismaClient(): PrismaClient {
  const tcpUrl = resolveRuntimeDatabaseUrl();
  if (tcpUrl) {
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: tcpUrl }),
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  const accelerateUrl = resolveAccelerateUrl();
  if (accelerateUrl) {
    return new PrismaClient({
      accelerateUrl,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  throw new Error(
    "Database URL not configured. Set POSTGRES_URL to a postgres:// pooled URL from Prisma Console, " +
      "or set DATABASE_URL to a prisma+postgres:// Accelerate URL.",
  );
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
