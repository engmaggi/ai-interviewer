import { z } from "zod";

import {
  ACCOUNT_TYPES,
  MAX_YEARS_OF_EXPERIENCE,
} from "@/lib/constants/user";
import {
  displayNameSchema,
  emailSchema,
  passwordSchema,
  targetSenioritySchema,
} from "@/features/auth/schemas";

/** Fields shared by the create and edit forms. `password` is only used when creating. */
export const userFormSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  targetSeniority: targetSenioritySchema,
  accountType: z.enum(ACCOUNT_TYPES),
  developerRole: z.string().min(1, "Choose a developer role").max(50),
  yearsOfExperience: z
    .number({ error: "Enter years of experience" })
    .int("Use whole years")
    .min(0, "Can't be negative")
    .max(MAX_YEARS_OF_EXPERIENCE, `Use ${MAX_YEARS_OF_EXPERIENCE} or fewer`),
  password: z.string().optional(),
});

export const createUserSchema = userFormSchema.extend({
  password: passwordSchema,
});

export const updateUserSchema = userFormSchema.extend({
  id: z.uuid("Invalid user"),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
export type CreateUserValues = z.infer<typeof createUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
