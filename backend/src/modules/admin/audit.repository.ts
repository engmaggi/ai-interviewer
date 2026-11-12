import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/db/prisma";

interface AuditEntry {
  actorId: string | null;
  action: string;
  targetUserId?: string;
  metadata?: Prisma.InputJsonObject;
}

export const auditRepository = {
  /** `db` can be a transaction client, so the entry commits atomically with the change it describes. */
  record(entry: AuditEntry, db: Prisma.TransactionClient | typeof prisma = prisma) {
    return db.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        targetUserId: entry.targetUserId,
        metadata: entry.metadata ?? {},
      },
    });
  },
};
