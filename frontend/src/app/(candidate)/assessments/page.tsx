import type { Metadata } from "next";
import Link from "next/link";

import { ComingSoon } from "@/components/shared/coming-soon";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Assessments" };

export default function AssessmentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <ComingSoon title="Assessments" />
      <Link
        href="/assessments/playground"
        className={buttonVariants({ variant: "outline", size: "md" })}
      >
        Open code IDE playground
      </Link>
    </div>
  );
}
