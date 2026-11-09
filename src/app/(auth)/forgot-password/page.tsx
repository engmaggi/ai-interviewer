import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { AuthCard } from "@/features/auth/components/auth-card";

export const metadata: Metadata = { title: "Reset password" };

/** Placeholder until the reset flow is designed. */
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Password reset isn't available yet. It will be added with the next auth update."
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
