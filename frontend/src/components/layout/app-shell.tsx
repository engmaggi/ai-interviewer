import type { ReactNode } from "react";

import type { NavItem } from "@/config/navigation";
import type { SessionUser } from "@/features/auth/types";

import { BottomNav } from "./bottom-nav";
import { MobileHeader } from "./mobile-header";
import { Sidebar } from "./sidebar";
import { TabletHeader } from "./tablet-header";

type AppShellProps = {
  items: NavItem[];
  subtitle: string;
  user: SessionUser;
  children: ReactNode;
};

/**
 * Responsive app frame (Figma "Responsive rules"):
 * desktop ≥ 1024 sidebar · tablet 640–1023 top nav · mobile < 640 header + bottom nav.
 */
export function AppShell({ items, subtitle, user, children }: AppShellProps) {
  const compactItems = items.filter((item) => item.compact);

  return (
    <div className="min-h-dvh">
      <Sidebar items={items} subtitle={subtitle} user={user} />
      <TabletHeader items={compactItems} />
      <MobileHeader items={items} user={user} />

      <div className="lg:pl-[220px]">
        <main className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-8 md:pt-8 md:pb-10 lg:px-10">
          {children}
        </main>
      </div>

      {compactItems.length > 1 && <BottomNav items={compactItems} />}
    </div>
  );
}
