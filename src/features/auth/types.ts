import type { DeveloperLevel, UserRole } from "@/lib/constants/user";

/** The signed-in user as the UI needs it. `role` is always read from the database, never from user metadata. */
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  level: DeveloperLevel;
  role: UserRole;
}
