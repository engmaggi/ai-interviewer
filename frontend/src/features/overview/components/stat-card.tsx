import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { OverviewStat } from "../types";

const HINT_TONE_CLASSES: Record<OverviewStat["tone"], string> = {
  brand: "text-primary",
  success: "text-success",
  warning: "text-warning",
};

export function StatCard({ label, value, hint, tone }: OverviewStat) {
  return (
    <Card className="gap-1.5">
      <p className="text-label-sm text-muted-foreground uppercase">{label}</p>
      <p className="text-heading-lg">{value}</p>
      <p className={cn("text-label-sm", HINT_TONE_CLASSES[tone])}>{hint}</p>
    </Card>
  );
}
