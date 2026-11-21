import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { serverApi } from "@/lib/api/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

import type { SessionUser } from "../types";

/**
 * Development-only stand-in so the UI can be built before Supabase keys exist.
 * Set DEV_MOCK_ROLE=admin in .env.local to preview the admin area.
 */
function getDevelopmentUser(): SessionUser | null {
  if (process.env.NODE_ENV !== "development") return null;

  const now = new Date().toISOString();

  return {
    id: "dev-user",
    email: "maggi@example.com",
    displayName: "Maggi Mamdouh",
    accountType: process.env.DEV_MOCK_ROLE === "admin" ? "admin" : "user",
    developerRole: { code: "frontend_developer", label: "Frontend Developer" },
    targetSeniority: "mid",
    yearsOfExperience: 6,
    createdAt: now,
    updatedAt: now,
  };
}

/** Current user's profile from `GET /api/me`, deduplicated per request. Returns null when signed out. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!getSupabaseEnv()) return getDevelopmentUser();

  try {
    return await serverApi.get<SessionUser>("/api/me");
  } catch (error) {
    // 401 covers both "no session" and "account deleted" (ACCOUNT_NOT_FOUND).
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.accountType !== "admin") redirect("/overview");

  return user;
}
