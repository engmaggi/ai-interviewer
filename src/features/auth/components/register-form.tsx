"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormField } from "@/components/shared/form-field";
import { LevelSelect } from "@/components/shared/level-select";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { registerAction } from "../actions";
import { registerSchema, type RegisterValues } from "../schemas";
import { AuthCard } from "./auth-card";

export function RegisterForm() {
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);

    startTransition(async () => {
      const result = await registerAction(values);

      setServerError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof RegisterValues, { message });
      }
    });
  });

  return (
    <AuthCard
      title="Create your Orbit account"
      description="Set up your profile to get an assessment matched to your experience."
    >
      <form onSubmit={onSubmit} noValidate className="mt-2 flex flex-col gap-4">
        {serverError && <Alert>{serverError}</Alert>}

        <FormField
          label="Full name"
          autoComplete="name"
          placeholder="Your name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <Controller
          control={control}
          name="level"
          render={({ field }) => (
            <LevelSelect
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.level?.message}
            />
          )}
        />

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
          autoComplete="new-password"
          placeholder="Create a password"
          helperText="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" size="lg" loading={isPending} className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-[11px] text-muted-foreground">
        By creating an account, you agree to Orbit&apos;s Terms of Service and
        Privacy Policy.
      </p>

      <p className="text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
