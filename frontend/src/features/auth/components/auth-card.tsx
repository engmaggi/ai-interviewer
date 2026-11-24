import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/** Shared surface for sign in, register and verify email (Figma "Authentication"). */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card padding="lg" className="gap-3 rounded-[18px]">
      <h1 className="text-heading-lg font-semibold">{title}</h1>
      <p className="text-body-md text-muted-foreground">{description}</p>
      {children}
    </Card>
  );
}
