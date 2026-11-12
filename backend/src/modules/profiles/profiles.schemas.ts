import { z } from "zod";

// Reusable field definitions (also used by auth.schemas.ts for registration).
export const displayNameSchema = z.string().trim().min(2, "Must be at least 2 characters").max(80);
export const developerRoleCodeSchema = z.string().regex(/^[a-z][a-z0-9_]*$/, "Invalid developer role code").max(50);
export const targetSeniority = ["junior", "mid", "senior"] as const;
export const targetSenioritySchema = z.enum(targetSeniority);
export const yearsOfExperienceSchema = z.number().int().min(0).max(60);

/**
 * PATCH /api/me. `strictObject` REJECTS unknown keys, so a request such as
 * { "accountType": "admin" } fails with 400 instead of being silently ignored.
 * (Even if it got through, the database would still refuse — defence in depth.)
 */
export const updateProfileSchema = z
  .strictObject({
    displayName: displayNameSchema,
    developerRole: developerRoleCodeSchema,
    targetSeniority: targetSenioritySchema,
    yearsOfExperience: yearsOfExperienceSchema,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field to update." });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
