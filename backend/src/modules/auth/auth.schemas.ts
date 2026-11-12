import { z } from "zod";
import {
  developerRoleCodeSchema,
  displayNameSchema,
  targetSenioritySchema,
  yearsOfExperienceSchema,
} from "@/modules/profiles/profiles.schemas";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(254));

// Supabase hashes with bcrypt, which ignores everything past 72 bytes: cap at 72.
const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

// Cloudflare Turnstile token produced by the widget in the browser.
const captchaTokenSchema = z.string().min(1, "Captcha token is required").max(4096);

export const registerSchema = z.strictObject({
  email: emailSchema,
  password: newPasswordSchema,
  displayName: displayNameSchema,
  developerRole: developerRoleCodeSchema,
  targetSeniority: targetSenioritySchema,
  yearsOfExperience: yearsOfExperienceSchema,
  captchaToken: captchaTokenSchema,
  // NOTE: there is deliberately no `accountType` field. strictObject rejects it
  // if a client sends one; public registration can only ever create a "user".
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
  captchaToken: captchaTokenSchema,
});

export const forgotPasswordSchema = z.strictObject({
  email: emailSchema,
  captchaToken: captchaTokenSchema,
});

export const resetPasswordSchema = z.strictObject({
  password: newPasswordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
