import { z } from "zod";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

export const changeAccountTypeSchema = z.strictObject({
  accountType: z.enum(["user", "admin"]),
});

export const userIdParamSchema = z.object({ id: z.uuid("Invalid user id") });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
