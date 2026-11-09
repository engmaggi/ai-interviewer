"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

import { isRouteActive } from "./route";

/** Figma "Bottom Navigation / Mobile": fixed to the bottom with the iOS safe-area inset. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex h-[68px] items-center justify-between p-3">
        {items.map((item) => {
          const active = isRouteActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 min-w-11 items-center justify-center rounded-control px-2 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "font-semibold text-primary"
                    : "text-muted-foreground",
                )}
              >
                {item.shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
