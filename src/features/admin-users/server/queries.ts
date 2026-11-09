import "server-only";

import { isDeveloperLevel, isUserRole } from "@/lib/constants/user";

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
    .select("id, email, full_name, level, role, created_at")
    .order("created_at", { ascending: false })
    .limit(MAX_USERS);

  if (error)
    return {
      users: [],
      error: "We couldn't load the users. Please try again.",
    };

  const users = (data ?? []).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    fullName: row.full_name as string,
    level: isDeveloperLevel(row.level) ? row.level : "junior",
    role: isUserRole(row.role) ? row.role : "candidate",
    createdAt: row.created_at as string,
  }));

  return { users };
}
