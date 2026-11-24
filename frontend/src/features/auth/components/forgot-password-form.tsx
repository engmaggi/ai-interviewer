"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormField } from "@/components/shared/form-field";
import { Turnstile, useCaptcha } from "@/components/shared/turnstile";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { applyApiError } from "@/lib/api/form-errors";

import { authApi } from "../api";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";
import { AuthCard } from "./auth-card";

const FIELD_NAMES = ["email"] as const;

export function ForgotPasswordForm() {
  const captcha = useCaptcha();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const requestReset = useMutation({
    mutationFn: authApi.forgotPassword,
    onError: (error) => {
      setServerError(applyApiError(error, setError, FIELD_NAMES));
      captcha.reset();
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (!captcha.token) {
      setServerError("Complete the security check first.");
      return;
    }

    setServerError(undefined);
    requestReset.mutate({ ...values, captchaToken: captcha.token });
  });

  // The backend answers the same way for unknown emails, so accounts can't be enumerated.
  if (requestReset.isSuccess) {
    return (
      <AuthCard
        title="Check your inbox"
        description={requestReset.data.message}
      >
        <Link
          href="/sign-in"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "w-full",
          })}
        >
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new password."
    >
      <form onSubmit={onSubmit} noValidate className="mt-2 flex flex-col gap-4">
        {serverError && <Alert>{serverError}</Alert>}

        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Turnstile key={captcha.widgetKey} onTokenChange={captcha.setToken} />

        <Button
          type="submit"
          size="lg"
          loading={requestReset.isPending}
          className="w-full"
        >
          Send reset link
        </Button>
      </form>

      <Link
        href="/sign-in"
        className="w-fit text-[13px] font-semibold text-primary hover:underline"
      >
        Back to sign in
      </Link>
    </AuthCard>
  );
}
