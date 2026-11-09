"use client";

import { useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = Omit<ComponentProps<typeof Input>, "id"> & {
  label: string;
  helperText?: string;
  /** Validation message. Sets aria-invalid and replaces the helper text. */
  error?: string;
};

/**
 * Figma "Input / Orbit Editable": label + input + helper/error message.
 * Works with React Hook Form: `<FormField label="Email" {...register("email")} error={errors.email?.message} />`.
 * Password fields get a show/hide toggle.
 */
export function FormField({
  label,
  helperText,
  error,
  required,
  className,
  type = "text",
  ...inputProps
}: FormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = type === "password";
  const message = error ?? helperText;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden className="text-destructive">
            {" "}
            *
          </span>
        )}
      </Label>

      <div className="relative">
        <Input
          id={id}
          type={isPassword && isPasswordVisible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={message ? messageId : undefined}
          className={isPassword ? "pr-10" : undefined}
          {...inputProps}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-control text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {isPasswordVisible ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        )}
      </div>

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
