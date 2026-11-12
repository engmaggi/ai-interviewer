import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Builds a PrismaClient for a connection string. Shared by the app (src/db/prisma.ts)
 * and by the CLI scripts in /scripts.
 *
 * TLS: Supabase requires encrypted connections. Their certificate authority is not
 * in Node's default trust store, so for remote hosts we encrypt the connection but,
 * unless DATABASE_SSL_CA is provided, do not verify the certificate chain.
 * (Download the CA from Supabase → Database Settings → SSL and set DATABASE_SSL_CA
 * to enable full verification.) Do NOT add `?sslmode=...` to the URL: it would override this.
 */
export function createPrismaClient(connectionString: string, sslCa?: string) {
  const host = new URL(connectionString).hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";

  const adapter = new PrismaPg({
    connectionString,
    ssl: isLocal ? false : sslCa ? { ca: sslCa } : { rejectUnauthorized: false },
  });

  return new PrismaClient({ adapter });
}
