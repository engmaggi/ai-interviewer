import "server-only";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profilesRepository } from "@/modules/profiles/profiles.repository";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

/**
 * Authentication guard: "who is calling?"
 * Call at the top of any route that needs a logged-in user; it throws 401 otherwise.
 *
 * getClaims() verifies the access token's signature, so a forged or expired token
 * is rejected. We never trust getSession() on the server: it reads the cookie
 * without verifying it.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) throw new UnauthorizedError();
  return { id: sub, email: typeof data.claims.email === "string" ? data.claims.email : null };
}

/**
 * Authorization guard: "is the caller an administrator?"
 * Throws 401 if not logged in, 403 if logged in but not an admin.
 *
 * Extra strict compared with requireUser, because admin actions are powerful:
 *  - getUser() asks Supabase Auth to confirm the session is STILL valid
 *    (a deleted/banned user's JWT could otherwise live up to an hour);
 *  - account_type is read from the database on every call, so a demotion
 *    takes effect immediately instead of when the token expires.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== user.id) throw new UnauthorizedError();

  const profile = await profilesRepository.findAccountType(user.id);
  if (!profile) throw new UnauthorizedError("This account no longer exists.", "ACCOUNT_NOT_FOUND");
  if (profile.accountType !== "admin") throw new ForbiddenError("Administrator access is required.", "ADMIN_REQUIRED");

  return user;
}
