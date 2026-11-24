import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

const AUTH_PAGES = ["/sign-in", "/register"];
const PUBLIC_PAGES = [
  "/",
  "/sign-in",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

/** Backend paths (rewritten to the backend locally). The backend runs its own auth guards. */
function isBackendPath(pathname: string) {
  return pathname.startsWith("/api/") || pathname.startsWith("/auth/");
}

/**
 * Refreshes the session and gates routes by sign-in state.
 * Role checks (candidate vs admin) happen in the layouts, close to the data.
 */
export async function proxy(request: NextRequest) {
  const { response, user, isConfigured } = await updateSession(request);

  // Before Supabase is configured there is no session to gate on.
  if (!isConfigured) return response;

  const { pathname, searchParams } = request.nextUrl;
  if (isBackendPath(pathname)) return response;

  // The backend's /auth/confirm sends failed email links here.
  if (pathname === "/" && searchParams.has("auth_error")) {
    return redirectTo(request, response, "/verify-email", "?status=expired");
  }

  if (!user && !PUBLIC_PAGES.includes(pathname)) {
    return redirectTo(request, response, "/sign-in");
  }

  if (user && (AUTH_PAGES.includes(pathname) || pathname === "/")) {
    return redirectTo(request, response, "/overview");
  }

  return response;
}

/** Redirects while keeping any refreshed session cookies. */
function redirectTo(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  search = "",
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;

  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);

  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
