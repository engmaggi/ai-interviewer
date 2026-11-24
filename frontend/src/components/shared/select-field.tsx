"use client";

import { useId, type ComponentProps } from "react";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SelectFieldProps = Omit<ComponentProps<typeof Select>, "id"> & {
  label: string;
  helperText?: string;
  /** Validation message. Sets aria-invalid and replaces the helper text. */
  error?: string;
};

/** Label + native select + helper/error message, matching `FormField`. Works with React Hook Form's `register`. */
export function SelectField({
  label,
  helperText,
  error,
  className,
  children,
  ...selectProps
}: SelectFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? helperText;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>

      <Select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...selectProps}
      >
        {children}
      </Select>

      {message && (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={cn(
            "text-[11px]",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
