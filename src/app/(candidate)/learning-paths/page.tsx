import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Learning paths" };

export default function LearningPathsPage() {
  return <ComingSoon title="Learning paths" />;
}
