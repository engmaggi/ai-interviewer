import "server-only";

import {
  isAccountType,
  isTargetSeniority,
} from "@/lib/constants/user";

import type { AdminUser } from "../types";
import {
  ADMIN_NOT_CONFIGURED_MESSAGE,
  tryCreateAdminClient,
} from "./admin-client";

const MAX_USERS = 200;

/** Lists profiles for the admin table. Callers must have passed `requireAdmin()`. */
export async function listUsers(): Promise<{
  users: AdminUser[];
  error?: string;
}> {
  const supabase = tryCreateAdminClient();
  if (!supabase) return { users: [], error: ADMIN_NOT_CONFIGURED_MESSAGE };

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, account_type, developer_role, target_seniority, years_of_experience, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(MAX_USERS);

  if (error)
    return {
      users: [],
      error: "We couldn't load the users. Please try again.",
    };

  const users = (data ?? []).map((row) => ({
    id: row.id as string,
    email: null,
    displayName: row.display_name as string,
    accountType: isAccountType(row.account_type) ? row.account_type : "user",
    developerRole: String(row.developer_role ?? ""),
    targetSeniority: isTargetSeniority(row.target_seniority)
      ? row.target_seniority
      : "junior",
    yearsOfExperience: Number(row.years_of_experience ?? 0),
    emailConfirmedAt: null,
    lastSignInAt: null,
    createdAt: row.created_at as string,
  }));

  return { users };
}
