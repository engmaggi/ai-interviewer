"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormField } from "@/components/shared/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { signInAction } from "../actions";
import { signInSchema, type SignInValues } from "../schemas";
import { AuthCard } from "./auth-card";

export function SignInForm() {
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);

    startTransition(async () => {
      const result = await signInAction(values);

      setServerError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof SignInValues, { message });
      }
    });
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

        <Button type="submit" size="lg" loading={isPending} className="w-full">
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
