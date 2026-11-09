"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/config/navigation";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { cn } from "@/lib/utils";

import { Logo } from "../shared/logo";
import { isRouteActive } from "./route";

/** Compact top navigation for tablets (640–1023px). */
export function TabletHeader({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border bg-card px-6 md:flex lg:hidden">
      <Logo className="text-[24px] font-semibold text-primary" />

      <nav aria-label="Main" className="flex items-center gap-5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={
              isRouteActive(pathname, item.href) ? "page" : undefined
            }
            className={cn(
              "text-[13px] outline-none focus-visible:underline",
              isRouteActive(pathname, item.href)
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}

        <SignOutButton />
      </nav>
    </header>
  );
}
