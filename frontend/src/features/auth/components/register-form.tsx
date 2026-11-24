"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormField } from "@/components/shared/form-field";
import { LevelSelect } from "@/components/shared/level-select";
import { SelectField } from "@/components/shared/select-field";
import { Turnstile, useCaptcha } from "@/components/shared/turnstile";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { developerRolesQueryOptions } from "@/features/developer-roles/api";
import { applyApiError } from "@/lib/api/form-errors";
import { MAX_YEARS_OF_EXPERIENCE } from "@/lib/constants/user";

import { authApi, verifyEmailPath } from "../api";
import { registerSchema, type RegisterValues } from "../schemas";
import { AuthCard } from "./auth-card";

const FIELD_NAMES = [
  "displayName",
  "developerRole",
  "targetSeniority",
  "yearsOfExperience",
  "email",
  "password",
] as const;

export function RegisterForm() {
  const router = useRouter();
  const captcha = useCaptcha();
  const [serverError, setServerError] = useState<string>();
  const roles = useQuery(developerRolesQueryOptions);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      developerRole: "",
      email: "",
      password: "",
    },
  });

  const createAccount = useMutation({
    mutationFn: authApi.register,
    // 202 for new AND already-registered emails, so accounts can't be enumerated.
    onSuccess: (_data, { email }) => router.push(verifyEmailPath(email)),
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
    createAccount.mutate({ ...values, captchaToken: captcha.token });
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
          error={errors.displayName?.message}
          {...register("displayName")}
        />

        <SelectField
          label="Developer role"
          disabled={!roles.data}
          helperText={
            roles.isError ? "We couldn't load the roles. Refresh to try again." : undefined
          }
          error={errors.developerRole?.message}
          {...register("developerRole")}
        >
          <option value="" disabled>
            {roles.isPending ? "Loading roles…" : "Choose your role"}
          </option>
          {roles.data?.map((role) => (
            <option key={role.code} value={role.code}>
              {role.label}
            </option>
          ))}
        </SelectField>

        <Controller
          control={control}
          name="targetSeniority"
          render={({ field }) => (
            <LevelSelect
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.targetSeniority?.message}
            />
          )}
        />

        <FormField
          label="Years of experience"
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_YEARS_OF_EXPERIENCE}
          placeholder="0"
          error={errors.yearsOfExperience?.message}
          {...register("yearsOfExperience", { valueAsNumber: true })}
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

        <Turnstile key={captcha.widgetKey} onTokenChange={captcha.setToken} />

        <Button
          type="submit"
          size="lg"
          loading={createAccount.isPending}
          className="w-full"
        >
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
