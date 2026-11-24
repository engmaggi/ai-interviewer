import { z } from "zod";

import {
  MAX_YEARS_OF_EXPERIENCE,
  TARGET_SENIORITIES,
} from "@/lib/constants/user";

// Mirrors backend/src/modules/auth/auth.schemas.ts so users see the same rules before the request is sent.

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z.email("Enter a valid email address").max(254, "Use 254 characters or fewer"),
  );

/** Supabase hashes with bcrypt, which ignores everything past 72 bytes. */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your name")
  .max(80, "Use 80 characters or fewer");

export const developerRoleSchema = z.string().min(1, "Choose your role");

export const targetSenioritySchema = z.enum(TARGET_SENIORITIES, {
  error: "Choose your level",
});

export const yearsOfExperienceSchema = z
  .number({ error: "Enter your years of experience" })
  .int("Use whole years")
  .min(0, "Can't be negative")
  .max(MAX_YEARS_OF_EXPERIENCE, `Use ${MAX_YEARS_OF_EXPERIENCE} or fewer`);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128),
});

export const registerSchema = z.object({
  displayName: displayNameSchema,
  developerRole: developerRoleSchema,
  targetSeniority: targetSenioritySchema,
  yearsOfExperience: yearsOfExperienceSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
