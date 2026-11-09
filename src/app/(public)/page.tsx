import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";

/**
 * DUMMY public home. Replace with the real landing page once its design is ready.
 * Signed-in users never see it: the proxy redirects `/` to `/overview`.
 */
export default function PublicHomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start justify-center gap-6 px-6 py-16">
      <Logo className="text-[28px] font-semibold text-primary" />

      <h1 className="text-display-lg">Practice. Get assessed. Grow.</h1>

      <p className="max-w-xl text-body-md text-muted-foreground">
        Orbit helps frontend developers prove their skills with real code, a
        voice interview about it, and a personal learning roadmap.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link href="/register" className={buttonVariants({ size: "lg" })}>
          Create account
        </Link>
        <Link
          href="/sign-in"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
