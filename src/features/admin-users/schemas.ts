import { z } from "zod";

import { USER_ROLES } from "@/lib/constants/user";
import {
  emailSchema,
  fullNameSchema,
  levelSchema,
  passwordSchema,
} from "@/features/auth/schemas";

/** Fields shared by the create and edit forms. `password` is only used when creating. */
export const userFormSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  level: levelSchema,
  role: z.enum(USER_ROLES),
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
