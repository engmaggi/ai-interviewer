import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressFillVariants = cva("h-full rounded-full", {
  variants: {
    tone: {
      success: "bg-success",
      warning: "bg-warning",
      brand: "bg-primary",
    },
  },
  defaultVariants: {
    tone: "brand",
  },
});

type ProgressProps = VariantProps<typeof progressFillVariants> & {
  value: number;
  max: number;
  label: string;
  className?: string;
};

/** Thin skill/completion track (Figma "Progress / Skill Track"). */
export function Progress({
  value,
  max,
  tone,
  label,
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={progressFillVariants({ tone })}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
