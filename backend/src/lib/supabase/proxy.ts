import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hardenCookie } from "./cookies";

/**
 * Keeps the session alive. Access tokens are short-lived (1 hour by default);
 * on every request we ask Supabase to validate/refresh them and we write the
 * new tokens back into the cookies of BOTH the request and the response.
 *
 * This does NOT decide who may access what — that is done by the guards in
 * src/lib/auth/guards.ts, inside each route handler.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, hardenCookie(options)));
        },
      },
    },
  );

  // Do not put any code between createServerClient and getClaims():
  // getClaims() is what triggers the refresh.
  await supabase.auth.getClaims();

  return response;
}
