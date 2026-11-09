import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

import { signOutAction } from "../actions";

type SignOutButtonProps = {
  className?: string;
  /** Pass a label for a text button; omit it for an icon-only button. */
  children?: ReactNode;
};

export function SignOutButton({ className, children }: SignOutButtonProps) {
  return (
    <form action={signOutAction}>
      {children ? (
        <Button
          type="submit"
          variant="ghost"
          leadingIcon={<LogOut />}
          className={className}
        >
          {children}
        </Button>
      ) : (
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          className={className}
        >
          <LogOut />
        </Button>
      )}
    </form>
  );
}
