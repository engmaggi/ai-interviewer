import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Job matches" };

export default function JobMatchesPage() {
  return <ComingSoon title="Job matches" />;
}
