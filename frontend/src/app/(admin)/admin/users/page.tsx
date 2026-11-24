import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { UserFormDialog } from "@/features/admin-users/components/user-form-dialog";
import { UsersTable } from "@/features/admin-users/components/users-table";
import { listUsers } from "@/features/admin-users/server/queries";
import { requireAdmin } from "@/features/auth/server/session";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const { users, error } = await listUsers();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-lg">Users</h1>
          <p className="text-body-sm text-muted-foreground">
            Create, edit and remove accounts.
          </p>
        </div>

        <UserFormDialog />
      </header>

      {error && <Alert>{error}</Alert>}

      <Card padding="none" className="overflow-hidden">
        <UsersTable users={users} currentUserId={admin.id} />
      </Card>
    </div>
  );
}
