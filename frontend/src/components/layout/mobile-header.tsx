"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NavItem } from "@/config/navigation";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { SessionUser } from "@/features/auth/types";
import { cn } from "@/lib/utils";

import { Logo } from "../shared/logo";
import { NavIcon } from "./nav-icons";
import { isRouteActive } from "./route";

const MENU_ID = "mobile-menu";

/** Top bar for phones (< 640px) with a menu listing every destination. */
export function MobileHeader({
  items,
  user,
}: {
  items: NavItem[];
  user: SessionUser;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card md:hidden">
      <div className="flex h-16 items-center justify-between px-[18px]">
        <Logo className="text-[24px] font-semibold text-primary" />

        <Button
          variant="ghost"
          size="icon"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls={MENU_ID}
          onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {isOpen && (
        <nav
          id={MENU_ID}
          aria-label="Menu"
          className="flex flex-col gap-1 border-t border-border p-3"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              aria-current={
                isRouteActive(pathname, item.href) ? "page" : undefined
              }
              className={cn(
                "flex h-11 items-center gap-3 rounded-control px-3 text-[13px] [&_svg]:size-4",
                isRouteActive(pathname, item.href)
                  ? "bg-primary-soft font-semibold text-primary"
                  : "text-foreground hover:bg-accent",
              )}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ))}

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border px-3 pt-3">
            <p className="min-w-0 truncate text-body-sm text-muted-foreground">
              {user.email}
            </p>
            <SignOutButton>Sign out</SignOutButton>
          </div>
        </nav>
      )}
    </header>
  );
}
