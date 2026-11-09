import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

const AUTH_PAGES = ["/sign-in", "/register"];
const PUBLIC_PAGES = [
  "/",
  "/sign-in",
  "/register",
  "/verify-email",
  "/forgot-password",
];

/**
 * Refreshes the session and gates routes by sign-in state.
 * Role checks (candidate vs admin) happen in the layouts, close to the data.
 */
export async function proxy(request: NextRequest) {
  const { response, user, isConfigured } = await updateSession(request);

  // Before Supabase is configured there is no session to gate on.
  if (!isConfigured) return response;

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PAGES.includes(pathname) || pathname.startsWith("/auth/");

  if (!user && !isPublic) return redirectTo(request, response, "/sign-in");

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
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);

  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
