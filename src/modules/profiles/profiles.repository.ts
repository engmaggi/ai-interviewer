import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/db/prisma";
import { withUserContext } from "@/db/with-user-context";
import type { UpdateProfileInput } from "./profiles.schemas";

const withRole = { role: { select: { code: true, label: true } } } satisfies Prisma.ProfileInclude;
export type ProfileRecord = Prisma.ProfileGetPayload<{ include: typeof withRole }>;

export const profilesRepository = {
  /** Reads the user's own profile. Runs under RLS as that user. */
  findOwn(userId: string): Promise<ProfileRecord | null> {
    return withUserContext(userId, (tx) => tx.profile.findUnique({ where: { id: userId }, include: withRole }));
  },

  /**
   * Updates the user's own profile. Runs under RLS as that user, with column
   * privileges: only the four editable columns can change. Returns null when the
   * row does not exist (e.g. the account was deleted).
   */
  async updateOwn(userId: string, data: UpdateProfileInput): Promise<ProfileRecord | null> {
    try {
      return await withUserContext(userId, (tx) =>
        tx.profile.update({
          where: { id: userId },
          data: {
            displayName: data.displayName,
            developerRole: data.developerRole,
            targetSeniority: data.targetSeniority,
            yearsOfExperience: data.yearsOfExperience,
          },
          include: withRole,
        }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") return null;
      throw err;
    }
  },

  /** Privileged lookup (bypasses RLS) used by authorization guards. */
  findAccountType(userId: string) {
    return prisma.profile.findUnique({ where: { id: userId }, select: { accountType: true } });
  },
};
