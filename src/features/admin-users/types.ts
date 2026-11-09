import type { DeveloperLevel, UserRole } from "@/lib/constants/user";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  level: DeveloperLevel;
  role: UserRole;
  createdAt: string;
}
