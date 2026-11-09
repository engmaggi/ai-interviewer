import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv, SUPABASE_NOT_CONFIGURED_MESSAGE } from "./env";

/** Supabase client bound to the current request's cookies (Server Components, Actions, Route Handlers). */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
