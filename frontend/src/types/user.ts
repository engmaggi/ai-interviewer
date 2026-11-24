import type { AccountType, TargetSeniority } from "@/lib/constants/user";

/** `GET /api/developer-roles` item. */
export interface DeveloperRole {
  code: string;
  label: string;
}

/** The profile the API returns from `GET /api/me` and `POST /api/auth/login`. */
export interface Profile {
  id: string;
  email: string | null;
  displayName: string;
  accountType: AccountType;
  developerRole: DeveloperRole;
  targetSeniority: TargetSeniority;
  yearsOfExperience: number;
  createdAt: string;
  updatedAt: string;
}
