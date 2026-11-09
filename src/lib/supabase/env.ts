/** Returns the public Supabase credentials, or null while they are not configured (e.g. before `.env.local` exists). */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return { url, anonKey };
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured yet. Add the keys to .env.local and restart the dev server.";
