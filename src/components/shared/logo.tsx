import { cn } from "@/lib/utils";

/** Orbit wordmark. Color and size come from the parent via className. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("text-heading-lg tracking-tight", className)}>
      orbit
    </span>
  );
}
