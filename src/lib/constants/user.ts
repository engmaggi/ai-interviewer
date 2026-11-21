/** Self-reported seniority chosen at registration. This is NOT the assessed level. */
export const TARGET_SENIORITIES = ["junior", "mid", "senior"] as const;
export type TargetSeniority = (typeof TARGET_SENIORITIES)[number];

export const TARGET_SENIORITY_LABELS: Record<TargetSeniority, string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
};

export const ACCOUNT_TYPES = ["user", "admin"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  user: "Candidate",
  admin: "Admin",
};

export const MAX_YEARS_OF_EXPERIENCE = 60;

export function isTargetSeniority(value: unknown): value is TargetSeniority {
  return (TARGET_SENIORITIES as readonly string[]).includes(value as string);
}

export function isAccountType(value: unknown): value is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(value as string);
}
