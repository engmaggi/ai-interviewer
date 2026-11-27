import {
  ClipboardCheck,
  CircleUserRound,
  LayoutDashboard,
  MessageSquare,
  Search,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { NavIconName } from "@/config/navigation";

const navIcons: Record<NavIconName, LucideIcon> = {
  overview: LayoutDashboard,
  assessments: ClipboardCheck,
  interview: MessageSquare,
  skills: CircleUserRound,
  learning: TrendingUp,
  jobs: Search,
  users: Users,
};

export function NavIcon({
  name,
  className,
}: {
  name: NavIconName;
  className?: string;
}) {
  const Icon = navIcons[name];
  return <Icon aria-hidden className={className} />;
}
