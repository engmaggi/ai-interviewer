"use server";

import { redirect } from "next/navigation";

import {
  getSiteUrl,
  getSupabaseEnv,
  SUPABASE_NOT_CONFIGURED_MESSAGE,
} from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/zod";
import type { ActionResult } from "@/types/action";

import {
  emailSchema,
  registerSchema,
  signInSchema,
  type RegisterValues,
  type SignInValues,
} from "./schemas";

const INVALID_FIELDS_MESSAGE = "Check the highlighted fields and try again.";

function verifyEmailPath(email: string) {
  return `/verify-email?email=${encodeURIComponent(email)}`;
}

export async function signInAction(
  values: SignInValues,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: INVALID_FIELDS_MESSAGE,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (!getSupabaseEnv()) return { error: SUPABASE_NOT_CONFIGURED_MESSAGE };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed")
      redirect(verifyEmailPath(parsed.data.email));

    // Same message for unknown email and wrong password, so accounts can't be enumerated.
    return { error: "Incorrect email or password." };
  }

  redirect("/overview");
}

export async function registerAction(
  values: RegisterValues,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: INVALID_FIELDS_MESSAGE,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (!getSupabaseEnv()) return { error: SUPABASE_NOT_CONFIGURED_MESSAGE };

  const { fullName, level, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the `handle_new_user` database trigger to create the profile row.
      data: { full_name: fullName, level },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm`,
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return {
        error: INVALID_FIELDS_MESSAGE,
        fieldErrors: { password: error.message },
      };
    }

    return {
      error: "We couldn't create your account. Please try again in a moment.",
    };
  }

  // Supabase answers the same way for an already-registered email, so accounts can't be enumerated.
  // If email confirmation is turned off in Supabase, the user is already signed in.
  redirect(data.session ? "/overview" : verifyEmailPath(email));
}

export async function resendVerificationAction(
  email: string,
): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { error: "Enter a valid email address." };

  if (!getSupabaseEnv()) return { error: SUPABASE_NOT_CONFIGURED_MESSAGE };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/confirm` },
  });

  if (error)
    return {
      error: "We couldn't send the email. Please wait a minute and try again.",
    };

  return { ok: true };
}

export async function signOutAction() {
  if (getSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/sign-in");
}
