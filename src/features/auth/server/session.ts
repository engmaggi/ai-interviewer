import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { isDeveloperLevel, isUserRole } from "@/lib/constants/user";

import type { SessionUser } from "../types";

/**
 * Development-only stand-in so the UI can be built before Supabase keys exist.
 * Set DEV_MOCK_ROLE=admin in .env.local to preview the admin area.
 */
function getDevelopmentUser(): SessionUser | null {
  if (process.env.NODE_ENV !== "development") return null;

  return {
    id: "dev-user",
    email: "maggi@example.com",
    fullName: "Maggi Mamdouh",
    level: "mid",
    role: process.env.DEV_MOCK_ROLE === "admin" ? "admin" : "candidate",
  };
}

/** Current user + profile, deduplicated per request. Returns null when signed out. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!getSupabaseEnv()) return getDevelopmentUser();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, level, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name || user.email || "Orbit user",
    level: isDeveloperLevel(profile?.level) ? profile.level : "junior",
    role: isUserRole(profile?.role) ? profile.role : "candidate",
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/overview");

  return user;
}
