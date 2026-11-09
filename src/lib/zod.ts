import type { ZodError } from "zod";

/** Collapses a ZodError into `{ fieldName: firstMessage }` for form display. */
export function toFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }

  return fieldErrors;
}
