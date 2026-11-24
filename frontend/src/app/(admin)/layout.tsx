import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ShellFallback } from "@/components/layout/shell-fallback";
import { adminNavItems } from "@/config/navigation";
import { requireAdmin } from "@/features/auth/server/session";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return (
    <AppShell items={adminNavItems} subtitle="Admin" user={user}>
      {children}
    </AppShell>
  );
}
