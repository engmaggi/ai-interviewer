import type { AuthError } from "@supabase/supabase-js";
import {
  AppError,
  ForbiddenError,
  RateLimitError,
  UnauthorizedError,
  UpstreamError,
  ValidationError,
} from "@/lib/errors";

/**
 * Translates a Supabase Auth error into one of OUR errors, so the rest of the app
 * (and the API clients) never depend on Supabase's wording.
 * Full list of codes: https://supabase.com/docs/guides/auth/debugging/error-codes
 */
export function mapAuthError(error: AuthError): AppError {
  switch (error.code) {
    case "captcha_failed":
      return new ValidationError("Captcha verification failed. Please try again.", "CAPTCHA_FAILED");
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
    case "over_sms_send_rate_limit":
      return new RateLimitError();
    case "weak_password":
      return new ValidationError("This password is too weak.", "WEAK_PASSWORD");
    case "same_password":
      return new ValidationError("The new password must be different from the old one.", "SAME_PASSWORD");
    case "invalid_credentials":
      // Same message for "unknown email" and "wrong password" on purpose.
      return new UnauthorizedError("Invalid email or password.", "INVALID_CREDENTIALS");
    case "email_not_confirmed":
      return new ForbiddenError("Please confirm your email address first.", "EMAIL_NOT_CONFIRMED");
    case "user_banned":
      return new ForbiddenError("This account is disabled.", "ACCOUNT_DISABLED");
    case "session_not_found":
    case "session_expired":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
    case "bad_jwt":
    case "user_not_found":
      return new UnauthorizedError("Your session is invalid or has expired.", "SESSION_INVALID");
    default:
      console.error("[supabase auth error]", error.status, error.code, error.message);
      if (error.status && error.status >= 400 && error.status < 500) {
        return new ValidationError("The authentication request was rejected.", "AUTH_REJECTED");
      }
      return new UpstreamError("The authentication service is unavailable. Please try again.");
  }
}
