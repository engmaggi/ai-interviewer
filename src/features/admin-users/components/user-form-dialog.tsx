"use client";

import { useId, useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormField } from "@/components/shared/form-field";
import { LevelSelect } from "@/components/shared/level-select";
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { passwordSchema } from "@/features/auth/schemas";
import { USER_ROLES, USER_ROLE_LABELS } from "@/lib/constants/user";

import { createUserAction, updateUserAction } from "../actions";
import { userFormSchema, type UserFormValues } from "../schemas";
import type { AdminUser } from "../types";

type UserFormDialogProps = {
  /** Omit to create a user; pass a user to edit it. */
  user?: AdminUser;
  currentUserId?: string;
};

export function UserFormDialog({ user, currentUserId }: UserFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {user ? (
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${user.fullName}`}
            />
          }
        >
          <Pencil />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button leadingIcon={<Plus />} />}>
          Add user
        </DialogTrigger>
      )}

      <DialogContent>
        {isOpen && (
          <UserForm
            user={user}
            isSelf={user ? user.id === currentUserId : false}
            onDone={() => setIsOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type UserFormProps = {
  user?: AdminUser;
  isSelf: boolean;
  onDone: () => void;
};

/** Mounted only while the dialog is open, so every open starts from fresh values. */
function UserForm({ user, isSelf, onDone }: UserFormProps) {
  const roleFieldId = useId();
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      level: user?.level ?? "junior",
      role: user?.role ?? "candidate",
      password: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);

    if (!user) {
      const passwordResult = passwordSchema.safeParse(values.password);
      if (!passwordResult.success) {
        setError("password", {
          message: passwordResult.error.issues[0].message,
        });
        return;
      }
    }

    startTransition(async () => {
      const result = user
        ? await updateUserAction({ ...values, id: user.id })
        : await createUserAction({
            ...values,
            password: values.password ?? "",
          });

      if (result.ok) {
        onDone();
        return;
      }

      setServerError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof UserFormValues, { message });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{user ? "Edit user" : "Add user"}</DialogTitle>
        <DialogDescription>
          {user
            ? "Update this person's details and access."
            : "Create an account that is already verified and ready to sign in."}
        </DialogDescription>
      </DialogHeader>

      {serverError && <Alert>{serverError}</Alert>}

      <FormField
        label="Full name"
        autoComplete="off"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <FormField
        label="Email address"
        type="email"
        autoComplete="off"
        error={errors.email?.message}
        {...register("email")}
      />

      {!user && (
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          helperText="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register("password")}
        />
      )}

      <Controller
        control={control}
        name="level"
        render={({ field }) => (
          <LevelSelect
            label="Developer level"
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.level?.message}
          />
        )}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={roleFieldId}>Role</Label>
        <Select id={roleFieldId} disabled={isSelf} {...register("role")}>
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {USER_ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
        {isSelf && (
          <p className="text-[11px] text-muted-foreground">
            You can&apos;t change your own role.
          </p>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" loading={isPending}>
          {user ? "Save changes" : "Create user"}
        </Button>
      </DialogFooter>
    </form>
  );
}
