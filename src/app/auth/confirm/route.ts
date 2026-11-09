import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Email verification landing route. The link is verified on the server
 * (single-use, expiring token); a client-side click is never treated as proof.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  if (!getSupabaseEnv())
    return NextResponse.redirect(new URL("/sign-in", origin));

  const supabase = await createClient();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  let hasError = true;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    hasError = Boolean(error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    hasError = Boolean(error);
  }

  const destination = hasError ? "/verify-email?status=expired" : "/overview";

  return NextResponse.redirect(new URL(destination, origin));
}
