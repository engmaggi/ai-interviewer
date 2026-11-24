"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

import { authApi } from "../api";

type SignOutButtonProps = {
  className?: string;
  /** Pass a label for a text button; omit it for an icon-only button. */
  children?: ReactNode;
};

export function SignOutButton({ className, children }: SignOutButtonProps) {
  const router = useRouter();

  const signOut = useMutation({
    mutationFn: authApi.logout,
    // Logout is idempotent: leave the app even if the request failed.
    onSettled: () => {
      router.replace("/sign-in");
      router.refresh();
    },
  });

  if (children) {
    return (
      <Button
        variant="ghost"
        leadingIcon={<LogOut />}
        loading={signOut.isPending}
        onClick={() => signOut.mutate()}
        className={className}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      loading={signOut.isPending}
      onClick={() => signOut.mutate()}
      className={className}
    >
      {!signOut.isPending && <LogOut />}
    </Button>
  );
}
