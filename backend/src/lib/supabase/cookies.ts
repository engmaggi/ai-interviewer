import type { CookieOptions } from "@supabase/ssr";

/**
 * @supabase/ssr's defaults let JavaScript read the session cookies (needed only if
 * the browser talks to Supabase directly). Our UI talks to /api/* instead, so we
 * lock the cookies down: HttpOnly means injected scripts (XSS) cannot steal the
 * session; Secure means they are only sent over HTTPS in production.
 */
export function hardenCookie(options: CookieOptions): CookieOptions {
  return { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production" };
}
