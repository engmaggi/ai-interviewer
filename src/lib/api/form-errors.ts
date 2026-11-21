import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "./client";

const INVALID_FIELDS_MESSAGE = "Check the highlighted fields and try again.";
const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Puts the backend's per-field messages on the matching form fields and returns
 * the summary to show above the form.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldNames: readonly Path<T>[],
): string {
  if (!(error instanceof ApiError)) return UNEXPECTED_ERROR_MESSAGE;

  let hasFieldError = false;
  for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
    if (!fieldNames.includes(field as Path<T>)) continue;

    setError(field as Path<T>, { message });
    hasFieldError = true;
  }

  return hasFieldError ? INVALID_FIELDS_MESSAGE : error.message;
}
