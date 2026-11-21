"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

import { Turnstile, useCaptcha } from "@/components/shared/turnstile";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

import { authApi } from "../api";
import { AuthCard } from "./auth-card";

const RESEND_COOLDOWN_SECONDS = 60;
const RESEND_UNAVAILABLE_MESSAGE =
  "Resending isn't available yet. Check your spam folder or try again later.";

type VerifyEmailPanelProps = {
  email?: string;
  /** `expired` when the verification link was already used or timed out. */
  status?: "pending" | "expired";
};

export function VerifyEmailPanel({
  email,
  status = "pending",
}: VerifyEmailPanelProps) {
  const captcha = useCaptcha();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  }>();

  const isExpired = status === "expired";

  const resend = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => {
      setFeedback({
        type: "success",
        message: "A new verification link is on its way.",
      });
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.status !== 404
          ? error.message
          : RESEND_UNAVAILABLE_MESSAGE;
      setFeedback({ type: "error", message });
    },
    onSettled: () => captcha.reset(),
  });

  // Counts the resend cooldown down one second at a time.
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timeoutId = setTimeout(
      () => setSecondsLeft((seconds) => seconds - 1),
      1000,
    );
    return () => clearTimeout(timeoutId);
  }, [secondsLeft]);

  function handleResend() {
    if (!email) return;

    if (!captcha.token) {
      setFeedback({ type: "error", message: "Complete the security check first." });
      return;
    }

    setFeedback(undefined);
    resend.mutate({ email, captchaToken: captcha.token });
  }

  return (
    <AuthCard
      title={isExpired ? "Link expired" : "Check your inbox"}
      description={
        isExpired
          ? "This verification link has expired or was already used."
          : "We've sent a verification link to your email address."
      }
    >
      {/* SVG in /public: a plain img avoids next/image's raster pipeline. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/email-illustration.svg" alt="" width={72} height={72} />

      {email && <p className="text-[15px] font-semibold break-all">{email}</p>}

      <p className="text-[13px] text-muted-foreground">
        {isExpired
          ? "Request a new link and open it from the same device."
          : "Open the email from Orbit and click Verify email to activate your account. Check your spam folder if you don't see it."}
      </p>

      {feedback && <Alert variant={feedback.type}>{feedback.message}</Alert>}

      {email && (
        <>
          <Turnstile key={captcha.widgetKey} onTokenChange={captcha.setToken} />

          <Button
            size="lg"
            loading={resend.isPending}
            disabled={secondsLeft > 0}
            onClick={handleResend}
            className="w-full"
          >
            {secondsLeft > 0
              ? `Resend available in ${secondsLeft}s`
              : "Resend verification email"}
          </Button>
        </>
      )}

      <Link
        href="/register"
        className={buttonVariants({
          variant: "outline",
          size: "lg",
          className: "w-full",
        })}
      >
        Change email address
      </Link>

      <p className="text-body-sm text-muted-foreground">
        Didn&apos;t receive the email? You can request a new link after a short
        wait.
      </p>
    </AuthCard>
  );
}
