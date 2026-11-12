import { NotFoundError } from "@/lib/errors";

/**
 * The API docs list every endpoint, so they are on in development and OFF in
 * production unless you opt in with ENABLE_API_DOCS=true (for example on a staging site).
 */
export function assertDocsEnabled() {
  const enabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_API_DOCS === "true";
  if (!enabled) throw new NotFoundError("Not found.");
}
