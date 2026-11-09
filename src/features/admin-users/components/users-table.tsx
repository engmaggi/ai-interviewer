import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEVELOPER_LEVEL_LABELS, USER_ROLE_LABELS } from "@/lib/constants/user";

import type { AdminUser } from "../types";
import { DeleteUserDialog } from "./delete-user-dialog";
import { UserFormDialog } from "./user-form-dialog";

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

type UsersTableProps = {
  users: AdminUser[];
  currentUserId: string;
};

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>User</TableHead>
          <TableHead className="hidden sm:table-cell">Level</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="hidden md:table-cell">Joined</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={5}
              className="py-10 text-center text-muted-foreground"
            >
              No users yet.
            </TableCell>
          </TableRow>
        )}

        {users.map((user) => {
          const isSelf = user.id === currentUserId;

          return (
            <TableRow key={user.id}>
              <TableCell className="max-w-[16rem]">
                <p className="truncate text-label-md">{user.fullName || "—"}</p>
                <p className="truncate text-body-sm text-muted-foreground">
                  {user.email}
                </p>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                {DEVELOPER_LEVEL_LABELS[user.level]}
              </TableCell>

              <TableCell>
                <Badge status={user.role === "admin" ? "brand" : "neutral"}>
                  {USER_ROLE_LABELS[user.role]}
                </Badge>
              </TableCell>

              <TableCell className="hidden text-muted-foreground md:table-cell">
                {dateFormatter.format(new Date(user.createdAt))}
              </TableCell>

              <TableCell>
                <div className="flex justify-end gap-1">
                  <UserFormDialog user={user} currentUserId={currentUserId} />
                  {!isSelf && <DeleteUserDialog user={user} />}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
