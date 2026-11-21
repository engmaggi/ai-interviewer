"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormField } from "@/components/shared/form-field";
import { Turnstile, useCaptcha } from "@/components/shared/turnstile";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { applyApiError } from "@/lib/api/form-errors";

import { authApi, verifyEmailPath } from "../api";
import { signInSchema, type SignInValues } from "../schemas";
import { AuthCard } from "./auth-card";

const FIELD_NAMES = ["email", "password"] as const;

export function SignInForm() {
  const router = useRouter();
  const captcha = useCaptcha();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signIn = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      router.replace("/overview");
      router.refresh();
    },
    onError: (error, { email }) => {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_CONFIRMED") {
        router.push(verifyEmailPath(email));
        return;
      }

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
    signIn.mutate({ ...values, captchaToken: captcha.token });
  });

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue your developer journey."
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

        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Link
          href="/forgot-password"
          className="w-fit text-[13px] font-semibold text-primary hover:underline"
        >
          Forgot password?
        </Link>

        <Turnstile key={captcha.widgetKey} onTokenChange={captcha.setToken} />

        <Button
          type="submit"
          size="lg"
          loading={signIn.isPending}
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      <p className="text-[13px] text-muted-foreground">
        New to Orbit?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
