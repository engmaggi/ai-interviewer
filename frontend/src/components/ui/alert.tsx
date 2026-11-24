import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Inline summary for server errors / success messages (not for compact status — use Badge). */
const alertVariants = cva("rounded-control border px-3 py-2.5 text-body-sm", {
  variants: {
    variant: {
      error: "border-destructive/30 bg-destructive-soft text-destructive",
      success: "border-success/30 bg-success-soft text-success",
    },
  },
  defaultVariants: {
    variant: "error",
  },
});

type AlertProps = ComponentProps<"div"> & VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role={variant === "success" ? "status" : "alert"}
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}
