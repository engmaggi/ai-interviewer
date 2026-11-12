import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for code running in the browser (React client components).
 * The backend in this repo does not use it — our UI talks to /api/* — but the
 * frontend team can import it if they ever need the Supabase client directly.
 * It only ever receives the PUBLISHABLE key.
 * NOTE: session cookies are HttpOnly (see cookies.ts), so this client cannot see the
 * session; use /api/* for anything that needs the logged-in user.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
