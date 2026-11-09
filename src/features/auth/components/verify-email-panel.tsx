"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";

import { resendVerificationAction } from "../actions";
import { AuthCard } from "./auth-card";

const RESEND_COOLDOWN_SECONDS = 60;

type VerifyEmailPanelProps = {
  email?: string;
  /** `expired` when the verification link was already used or timed out. */
  status?: "pending" | "expired";
};

export function VerifyEmailPanel({
  email,
  status = "pending",
}: VerifyEmailPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  }>();
  const [isPending, startTransition] = useTransition();

  const isExpired = status === "expired";

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
    setFeedback(undefined);

    startTransition(async () => {
      const result = await resendVerificationAction(email);

      if (result.ok) {
        setFeedback({
          type: "success",
          message: "A new verification link is on its way.",
        });
        setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Something went wrong.",
        });
      }
    });
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

      {email ? (
        <Button
          size="lg"
          loading={isPending}
          disabled={secondsLeft > 0}
          onClick={handleResend}
          className="w-full"
        >
          {secondsLeft > 0
            ? `Resend available in ${secondsLeft}s`
            : "Resend verification email"}
        </Button>
      ) : null}

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
