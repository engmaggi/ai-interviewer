"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";

export function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  );
}

/** Figma "Role Option": a selectable pill with radio semantics and keyboard navigation. */
export function RadioGroupOption({
  className,
  children,
  ...props
}: Radio.Root.Props) {
  return (
    <Radio.Root
      data-slot="radio-group-option"
      className={cn(
        "flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40 data-checked:border-primary data-checked:bg-primary-soft data-checked:text-primary data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </Radio.Root>
  );
}
