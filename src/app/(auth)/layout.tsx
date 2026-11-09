import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center px-6 py-9 md:justify-center">
      <div className="flex w-full max-w-[390px] flex-col gap-4">
        <Link
          href="/"
          aria-label="Orbit home"
          className="w-fit rounded-control text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Logo className="text-[28px] font-semibold" />
        </Link>

        {children}
      </div>
    </main>
  );
}
