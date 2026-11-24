import { Suspense } from "react";
import type { Metadata } from "next";

import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; status?: string }>;
}) {
  return (
    <Suspense fallback={<VerifyEmailPanel />}>
      <VerifyEmailFromParams searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyEmailFromParams({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; status?: string }>;
}) {
  const { email, status } = await searchParams;

  return (
    <VerifyEmailPanel
      email={email}
      status={status === "expired" ? "expired" : "pending"}
    />
  );
}
