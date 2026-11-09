import { z } from "zod";

import { DEVELOPER_LEVELS } from "@/lib/constants/user";

export const emailSchema = z.email("Enter a valid email address");

/** Password policy shared by registration and admin-created users. */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const levelSchema = z.enum(DEVELOPER_LEVELS, {
  error: "Choose your current developer level",
});

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name")
  .max(80, "Use 80 characters or fewer");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  fullName: fullNameSchema,
  level: levelSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
