"use client";

import { usePathname } from "next/navigation";

import type { NavItem } from "@/config/navigation";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { SessionUser } from "@/features/auth/types";
import { DEVELOPER_LEVEL_LABELS } from "@/lib/constants/user";
import { getInitials } from "@/lib/format";

import { Logo } from "../shared/logo";
import { NavIcon } from "./nav-icons";
import { isRouteActive } from "./route";
import { SidebarItem } from "./sidebar-item";

type SidebarProps = {
  items: NavItem[];
  subtitle: string;
  user: SessionUser;
};

/** Persistent navigation for desktop (≥ 1024px). */
export function Sidebar({ items, subtitle, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col bg-sidebar lg:flex">
      <div className="px-7 pt-[27px] pb-5">
        <Logo className="text-white" />
        <p className="mt-0.5 text-label-sm text-sidebar-muted uppercase">
          {subtitle}
        </p>
      </div>

      <nav
        aria-label="Main"
        className="flex flex-1 flex-col gap-2.5 px-3.5 pt-3"
      >
        {items.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<NavIcon name={item.icon} />}
            active={isRouteActive(pathname, item.href)}
          />
        ))}
      </nav>

      <div className="mx-5 flex items-center gap-2.5 border-t border-sidebar-border py-5">
        <span
          aria-hidden
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-sidebar-avatar text-label-sm text-white"
        >
          {getInitials(user.fullName)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-label-md text-white">{user.fullName}</p>
          <p className="truncate text-label-sm text-sidebar-muted">
            {user.role === "admin"
              ? "Administrator"
              : `${DEVELOPER_LEVEL_LABELS[user.level]} developer`}
          </p>
        </div>

        <SignOutButton className="text-sidebar-muted hover:bg-sidebar-accent hover:text-white" />
      </div>
    </aside>
  );
}
