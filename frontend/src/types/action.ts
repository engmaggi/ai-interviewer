/** Shared return shape for Server Actions. Success paths usually redirect instead of returning. */
export interface ActionResult {
  ok?: boolean;
  /** Summary shown at the top of the form. */
  error?: string;
  /** Per-field messages keyed by form field name. */
  fieldErrors?: Record<string, string>;
}
