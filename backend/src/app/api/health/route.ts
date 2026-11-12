import { prisma } from "@/db/prisma";
import { ok } from "@/lib/http/responses";
import { route } from "@/lib/http/handler";

// GET /api/health — is the app up, and can it reach the database?
export const GET = route(async () => {
  await prisma.$queryRaw`SELECT 1`;
  return ok({ status: "ok" });
});
