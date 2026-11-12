import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, supabaseSecretKey } from "@/lib/env";

/**
 * Supabase client with the SECRET key: it bypasses Row Level Security and can
 * manage users (create, delete…). The `server-only` import above makes the build
 * fail if any browser code ever imports this file.
 *
 * Use it only inside services, only after the caller was authorised (requireAdmin).
 */
export function createSupabaseAdminClient() {
  return createClient(publicEnv().NEXT_PUBLIC_SUPABASE_URL, supabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
