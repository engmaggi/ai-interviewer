import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type LevelSummaryCardProps = {
  assessedLevel: string;
  targetLevel: string;
};

export function LevelSummaryCard({
  assessedLevel,
  targetLevel,
}: LevelSummaryCardProps) {
  return (
    <Card padding="lg" className="gap-1.5">
      <p className="text-label-sm text-muted-foreground uppercase">
        Your assessed level
      </p>
      <h2 className="text-heading-lg">{assessedLevel}</h2>
      <p className="text-body-sm text-muted-foreground">
        Based on your latest official assessment
      </p>
      <Badge status="brand" className="mt-3">
        Target: {targetLevel}
      </Badge>
    </Card>
  );
}
