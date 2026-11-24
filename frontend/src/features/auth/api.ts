import { api } from "@/lib/api/client";
import type { Profile } from "@/types/user";

import type {
  ForgotPasswordValues,
  RegisterValues,
  SignInValues,
} from "./schemas";

type WithCaptcha<T> = T & { captchaToken: string };
type MessageResponse = { message: string };

/** Browser-side calls to the backend auth endpoints. Session cookies are set by the backend. */
export const authApi = {
  login: (input: WithCaptcha<SignInValues>) =>
    api.post<Profile>("/api/auth/login", input),

  register: (input: WithCaptcha<RegisterValues>) =>
    api.post<MessageResponse>("/api/auth/register", input),

  forgotPassword: (input: WithCaptcha<ForgotPasswordValues>) =>
    api.post<MessageResponse>("/api/auth/forgot-password", input),

  /** Requested from the backend team; returns 404 until it exists. */
  resendVerification: (input: WithCaptcha<{ email: string }>) =>
    api.post<MessageResponse>("/api/auth/resend-verification", input),

  logout: () => api.post<void>("/api/auth/logout"),
};

export function verifyEmailPath(email: string) {
  return `/verify-email?email=${encodeURIComponent(email)}`;
}
