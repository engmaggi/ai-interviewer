"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/auth/server/session";
import { toFieldErrors } from "@/lib/zod";
import type { ActionResult } from "@/types/action";

import {
  createUserSchema,
  updateUserSchema,
  type CreateUserValues,
  type UpdateUserValues,
} from "./schemas";
import {
  ADMIN_NOT_CONFIGURED_MESSAGE,
  tryCreateAdminClient,
} from "./server/admin-client";

const INVALID_FIELDS_MESSAGE = "Check the highlighted fields and try again.";
const USERS_PATH = "/admin/users";

// Every action re-checks the admin role on the server; the UI guard alone is never trusted.

export async function createUserAction(
  values: CreateUserValues,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: INVALID_FIELDS_MESSAGE,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = tryCreateAdminClient();
  if (!supabase) return { error: ADMIN_NOT_CONFIGURED_MESSAGE };

  const { fullName, email, level, role, password } = parsed.data;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    // Admin-created accounts are trusted, so they skip the verification email.
    email_confirm: true,
    user_metadata: { full_name: fullName, level },
  });

  if (error || !data.user) {
    if (error?.code === "email_exists") {
      return {
        error: INVALID_FIELDS_MESSAGE,
        fieldErrors: { email: "A user with this email already exists." },
      };
    }

    return { error: "We couldn't create the user. Please try again." };
  }

  // The signup trigger creates the profile; upsert also covers the role and a missing trigger.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, email, full_name: fullName, level, role });

  if (profileError)
    return {
      error: "The user was created but their profile couldn't be saved.",
    };

  revalidatePath(USERS_PATH);
  return { ok: true };
}

export async function updateUserAction(
  values: UpdateUserValues,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = updateUserSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: INVALID_FIELDS_MESSAGE,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { id, fullName, email, level, role } = parsed.data;

  if (id === admin.id && role !== "admin") {
    return { error: "You can't remove your own admin role." };
  }

  const supabase = tryCreateAdminClient();
  if (!supabase) return { error: ADMIN_NOT_CONFIGURED_MESSAGE };

  const { error } = await supabase.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, level },
  });

  if (error) {
    if (error.code === "email_exists") {
      return {
        error: INVALID_FIELDS_MESSAGE,
        fieldErrors: { email: "A user with this email already exists." },
      };
    }

    return { error: "We couldn't update the user. Please try again." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id, email, full_name: fullName, level, role });

  if (profileError)
    return { error: "We couldn't save the profile. Please try again." };

  revalidatePath(USERS_PATH);
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();

  if (!z.uuid().safeParse(userId).success) return { error: "Invalid user." };
  if (userId === admin.id)
    return { error: "You can't delete your own account." };

  const supabase = tryCreateAdminClient();
  if (!supabase) return { error: ADMIN_NOT_CONFIGURED_MESSAGE };

  // The profile row is removed by `on delete cascade`.
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: "We couldn't delete the user. Please try again." };

  revalidatePath(USERS_PATH);
  return { ok: true };
}
