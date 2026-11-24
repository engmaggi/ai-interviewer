/** Shown while the session is being read (required by Cache Components). */
export function ShellFallback() {
  return (
    <div
      className="min-h-dvh bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}
