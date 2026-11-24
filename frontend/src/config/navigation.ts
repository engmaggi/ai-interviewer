export type NavIconName =
  "overview" | "assessments" | "skills" | "learning" | "jobs" | "users";

export interface NavItem {
  label: string;
  /** Short label used by the mobile bottom navigation. */
  shortLabel: string;
  href: string;
  icon: NavIconName;
  /** Whether the item appears in the tablet header and the mobile bottom nav. */
  compact: boolean;
}

export const candidateNavItems: NavItem[] = [
  {
    label: "Overview",
    shortLabel: "Home",
    href: "/overview",
    icon: "overview",
    compact: true,
  },
  {
    label: "Assessments",
    shortLabel: "Assess",
    href: "/assessments",
    icon: "assessments",
    compact: true,
  },
  {
    label: "Skill profile",
    shortLabel: "Skills",
    href: "/skill-profile",
    icon: "skills",
    compact: true,
  },
  {
    label: "Learning paths",
    shortLabel: "Paths",
    href: "/learning-paths",
    icon: "learning",
    compact: false,
  },
  {
    label: "Job matches",
    shortLabel: "Jobs",
    href: "/job-matches",
    icon: "jobs",
    compact: true,
  },
];

export const adminNavItems: NavItem[] = [
  {
    label: "Users",
    shortLabel: "Users",
    href: "/admin/users",
    icon: "users",
    compact: true,
  },
  {
    label: "Candidate view",
    shortLabel: "Site",
    href: "/overview",
    icon: "overview",
    compact: true,
  },
];
