"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { deleteUserAction } from "../actions";
import type { AdminUser } from "../types";

export function DeleteUserDialog({ user }: { user: AdminUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen);
    if (!nextOpen) setError(undefined);
  }

  function handleDelete() {
    setError(undefined);

    startTransition(async () => {
      const result = await deleteUserAction(user.id);

      if (result.ok) {
        setIsOpen(false);
        return;
      }

      setError(result.error);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${user.fullName}`}
            className="text-destructive hover:bg-destructive-soft"
          />
        }
      >
        <Trash2 />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this user?</DialogTitle>
          <DialogDescription>
            {user.fullName} ({user.email}) will lose access and their profile
            will be removed. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        {error && <Alert>{error}</Alert>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={handleDelete}
          >
            Delete user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
