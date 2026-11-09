import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type SidebarItemProps = {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
};

/** Figma "Sidebar Item / Orbit Editable". Active state is driven by the current route. */
export function SidebarItem({
  icon,
  label,
  href,
  active = false,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-[38px] items-center gap-2.5 rounded-md px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-primary [&_svg]:size-4 [&_svg]:shrink-0",
        active
          ? "bg-sidebar-accent text-label-md text-sidebar-accent-foreground"
          : "text-body-sm text-sidebar-foreground hover:bg-sidebar-accent/40 [&_svg]:text-sidebar-muted",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}
