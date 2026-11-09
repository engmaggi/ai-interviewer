import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { NextStep } from "../types";

const MARKER_TONE_CLASSES: Record<NextStep["tone"], string> = {
  brand: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
};

export function NextStepsCard({ steps }: { steps: NextStep[] }) {
  return (
    <Card padding="lg" className="gap-5">
      <CardTitle>Recommended next steps</CardTitle>

      <ol className="flex flex-col gap-5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3.5">
            <span
              aria-hidden
              className={cn(
                "flex size-[34px] shrink-0 items-center justify-center rounded-md text-label-sm",
                MARKER_TONE_CLASSES[step.tone],
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0">
              <p className="text-label-md">{step.title}</p>
              <p className="text-label-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        href="/learning-paths"
        className="mt-auto flex items-center gap-1.5 border-t border-border pt-4 text-label-md text-primary hover:underline"
      >
        View your learning roadmap
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </Card>
  );
}
