import type { Metadata } from "next";

import { requireUser } from "@/features/auth/server/session";
import { LevelSummaryCard } from "@/features/overview/components/level-summary-card";
import { NextStepsCard } from "@/features/overview/components/next-steps-card";
import { SkillProfileCard } from "@/features/overview/components/skill-profile-card";
import { StatCard } from "@/features/overview/components/stat-card";
import { getOverviewData } from "@/features/overview/data";
import { getFirstName } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const user = await requireUser();
  const overview = getOverviewData();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-heading-lg">
          Welcome back, {getFirstName(user.fullName)} 👋
        </h1>
        <p className="text-body-sm text-muted-foreground">
          Your frontend career snapshot and next best steps.
        </p>
      </header>

      <LevelSummaryCard
        assessedLevel={overview.assessedLevel}
        targetLevel={overview.targetLevel}
      />

      <section aria-label="Key metrics" className="grid gap-4 md:grid-cols-3">
        {overview.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <SkillProfileCard skills={overview.skills} />
        <NextStepsCard steps={overview.nextSteps} />
      </div>
    </div>
  );
}
