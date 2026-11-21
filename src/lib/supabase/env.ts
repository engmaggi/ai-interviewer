/** Returns the public Supabase credentials, or null while they are not configured (e.g. before `.env.local` exists). */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return null;

  return { url, publishableKey };
}

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured yet. Add the keys to .env.local and restart the dev server.";
