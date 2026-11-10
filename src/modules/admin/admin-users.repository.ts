import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/db/prisma";
import type { ListUsersQuery } from "./admin.schemas";
import { auditRepository } from "./audit.repository";

export interface AdminUserRow {
  id: string;
  email: string | null;
  displayName: string;
  accountType: "user" | "admin";
  developerRole: string;
  targetSeniority: "junior" | "mid" | "senior";
  yearsOfExperience: number;
  emailConfirmedAt: Date | null;
  lastSignInAt: Date | null;
  createdAt: Date;
}

interface RawRow {
  id: string;
  email: string | null;
  display_name: string;
  account_type: "user" | "admin";
  developer_role: string;
  target_seniority: "junior" | "mid" | "senior";
  years_of_experience: number;
  email_confirmed_at: Date | null;
  last_sign_in_at: Date | null;
  created_at: Date;
}

/** Escape LIKE wildcards so a search for "100%" is literal. */
function likePattern(search: string) {
  return `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export const adminUsersRepository = {
  /** Profiles joined with auth.users (the email lives there, not in our table). */
  async list({ page, pageSize, search }: ListUsersQuery): Promise<{ rows: AdminUserRow[]; total: number }> {
    const where = search
      ? Prisma.sql`WHERE p.display_name ILIKE ${likePattern(search)} OR u.email ILIKE ${likePattern(search)}`
      : Prisma.empty;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<RawRow[]>`
        SELECT p.id, u.email, p.display_name, p.account_type::text AS account_type, p.developer_role,
               p.target_seniority::text AS target_seniority, p.years_of_experience,
               u.email_confirmed_at, u.last_sign_in_at, p.created_at
        FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        ${where}
        ORDER BY p.created_at DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT count(*) AS total
        FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        ${where}`,
    ]);

    return {
      total: Number(countRows[0]?.total ?? 0),
      rows: rows.map((r) => ({
        id: r.id,
        email: r.email,
        displayName: r.display_name,
        accountType: r.account_type,
        developerRole: r.developer_role,
        targetSeniority: r.target_seniority,
        yearsOfExperience: r.years_of_experience,
        emailConfirmedAt: r.email_confirmed_at,
        lastSignInAt: r.last_sign_in_at,
        createdAt: r.created_at,
      })),
    };
  },

  findProfile(id: string) {
    return prisma.profile.findUnique({ where: { id }, select: { id: true, displayName: true, accountType: true } });
  },

  /** Changes account_type and writes the audit entry in ONE transaction. */
  changeAccountType(actorId: string, targetId: string, from: "user" | "admin", to: "user" | "admin") {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.profile.update({ where: { id: targetId }, data: { accountType: to } });
      await auditRepository.record(
        { actorId, action: "account_type_changed", targetUserId: targetId, metadata: { from, to } },
        tx,
      );
      return updated;
    });
  },
};
