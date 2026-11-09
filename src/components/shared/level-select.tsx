"use client";

import { useId } from "react";

import { RadioGroup, RadioGroupOption } from "@/components/ui/radio-group";
import {
  DEVELOPER_LEVELS,
  DEVELOPER_LEVEL_LABELS,
  type DeveloperLevel,
} from "@/lib/constants/user";

type LevelSelectProps = {
  label?: string;
  name?: string;
  value?: DeveloperLevel;
  onValueChange: (level: DeveloperLevel) => void;
  error?: string;
  disabled?: boolean;
};

/** Figma "Role Option" group: single-select Junior / Mid / Senior with radio semantics. */
export function LevelSelect({
  label = "Current developer level",
  name,
  value,
  onValueChange,
  error,
  disabled,
}: LevelSelectProps) {
  const labelId = useId();
  const errorId = `${labelId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="text-[13px] font-semibold text-foreground">
        {label}
      </p>

      <RadioGroup
        name={name}
        value={value ?? ""}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        onValueChange={(next) => onValueChange(next as DeveloperLevel)}
      >
        {DEVELOPER_LEVELS.map((level) => (
          <RadioGroupOption key={level} value={level}>
            {DEVELOPER_LEVEL_LABELS[level]}
          </RadioGroupOption>
        ))}
      </RadioGroup>

      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
