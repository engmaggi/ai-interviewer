import "server-only";
import { UnauthorizedError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { developerRolesService } from "@/modules/developer-roles/developer-roles.service";
import { profilesService } from "@/modules/profiles/profiles.service";
import { mapAuthError } from "./auth.errors";
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "./auth.schemas";

export const authService = {
  /**
   * Public registration. Always creates a regular "user":
   *  - the API schema has no accountType field, and
   *  - the database trigger ignores any account_type in the metadata.
   * The profile row is created by that trigger, atomically with the auth user.
   */
  async register(input: RegisterInput) {
    // Validate the role BEFORE calling Supabase, so the user gets a clear 400
    // instead of an opaque "database error saving new user".
    await developerRolesService.assertActive(input.developerRole);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        captchaToken: input.captchaToken,
        // Read by the `handle_new_user` database trigger (snake_case keys).
        data: {
          display_name: input.displayName,
          developer_role: input.developerRole,
          target_seniority: input.targetSeniority,
          years_of_experience: input.yearsOfExperience,
        },
      },
    });

    // "Email already registered" is deliberately NOT an error here, and Supabase
    // does not reveal it either: otherwise this endpoint would let anyone find
    // out which emails have accounts (user enumeration).
    if (error && error.code !== "user_already_exists" && error.code !== "email_exists") {
      throw mapAuthError(error);
    }

    return { message: "Check your email to confirm your account." };
  },

  /** Email + password login. On success Supabase sets the session cookies. */
  async login(input: LoginInput) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
      options: { captchaToken: input.captchaToken },
    });
    if (error) throw mapAuthError(error);

    return profilesService.getOwn(data.user.id, data.user.email ?? null);
  },

  /** Ends the session and clears the cookies. Safe to call when not logged in. */
  async logout() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  },

  /**
   * Sends a password-reset email. ALWAYS reports success (even for unknown emails)
   * so the endpoint cannot be used to discover which emails are registered.
   * Only captcha and rate-limit problems are reported, since they are about the caller.
   */
  async forgotPassword(input: ForgotPasswordInput) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, { captchaToken: input.captchaToken });
    if (error && (error.code === "captcha_failed" || error.status === 429)) throw mapAuthError(error);
    if (error) console.error("[forgot-password]", error.code, error.message);

    return { message: "If an account exists for this email, a reset link has been sent." };
  },

  /**
   * Sets a new password. The caller must hold a recovery session, which they get
   * by clicking the emailed link (handled by GET /auth/confirm).
   */
  async resetPassword(input: ResetPasswordInput) {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new UnauthorizedError("The reset link is invalid or has expired.", "RESET_LINK_INVALID");
    }

    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) throw mapAuthError(error);

    // Security: after a password change, sign out every OTHER device.
    await supabase.auth.signOut({ scope: "others" });

    return { message: "Your password has been updated." };
  },
};
