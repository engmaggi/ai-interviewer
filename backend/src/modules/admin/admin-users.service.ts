import "server-only";
import { ConflictError, NotFoundError, UpstreamError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ListUsersQuery } from "./admin.schemas";
import { adminUsersRepository } from "./admin-users.repository";
import { auditRepository } from "./audit.repository";

type AccountType = "user" | "admin";

/**
 * Business rules for admin operations. The CALLER must already have passed
 * requireAdmin() (done in the route handler); services receive `actorId` only for auditing
 * and for the rules below.
 */
export const adminUsersService = {
  async list(query: ListUsersQuery) {
    const { rows, total } = await adminUsersRepository.list(query);
    return {
      items: rows.map((r) => ({
        ...r,
        emailConfirmedAt: r.emailConfirmedAt?.toISOString() ?? null,
        lastSignInAt: r.lastSignInAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  },

  /** Promote a user to admin or demote an admin back to user. */
  async changeAccountType(actorId: string, targetId: string, accountType: AccountType) {
    // An admin may not change their own role: this also guarantees the platform
    // can never be left without an administrator by a demotion.
    if (actorId === targetId) {
      throw new ConflictError("You cannot change your own account type.", "CANNOT_MODIFY_SELF");
    }

    const target = await adminUsersRepository.findProfile(targetId);
    if (!target) throw new NotFoundError("User not found.", "USER_NOT_FOUND");

    if (target.accountType !== accountType) {
      await adminUsersRepository.changeAccountType(actorId, targetId, target.accountType, accountType);
    }
    return { id: targetId, accountType };
  },

  /** Permanently deletes the account. The profile row disappears through ON DELETE CASCADE. */
  async deleteUser(actorId: string, targetId: string) {
    if (actorId === targetId) {
      throw new ConflictError("You cannot delete your own account.", "CANNOT_MODIFY_SELF");
    }

    const target = await adminUsersRepository.findProfile(targetId);
    if (!target) throw new NotFoundError("User not found.", "USER_NOT_FOUND");

    const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(targetId);
    if (error) {
      if (error.code === "user_not_found") throw new NotFoundError("User not found.", "USER_NOT_FOUND");
      console.error("[admin delete user]", error.code, error.message);
      throw new UpstreamError("Could not delete the user. Please try again.");
    }

    // target_user_id has no foreign key, so the log entry outlives the user.
    await auditRepository.record({
      actorId,
      action: "user_deleted",
      targetUserId: targetId,
      metadata: { displayName: target.displayName, accountType: target.accountType },
    });
  },
};
