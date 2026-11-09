/** Self-reported seniority chosen at registration. This is NOT the assessed level. */
export const DEVELOPER_LEVELS = ["junior", "mid", "senior"] as const;
export type DeveloperLevel = (typeof DEVELOPER_LEVELS)[number];

export const DEVELOPER_LEVEL_LABELS: Record<DeveloperLevel, string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
};

export const USER_ROLES = ["candidate", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  candidate: "Candidate",
  admin: "Admin",
};

export function isDeveloperLevel(value: unknown): value is DeveloperLevel {
  return (DEVELOPER_LEVELS as readonly string[]).includes(value as string);
}

export function isUserRole(value: unknown): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value as string);
}
