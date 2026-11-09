import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Figma "Badge / Orbit Editable". Compact status only — never a substitute for alerts or validation messages.
 * `brand` is the soft purple pill used for targets (e.g. "TARGET: MID-LEVEL").
 */
const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-full whitespace-nowrap",
  {
    variants: {
      status: {
        success: "bg-success px-2.5 py-1 text-body-sm font-medium text-white",
        warning: "bg-warning px-2.5 py-1 text-body-sm font-medium text-white",
        error: "bg-destructive px-2.5 py-1 text-body-sm font-medium text-white",
        neutral:
          "bg-muted px-2.5 py-1 text-body-sm font-medium text-foreground",
        brand:
          "bg-primary-soft px-2.5 py-1.5 text-label-sm text-primary uppercase",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  },
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, status, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ status }), className)}
      {...props}
    />
  );
}
