import "server-only";
import { databaseEnv } from "@/lib/env";
import { createPrismaClient } from "./create-prisma-client";

// In development Next.js reloads modules often; keep ONE client on globalThis
// so we do not open a new connection pool on every reload.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> };

function getPrisma() {
  if (!globalForPrisma.prisma) {
    const env = databaseEnv();
    globalForPrisma.prisma = createPrismaClient(env.DATABASE_URL, env.DATABASE_SSL_CA);
  }
  return globalForPrisma.prisma;
}

/**
 * The default Prisma client. It connects as the database owner (`postgres`), which
 * BYPASSES Row Level Security. Only use it for server-authoritative work
 * (admin operations, reading public lookup data). For anything done on behalf of
 * an ordinary user, use `withUserContext` (./with-user-context.ts) instead.
 */
// (Lazy via Proxy so importing this file never needs env variables, e.g. during `next build`.)
export const prisma = new Proxy({} as ReturnType<typeof createPrismaClient>, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
