import type { AccountType, TargetSeniority } from "@/lib/constants/user";

/** `GET /api/admin/users` item. `developerRole` is the role code, not the `{ code, label }` object. */
export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string;
  accountType: AccountType;
  developerRole: string;
  targetSeniority: TargetSeniority;
  yearsOfExperience: number;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
  createdAt: string;
}

export interface AdminUsersPage {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
}
