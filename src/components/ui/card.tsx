import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Figma "Card / Orbit Editable" content surface.
 * Compose with CardHeader / CardTitle / CardDescription / CardContent instead of creating a variant per screen.
 */
const cardVariants = cva(
  "flex min-w-0 flex-col gap-2.5 rounded-lg border border-border bg-card text-card-foreground",
  {
    variants: {
      padding: {
        none: "",
        md: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      padding: "md",
    },
  },
);

type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

export function Card({ className, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ padding }), className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-heading-sm text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-[13px] text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-2 pt-2", className)}
      {...props}
    />
  );
}
