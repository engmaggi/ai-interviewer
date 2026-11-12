import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /auth/confirm — the target of the links in our emails (confirm signup, reset password).
// Supabase puts a one-time `token_hash` in the link; we exchange it for a session cookie.
const allowedTypes = new Set(["email", "signup", "recovery", "invite", "email_change"]);
type OtpType = "email" | "signup" | "recovery" | "invite" | "email_change";

/** Only allow redirects to a path on OUR site (prevents open-redirect phishing links). */
function safeNextPath(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));
  const appUrl = publicEnv().NEXT_PUBLIC_APP_URL;

  if (tokenHash && type && allowedTypes.has(type)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type: type as OtpType, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, appUrl));
  }

  // Invalid, expired or already-used link. The frontend can show a friendly message for this flag.
  return NextResponse.redirect(new URL("/?auth_error=invalid_or_expired_link", appUrl));
}
