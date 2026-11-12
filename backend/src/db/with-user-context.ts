import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";

/**
 * Runs `fn` inside a transaction that behaves exactly like a request from the
 * logged-in user would through Supabase's own API:
 *
 *   1. `request.jwt.claims` is set, so `auth.uid()` returns this user's id.
 *   2. `SET LOCAL ROLE authenticated` drops our owner privileges for the rest of
 *      the transaction, so Row Level Security policies and column privileges apply.
 *
 * Result: even if a service has a bug (e.g. forgets a WHERE clause), the database
 * itself refuses to show or change other people's rows or to touch `account_type`.
 * Both settings are transaction-local and vanish on COMMIT/ROLLBACK, so pooled
 * connections are never left in a privileged or impersonated state.
 */
export async function withUserContext<T>(
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const claims = JSON.stringify({ sub: userId, role: "authenticated" });
    await tx.$executeRaw`SELECT set_config('request.jwt.claims', ${claims}, true)`;
    await tx.$executeRaw`SET LOCAL ROLE authenticated`;
    return fn(tx);
  });
}
