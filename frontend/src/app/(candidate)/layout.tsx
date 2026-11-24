import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ShellFallback } from "@/components/layout/shell-fallback";
import { candidateNavItems } from "@/config/navigation";
import { requireUser } from "@/features/auth/server/session";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <CandidateShell>{children}</CandidateShell>
    </Suspense>
  );
}

async function CandidateShell({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell items={candidateNavItems} subtitle="Developer growth" user={user}>
      {children}
    </AppShell>
  );
}
